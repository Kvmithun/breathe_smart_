from extensions import db
from app import create_app

app = create_app()

with app.app_context():
    with db.engine.connect() as conn:
        try:
            conn.exec_driver_sql("ALTER TABLE report ADD COLUMN precautions TEXT;")
            print("✅ Added precautions column")
        except Exception as e:
            print("⚠️ precautions column may already exist:", e)

        try:
            conn.exec_driver_sql("ALTER TABLE report ADD COLUMN govt_action TEXT;")
            print("✅ Added govt_action column")
        except Exception as e:
            print("⚠️ govt_action column may already exist:", e)
