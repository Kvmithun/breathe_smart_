# services/AQI/main.py

class AQIClinicalService:
    def __init__(self):
        # severity order for AQI categories
        self.severity_order = [
            "Good",
            "Moderate",
            "Unhealthy for Sensitive Groups",
            "Unhealthy",
            "Very Unhealthy",
            "Hazardous",
        ]

    # ✅ Convert raw AQI value into category
    def get_category(self, value):
        if value is None:
            return "Unknown"
        if value <= 50:
            return "Good"
        if value <= 100:
            return "Moderate"
        if value <= 150:
            return "Unhealthy for Sensitive Groups"
        if value <= 200:
            return "Unhealthy"
        if value <= 300:
            return "Very Unhealthy"
        return "Hazardous"

    # ✅ Mask recommendation
    def get_mask_recommendation(self, category):
        if category in ["Good", "Moderate"]:
            return None
        if category in ["Unhealthy for Sensitive Groups", "Unhealthy"]:
            return "Recommended (especially for sensitive groups)."
        return "Strongly recommended."

    # ✅ Immediate actions
    def get_immediate_actions(self, category):
        actions = {
            "Good": [],
            "Moderate": ["Sensitive groups should reduce outdoor exertion."],
            "Unhealthy for Sensitive Groups": [
                "Limit outdoor activities.",
                "Keep rescue inhaler handy if asthmatic."
            ],
            "Unhealthy": [
                "Avoid prolonged outdoor exertion.",
                "Wear a certified mask outdoors."
            ],
            "Very Unhealthy": [
                "Stay indoors.",
                "Run air purifier if possible."
            ],
            "Hazardous": [
                "Avoid going outside completely.",
                "Seek medical attention for any breathing difficulty."
            ],
        }
        return actions.get(category, [])

    # ✅ Short-term effects by pollutant
    def get_short_term_effects(self, pollutant):
        effects = {
            "pm25": ["Irritation in eyes, nose, throat", "Coughing", "Breathing difficulty"],
            "pm10": ["Coughing", "Shortness of breath"],
            "o3": ["Chest tightness", "Coughing", "Worsening asthma"],
            "no2": ["Irritation in airways", "Coughing", "Reduced lung function"],
            "so2": ["Throat irritation", "Shortness of breath", "Wheezing"],
            "co": ["Headache", "Fatigue", "Nausea"],
        }
        return effects.get(pollutant, [])

    # ✅ Long-term effects by pollutant
    def get_long_term_effects(self, pollutant):
        effects = {
            "pm25": ["Chronic respiratory disease", "Lung cancer", "Heart disease"],
            "pm10": ["Asthma development", "Chronic bronchitis"],
            "o3": ["Reduced lung function growth in children"],
            "no2": ["Asthma onset in children", "Chronic lung disease"],
            "so2": ["Lung inflammation", "Aggravated asthma"],
            "co": ["Damage to cardiovascular system"],
        }
        return effects.get(pollutant, [])

    # ✅ Vulnerable groups
    def get_vulnerable_groups(self, pollutant):
        groups = {
            "pm25": ["Children", "Elderly", "People with asthma/COPD"],
            "pm10": ["Outdoor workers", "Asthmatics"],
            "o3": ["Children", "Asthmatics"],
            "no2": ["People with lung disease"],
            "so2": ["Asthmatics", "Children"],
            "co": ["People with heart disease", "Pregnant women"],
        }
        return groups.get(pollutant, ["General population"])

    # ✅ When to seek care
    def get_seek_medical_if(self, pollutant):
        care = {
            "pm25": ["Persistent cough", "Difficulty breathing"],
            "pm10": ["Asthma attacks", "Severe coughing"],
            "o3": ["Severe chest pain", "Worsening asthma"],
            "no2": ["Shortness of breath not improving"],
            "so2": ["Severe wheezing", "Asthma not controlled"],
            "co": ["Dizziness", "Chest pain", "Confusion"],
        }
        return care.get(pollutant, [])

    def aggregate_advice(self, payload):
        pollutants = []
        iaqi = payload.get("iaqi", {})

        # ✅ only accept valid pollutants
        valid_pollutants = {"pm25", "pm10", "o3", "no2", "so2", "co"}

        for pol, obj in iaqi.items():
            if pol not in valid_pollutants:
                continue  # skip junk keys like "p"

            value = obj.get("v")
            if value is None or value < 0:
                continue

            category = self.get_category(value)
            pollutants.append({
                "pollutant": pol,
                "value": value,
                "category": category,
                "mask_recommendation": self.get_mask_recommendation(category),
                "immediate_actions": self.get_immediate_actions(category),
                "short_term_effects": self.get_short_term_effects(pol),
                "long_term_effects": self.get_long_term_effects(pol),
                "vulnerable_groups": self.get_vulnerable_groups(pol),
                "seek_medical_if": self.get_seek_medical_if(pol),
            })

        # 🔑 Compute summary
        overall_category = "Unknown"
        highest_risk_pollutant = "N/A"

        if pollutants:
            worst = max(
                pollutants,
                key=lambda p: self.severity_order.index(p["category"])
            )
            overall_category = worst["category"]
            highest_risk_pollutant = worst["pollutant"]

        return {
            "summary": {
                "overall_category": overall_category,
                "highest_risk_pollutant": highest_risk_pollutant,
                "who_should_seek_care": [
                    "Children", "Elderly", "People with chronic lung or heart disease"
                ],
                "household_measures": [
                    "Keep windows closed", "Use air purifier", "Avoid burning indoors"
                ],
                "vulnerable_groups": [
                    "Asthmatics", "Outdoor workers", "Pregnant women"
                ],
            },
            "pollutants": pollutants,
            "disclaimer": "This is general informational guidance. For severe or worsening symptoms seek professional medical care."
        }
