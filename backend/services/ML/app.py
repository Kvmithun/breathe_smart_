import os
import cv2
import numpy as np
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import uuid

# --- Basic Flask App Setup ---
app = Flask(__name__)
basedir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(basedir, 'breathe_smart.db')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + db_path
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize the database
db = SQLAlchemy(app)

w
# --- Database Model Definition ---
class User(db.Model):
    id = db.Column(db.String, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    green_credits = db.Column(db.Integer, default=0)


# --- Image Analysis Algorithm ---
WEIGHTS = {
    'smoke_color': 0.05,
    'low_contrast': 0.10,
    'edge_density': 0.85,
    'dark_channel': 0.05
}
VERIFICATION_THRESHOLD = 45


def analyze_image(image_path):
    try:
        img = cv2.imread(image_path)
        if img is None:
            return 0.0, {}

        # 1. Smoke/Haze Color
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        lower_bound = np.array([0, 0, 50])
        upper_bound = np.array([179, 50, 255])
        mask = cv2.inRange(hsv, lower_bound, upper_bound)
        smoke_color_score = (cv2.countNonZero(mask) * 100) / (img.shape[0] * img.shape[1])

        # 2. Low Contrast
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        contrast = gray.std()
        low_contrast_score = max(0, 100 - (contrast / 60 * 100))

        # 3. Edge Density
        edges = cv2.Canny(gray, 100, 200)
        edge_density_score = min(100.0, (np.sum(edges > 0) * 1000) / (img.shape[0] * img.shape[1]))

        # 4. Dark Channel Prior
        b, g, r = cv2.split(img)
        dark_channel = np.minimum(np.minimum(r, g), b)
        dark_channel_score = (np.mean(dark_channel) / 255) * 100

        # Final score
        final_score = (smoke_color_score * WEIGHTS['smoke_color'] +
                       low_contrast_score * WEIGHTS['low_contrast'] +
                       edge_density_score * WEIGHTS['edge_density'] +
                       dark_channel_score * WEIGHTS['dark_channel'])

        details = {
            "smoke_color_score": f"{smoke_color_score:.2f}%",
            "low_contrast_score": f"{low_contrast_score:.2f}%",
            "edge_density_score": f"{edge_density_score:.2f}%",
            "dark_channel_score": f"{dark_channel_score:.2f}%"
        }

        return min(100.0, final_score), details

    except Exception as e:
        print(f"Error in image analysis: {e}")
        return 0.0, {}


# --- Auto-create Database ---
with app.app_context():
    if not os.path.exists(db_path):
        db.create_all()
        print("Database created.")


# --- API Endpoints ---
@app.route('/verify-report', methods=['POST'])
def verify_report():
    if 'image' not in request.files or 'user_id' not in request.form:
        return jsonify({"error": "Missing image file or user_id"}), 400

    image_file = request.files['image']
    user_id = request.form['user_id']
    username = request.form.get('username', 'anonymous')

    filename = str(uuid.uuid4()) + "_" + image_file.filename
    image_path = os.path.join(UPLOAD_FOLDER, filename)
    image_file.save(image_path)

    try:
        confidence, details = analyze_image(image_path)
    finally:
        os.remove(image_path)

    if confidence > VERIFICATION_THRESHOLD:
        user = User.query.get(user_id)
        if not user:
            user = User(id=user_id, username=username, green_credits=0)
            db.session.add(user)
        user.green_credits += 100
        db.session.commit()

        return jsonify({
            "status": "Verified",
            "confidence": f"{confidence:.2f}",
            "details": details,
            "awarded_credits": 100,
            "new_total_credits": user.green_credits
        }), 200
    else:
        return jsonify({
            "status": "Rejected",
            "confidence": f"{confidence:.2f}",
            "details": details
        }), 200


@app.route('/leaderboard', methods=['GET'])
def leaderboard():
    try:
        top_users = User.query.order_by(User.green_credits.desc()).limit(10).all()
        leaderboard_data = [{"username": user.username, "green_credits": user.green_credits} for user in top_users]
        return jsonify(leaderboard_data)
    except Exception as e:
        return jsonify({"error": f"Could not retrieve leaderboard: {e}"}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5001)
