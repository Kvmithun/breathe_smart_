# backend/routes/report_routes.py
import os
import json
import uuid
import hashlib
import tempfile
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app, url_for, send_from_directory
from extensions import db
from models import Report
from services.ML.ml_service import verify_image
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename

report_bp = Blueprint("report", __name__)

# --- Thresholds ---
POLLUTION_THRESHOLD_PERCENT = 45.0
DESCRIPTION_THRESHOLD_FRACTION = 0.60


# --- Serve uploaded images (safe) ---
@report_bp.route("/uploads/<status>/<path:filename>")
def uploaded_file(status, filename):
    """
    Serve files from verified/rejected folders.
    Treat 'approved' same as 'verified' (approved reports use same stored file).
    filename may include subfolders (e.g. govt_actions/xxx.jpg)
    """
    if status in ("verified", "approved", "finalized"):
        folder = current_app.config.get("VERIFIED_FOLDER") or current_app.config.get("UPLOAD_FOLDER")
    elif status == "rejected":
        folder = current_app.config.get("REJECTED_FOLDER") or current_app.config.get("UPLOAD_FOLDER")
    else:
        return jsonify({"error": "Invalid status"}), 400

    if not folder:
        return jsonify({"error": "Server misconfigured: upload folder not set"}), 500

    # normalize paths and prevent path traversal
    folder = os.path.abspath(folder)
    requested_path = os.path.abspath(os.path.join(folder, filename))

    # Ensure requested_path is inside folder
    if not (requested_path == folder or requested_path.startswith(folder + os.sep)):
        return jsonify({"error": "Invalid filename"}), 400

    # send_from_directory expects a filename relative to folder
    rel_path = os.path.relpath(requested_path, folder)
    return send_from_directory(folder, rel_path)


# --- Helpers ---
def sha256_bytes(b: bytes) -> str:
    h = hashlib.sha256()
    h.update(b)
    return h.hexdigest()


def get_user_from_json(email: str):
    users_path = os.path.join(current_app.root_path, "data", "users.json")
    users_path = os.path.abspath(users_path)

    if not os.path.exists(users_path):
        raise FileNotFoundError(f"users.json not found at {users_path}")

    with open(users_path) as f:
        users = json.load(f)

    return next((u for u in users if u["email"] == email), None)


def serialize_report(r: Report):
    # copy details so we don't mutate DB object
    details = dict(r.details or {})

    # Prefer DB column values, fallback to JSON
    precautions = r.precautions or details.get("precautions") or ""
    action_taken = r.govt_action or details.get("govt_action") or details.get("action_taken") or ""

    # govt proof filenames stored inside details["govt_proofs"] (list of filenames relative to VERIFIED_FOLDER)
    govt_proofs_filenames = details.get("govt_proofs", []) or []
    govt_proofs_urls = []
    for fn in govt_proofs_filenames:
        try:
            # fn may include a subpath like "govt_actions/govt_xxx.jpg"
            url = url_for("report.uploaded_file", status="approved", filename=fn, _external=True)
            govt_proofs_urls.append(url)
        except Exception:
            # ignore building URL errors (still skip bad entries)
            pass

    # overwrite details["govt_proofs"] with URL list so frontend can use report.details.govt_proofs directly
    details["govt_proofs"] = govt_proofs_urls

    return {
        "id": r.id,
        "username": r.user_name,
        "description": r.description,
        "image_url": url_for("report.uploaded_file", status=r.status, filename=r.image_filename, _external=True) if r.image_filename else None,
        "aqi": r.aqi,
        "points": r.points,
        "status": r.status,
        "lat": r.lat,
        "lng": r.lng,
        "pollution_confidence": r.pollution_confidence,
        "description_match_confidence": r.description_match_confidence,
        "details": details,
        "precautions": precautions,
        "action_taken": action_taken,
        "govt_proofs": govt_proofs_urls,  # also provide top-level convenience field
        "awarded_credits": r.awarded_credits,
        "created_at": r.created_at.isoformat() if r.created_at else None,
        "last_checked_at": r.last_checked_at.isoformat() if r.last_checked_at else None,
    }


def _normalize_pollution_conf(val) -> float:
    if val is None:
        return 0.0
    try:
        v = float(val)
    except Exception:
        return 0.0
    if v <= 1.5:
        return v * 100.0
    return v


def _normalize_description_conf(val) -> float:
    if val is None:
        return 0.0
    try:
        v = float(val)
    except Exception:
        return 0.0
    if v > 1.5:
        return v / 100.0
    return v


