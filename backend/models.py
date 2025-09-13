from datetime import datetime
from extensions import db
from sqlalchemy.ext.hybrid import hybrid_property

class User(db.Model):
    id = db.Column(db.String, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)

    # ✅ relationship to reports
    reports = db.relationship("Report", backref="user", lazy=True)

    # ✅ green credits always computed from reports
    @hybrid_property
    def green_credits(self):
        return sum(r.awarded_credits or 0 for r in self.reports)


class Report(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    # ✅ Link to user
    user_id = db.Column(db.String, db.ForeignKey("user.id"), nullable=True)
    user_name = db.Column(db.String(80))  # can keep for fast lookups (optional)

    # ✅ Report details
    description = db.Column(db.Text, nullable=False)
    image_filename = db.Column(db.String(256))
    image_hash = db.Column(db.String(64), index=True)  # for duplicate detection

    # ✅ Location fields
    lat = db.Column(db.Float, nullable=False)
    lng = db.Column(db.Float, nullable=False)

    # ✅ Pollution analysis
    aqi = db.Column(db.Float)
    points = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20), default="pending")
    pollution_confidence = db.Column(db.Float)
    description_match_confidence = db.Column(db.Float)
    details = db.Column(db.JSON)

    # ✅ New fields for validator/government
    precautions = db.Column(db.Text, nullable=True)
    govt_action = db.Column(db.Text, nullable=True)

    # ✅ Rewards
    awarded_credits = db.Column(db.Integer, default=0)

    # ✅ Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_checked_at = db.Column(db.DateTime, default=datetime.utcnow)
