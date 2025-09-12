import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from extensions import db   # ✅ shared db instance


def create_app():
    app = Flask(__name__)

    # --- Config ---
    basedir = os.path.abspath(os.path.dirname(__file__))
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL", f"sqlite:///{os.path.join(basedir, 'breathe_smart.db')}"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # ✅ Secret key for JWT (fallback for local dev)
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "super-secret-key-change-this")

    # --- Uploads ---
    app.config["UPLOAD_FOLDER"] = os.path.join(basedir, "uploads")
    app.config["VERIFIED_FOLDER"] = os.path.join(app.config["UPLOAD_FOLDER"], "verified")
    app.config["REJECTED_FOLDER"] = os.path.join(app.config["UPLOAD_FOLDER"], "rejected")

    # make sure all folders exist
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    os.makedirs(app.config["VERIFIED_FOLDER"], exist_ok=True)
    os.makedirs(app.config["REJECTED_FOLDER"], exist_ok=True)

    # --- CORS (allow frontend origin) ---
    frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    CORS(app, resources={r"/*": {"origins": [frontend_origin, "http://127.0.0.1:5173"]}})

    # --- Initialize DB + JWT ---
    db.init_app(app)
    JWTManager(app)

    # --- Register Blueprints ---
    from routes.auth_routes import auth_bp
    from routes.report_routes import report_bp
    from routes.government_routes import government_bp
    from routes.aqi_routes import aqi_bp   # ✅ AQI routes

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(report_bp, url_prefix="/api/reports")
    app.register_blueprint(government_bp, url_prefix="/api/government")
    app.register_blueprint(aqi_bp, url_prefix="/api/aqi")   # ✅ AQI endpoints

    # --- Auto-create tables ---
    with app.app_context():
        db.create_all()

    return app


# Entry point
app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5001)), debug=True)
