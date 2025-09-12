import json
import os

# ✅ Always store inside backend/data/government_users.json
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

GOV_USERS_FILE = os.path.join(DATA_DIR, "government_users.json")


def load_gov_users():
    if os.path.exists(GOV_USERS_FILE):
        with open(GOV_USERS_FILE, "r") as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return []
    return []


def authenticate_government_user(email, password):
    users = load_gov_users()
    user = next(
        (
            u for u in users
            if u["email"].lower() == email.lower() and u["password"] == password
        ),
        None
    )

    if user:
        # 👇 Ensure government users always have role
        user["role"] = "government"
    return user
