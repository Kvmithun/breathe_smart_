import json
import os

# ✅ Always store inside backend/data/users.json
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

USERS_FILE = os.path.join(DATA_DIR, "users.json")


def load_users():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, "r") as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return []
    return []


def save_users(users):
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)


def add_user(name, email, password):
    users = load_users()
    if any(u["email"].lower() == email.lower() for u in users):
        return False, "Email already registered"

    # 👇 Always set role = citizen
    users.append({
        "name": name,
        "email": email,
        "password": password,
        "role": "citizen"
    })
    save_users(users)
    return True, "User registered successfully"


def authenticate_user(email, password):
    users = load_users()
    return next(
        (
            u for u in users
            if u["email"].lower() == email.lower() and u["password"] == password
        ),
        None
    )
