from flask import Blueprint, request, jsonify
from services.user_service import add_user, authenticate_user
from flask_jwt_extended import create_access_token

auth_bp = Blueprint("auth", __name__)

# ✅ Signup route
@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json(force=True)
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""

    if not name or not email or not password:
        return jsonify({"success": False, "message": "Missing fields"}), 400

    ok, msg = add_user(name, email, password)
    if not ok:
        return jsonify({"success": False, "message": msg}), 400

    return jsonify({"success": True, "message": msg}), 201


# ✅ Login route
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(force=True)
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"success": False, "message": "Missing fields"}), 400

    user = authenticate_user(email, password)
    if not user:
        return jsonify({"success": False, "message": "Invalid email or password"}), 401

    # 🔑 Create JWT with email as identity + role as additional claim
    access_token = create_access_token(
        identity=user["email"],
        additional_claims={"role": "citizen"}
    )

    safe_user = {
        "name": user["name"],
        "email": user["email"],
        "role": "citizen"
    }

    return jsonify({
        "success": True,
        "message": "Login successful",
        "user": safe_user,
        "access_token": access_token
    }), 200
