from flask import Blueprint, request, jsonify
from services.government_service import authenticate_government_user
from flask_jwt_extended import create_access_token

government_bp = Blueprint("government", __name__)

# Government login only
@government_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(force=True)
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"success": False, "message": "Missing fields"}), 400

    user = authenticate_government_user(email, password)
    if not user:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    # ✅ create JWT with role inside identity
    access_token = create_access_token(identity={"email": user["email"], "role": "government"})

    safe_user = {
        "name": user["name"],
        "email": user["email"],
        "role": "government"  # 👈 important
    }

    return jsonify({
        "success": True,
        "message": "Login successful",
        "user": safe_user,
        "access_token": access_token
    }), 200