# --- Upload Report (unchanged logic) ---
@report_bp.route("/upload", methods=["POST"])
@jwt_required()
def upload_report():
    try:
        identity = get_jwt_identity()
        user = get_user_from_json(identity)

        if not user:
            users_path = os.path.join(current_app.root_path, "data", "users.json")
            if os.path.exists(users_path):
                with open(users_path) as f:
                    users = json.load(f)
                user = next((u for u in users if u["name"] == identity), None)

        if not user:
            return jsonify({"error": f"User not found in users.json for identity={identity}"}), 404

        if "image" not in request.files:
            return jsonify({"error": "No image file uploaded"}), 400

        file = request.files["image"]
        description = request.form.get("description", "").strip()
        lat = request.form.get("lat", type=float)
        lng = request.form.get("lng", type=float)

        if file.filename == "":
            return jsonify({"error": "Empty filename"}), 400

        if lat is None or lng is None:
            return jsonify({"error": "Latitude and longitude are required"}), 400

        file_bytes = file.read()
        if not file_bytes:
            return jsonify({"error": "Uploaded file is empty"}), 400

        img_hash = sha256_bytes(file_bytes)
        existing = Report.query.filter_by(image_hash=img_hash).first()

        def run_ml_on_bytes(b: bytes, description_str: str):
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
            try:
                tmp.write(b)
                tmp.flush()
                tmp.close()
                return verify_image(tmp.name, description_str)
            finally:
                try:
                    os.remove(tmp.name)
                except Exception:
                    pass

        now = datetime.utcnow()

        # --- If duplicate exists ---
        if existing:
            if existing.user_name == user["name"]:
                ml_result = run_ml_on_bytes(file_bytes, description)
                poll_conf_pct = _normalize_pollution_conf(ml_result.get("pollution_confidence"))
                desc_conf_frac = _normalize_description_conf(ml_result.get("description_match_confidence"))

                verified = (poll_conf_pct >= POLLUTION_THRESHOLD_PERCENT) and (desc_conf_frac >= DESCRIPTION_THRESHOLD_FRACTION)
                awarded = ml_result.get("awarded_credits", 0) if verified else 0

                existing.last_checked_at = now
                existing.description = description or existing.description
                existing.pollution_confidence = poll_conf_pct
                existing.description_match_confidence = desc_conf_frac
                details = ml_result.get("details", {}) or {}
                details["_decision"] = {
                    "pollution_conf_pct": poll_conf_pct,
                    "desc_conf_frac": desc_conf_frac,
                    "pollution_threshold": POLLUTION_THRESHOLD_PERCENT,
                    "description_threshold": DESCRIPTION_THRESHOLD_FRACTION,
                    "verified": verified
                }
                existing.details = details
                existing.aqi = ml_result.get("aqi")
                existing.points = ml_result.get("points", 0)
                existing.status = "verified" if verified else "rejected"
                existing.awarded_credits = awarded

                target_folder = current_app.config["VERIFIED_FOLDER"] if verified else current_app.config["REJECTED_FOLDER"]
                os.makedirs(target_folder, exist_ok=True)
                safe_basename = secure_filename(file.filename)
                safe_name = f"{uuid.uuid4().hex}_{safe_basename}"
                save_path = os.path.join(target_folder, safe_name)
                file.seek(0)
                file.save(save_path)
                existing.image_filename = safe_name

                db.session.commit()
                return jsonify(serialize_report(existing)), 200
            else:
                return jsonify({"error": "Duplicate image uploaded by another user"}), 409

        # --- New report ---
        ml_result = run_ml_on_bytes(file_bytes, description)
        poll_conf_pct = _normalize_pollution_conf(ml_result.get("pollution_confidence"))
        desc_conf_frac = _normalize_description_conf(ml_result.get("description_match_confidence"))

        verified = (poll_conf_pct >= POLLUTION_THRESHOLD_PERCENT) and (desc_conf_frac >= DESCRIPTION_THRESHOLD_FRACTION)
        awarded = ml_result.get("awarded_credits", 0) if verified else 0

        target_folder = current_app.config["VERIFIED_FOLDER"] if verified else current_app.config["REJECTED_FOLDER"]
        os.makedirs(target_folder, exist_ok=True)

        safe_basename = secure_filename(file.filename)
        safe_name = f"{uuid.uuid4().hex}_{safe_basename}"
        save_path = os.path.join(target_folder, safe_name)

        file.seek(0)
        file.save(save_path)

        details = ml_result.get("details", {}) or {}
        details["_decision"] = {
            "pollution_conf_pct": poll_conf_pct,
            "desc_conf_frac": desc_conf_frac,
            "pollution_threshold": POLLUTION_THRESHOLD_PERCENT,
            "description_threshold": DESCRIPTION_THRESHOLD_FRACTION,
            "verified": verified
        }

        new_report = Report(
            user_name=user["name"],
            description=description,
            image_filename=safe_name,
            image_hash=img_hash,
            aqi=ml_result.get("aqi"),
            points=ml_result.get("points", 0),
            status="verified" if verified else "rejected",
            pollution_confidence=poll_conf_pct,
            description_match_confidence=desc_conf_frac,
            details=details,
            awarded_credits=awarded,
            created_at=now,
            last_checked_at=now,
            lat=lat,
            lng=lng,
        )

        db.session.add(new_report)
        db.session.commit()

        return jsonify(serialize_report(new_report)), 201

    except Exception as e:
        current_app.logger.error(f"Upload failed: {str(e)}", exc_info=True)
        return jsonify({"error": f"Server error: {str(e)}"}), 500


