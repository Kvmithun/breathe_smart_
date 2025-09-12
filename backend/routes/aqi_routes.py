import io
import requests
from flask import Blueprint, request, jsonify, send_file
from services.AQI.main import AQIClinicalService
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

aqi_bp = Blueprint("aqi", __name__)
clinical_service = AQIClinicalService()

WAQI_TOKEN = "e41160d5fba33f215eeb1ae22e570054c56921d3"  # replace with your token

@aqi_bp.route("/", methods=["GET"])
def get_aqi():
    lat = request.args.get("lat")
    lon = request.args.get("lon")

    if not lat or not lon:
        return jsonify({"error": "lat and lon are required"}), 400

    try:
        url = f"https://api.waqi.info/feed/geo:{lat};{lon}/?token={WAQI_TOKEN}"
        response = requests.get(url, timeout=10)
        data = response.json()

        if data.get("status") != "ok":
            return jsonify({"error": "Failed to fetch AQI", "details": data}), 502

        # Standard payload (flattened WAQI response)
        payload = {
            "city": data["data"]["city"]["name"],
            "aqius": data["data"]["aqi"],
            "mainus": data["data"].get("dominentpol", "unknown"),
            "ts": data["data"]["time"]["s"],
            "iaqi": data["data"].get("iaqi", {})  # 🔹 include pollutant details
        }

        clinical = clinical_service.aggregate_advice(payload)

        # 🔹 Reformatted response to match frontend
        return jsonify({
            "city": payload["city"],
            "current": {
                "aqius": payload["aqius"],
                "dominant_pollutant": payload["mainus"],  # 🔹 renamed here
                "ts": payload["ts"]
            },
            "trend": [],
            "nearby": [],
            "sources": [],
            "clinical": clinical
        }), 200

    except requests.exceptions.Timeout:
        return jsonify({"error": "WAQI API request timed out"}), 504
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 📄 Generate PDF Fact Sheet
@aqi_bp.route("/pdf", methods=["POST"])
def get_pdf():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON body provided"}), 400

        # Create PDF in memory
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        elements = []

        # Title
        elements.append(Paragraph("🌍 AQI Clinical Fact Sheet", styles["Title"]))
        elements.append(Spacer(1, 12))

        summary = data.get("summary", {})
        elements.append(Paragraph(f"<b>Overall Category:</b> {summary.get('overall_category', 'N/A')}", styles["Normal"]))
        elements.append(Paragraph(f"<b>Highest Risk Pollutant:</b> {summary.get('highest_risk_pollutant', 'N/A')}", styles["Normal"]))
        elements.append(Spacer(1, 12))

        # Who should seek care
        elements.append(Paragraph("🩺 Who Should Seek Medical Care:", styles["Heading2"]))
        for item in summary.get("who_should_seek_care", []):
            elements.append(Paragraph(f"- {item}", styles["Normal"]))
        elements.append(Spacer(1, 12))

        # Household measures
        elements.append(Paragraph("🏡 Household Measures:", styles["Heading2"]))
        for item in summary.get("household_measures", []):
            elements.append(Paragraph(f"- {item}", styles["Normal"]))
        elements.append(Spacer(1, 12))

        # Vulnerable groups
        elements.append(Paragraph("👥 Vulnerable Groups:", styles["Heading2"]))
        for item in summary.get("vulnerable_groups", []):
            elements.append(Paragraph(f"- {item}", styles["Normal"]))
        elements.append(Spacer(1, 12))

        # Disclaimer
        elements.append(Paragraph("⚠️ Disclaimer:", styles["Heading2"]))
        elements.append(Paragraph(
            data.get("disclaimer", "This is general guidance only. Seek medical care if symptoms worsen."),
            styles["Normal"]
        ))

        # Build PDF
        doc.build(elements)
        buffer.seek(0)

        return send_file(
            buffer,
            as_attachment=True,
            download_name="aqi_fact_sheet.pdf",
            mimetype="application/pdf"
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500