# --- Get reports for Validator Portal (pending completion) ---
@report_bp.route("/", methods=["GET"])
def get_reports():
    reports = Report.query.filter(Report.status.in_(["approved", "verified"])).all()
    # only show reports where either precautions OR govt_action missing
    visible = [r for r in reports if not (r.precautions and r.govt_action)]
    return jsonify([serialize_report(r) for r in visible]), 200


# --- Validator/Govt updates report ---
@report_bp.route("/<int:report_id>/validate", methods=["PUT"])
def validate_report(report_id):
    """
    Two-step validation supported:
      - Step 1: validator sends only 'precautions' (JSON). Report remains visible.
      - Step 2: govt sends 'action_taken' + proof images (multipart/form-data).
        When both precautions and govt_action exist the report becomes 'finalized'.
    Accepts:
      - JSON: {"status":"approved", "precautions":"..."} or {"status":"approved","action_taken":"..."}
      - multipart/form-data: status, action_taken (or govt_action), proof_images (one or more files).
    """
    report = Report.query.get_or_404(report_id)
    report.details = report.details or {}

    # determine JSON vs multipart
    content_type = (request.content_type or "").lower()
    is_multipart = "multipart/form-data" in content_type

    if is_multipart:
        data = request.form.to_dict()
        files = request.files.getlist("proof_images")
    else:
        data = request.json or {}
        files = []

    # allow missing status: default to 'approved' for convenience
    status = data.get("status", "approved")
    if status not in ["approved", "rejected", "finalized"]:
        return jsonify({"error": "Invalid status"}), 400

    # set base status (may be overridden below)
    report.status = status

    if status == "approved":
        # ---- STEP 1: store precautions if provided ----
        if "precautions" in data:
            prec = data.get("precautions") or ""
            report.precautions = prec
            report.details["precautions"] = prec

        # ---- STEP 2: store govt action if provided ----
        action = data.get("action_taken") or data.get("govt_action")
        if action is not None:
            report.govt_action = action
            report.details["govt_action"] = action

        # ---- handle uploaded proof images (if any) ----
        if files:
            # Save govt proof images into a subfolder 'govt_actions' inside VERIFIED_FOLDER (or UPLOAD_FOLDER)
            saved = report.details.get("govt_proofs", []) or []
            base_folder = current_app.config.get("VERIFIED_FOLDER") or current_app.config.get("UPLOAD_FOLDER")
            if not base_folder:
                current_app.logger.error("No base upload folder configured.")
                return jsonify({"error": "Server misconfigured: upload folder not set"}), 500

            govt_subfolder = os.path.join(base_folder, "govt_actions")
            os.makedirs(govt_subfolder, exist_ok=True)

            for f in files:
                if not f or f.filename == "":
                    continue
                safe_basename = secure_filename(f.filename)
                safe_name = f"govt_{uuid.uuid4().hex}_{safe_basename}"
                save_path = os.path.join(govt_subfolder, safe_name)
                try:
                    f.save(save_path)
                    # store path relative to base_folder using forward slash for URLs
                    saved.append(f"govt_actions/{safe_name}")
                except Exception as e:
                    current_app.logger.error(f"Failed saving govt proof image: {str(e)}", exc_info=True)

            report.details["govt_proofs"] = saved

        # ---- Finalize when both precautions AND govt_action exist ----
        if report.precautions and report.govt_action:
            report.status = "finalized"

    else:  # rejected
        reason = data.get("reason")
        if reason:
            report.details["rejection_reason"] = reason

    db.session.commit()
    return jsonify({"message": f"Report {report.status}", "report": serialize_report(report)}), 200


# --- Govt Portal (finalized reports only) ---
@report_bp.route("/approved", methods=["GET"])
def get_approved_reports():
    reports = Report.query.filter_by(status="finalized").all()
    return jsonify([serialize_report(r) for r in reports]), 200


# --- Leaderboard ---
@report_bp.route("/leaderboard", methods=["GET"])
def leaderboard():
    # Only count valid reports
    reports = Report.query.filter(Report.status.in_(["verified", "approved", "finalized"])).all()
    leaderboard = {}

    for r in reports:
        if not r.user_name:
            continue
        leaderboard.setdefault(r.user_name, 0)
        leaderboard[r.user_name] += r.awarded_credits or 0

    top = sorted(leaderboard.items(), key=lambda x: x[1], reverse=True)[:10]

    return jsonify([
        {"username": name, "green_credits": credits}
        for name, credits in top
    ]), 200
