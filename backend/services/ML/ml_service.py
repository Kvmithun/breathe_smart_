import cv2
import numpy as np
from PIL import Image
import torch
from transformers import CLIPProcessor, CLIPModel

device = "cuda" if torch.cuda.is_available() else "cpu"

clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(device)
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

POLLUTION_THRESHOLD = 45
DESCRIPTION_MATCH_THRESHOLD = 0.6

def analyze_image_for_pollution(image_path):
    try:
        img = cv2.imread(image_path)
        if img is None:
            return 0.0, {}
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 100, 200)
        edge_density_score = min(100.0, (np.sum(edges > 0) * 1000) / (img.shape[0] * img.shape[1]))
        return edge_density_score, {"edge_density_score": f"{edge_density_score:.2f}%"}
    except Exception:
        return 0.0, {}

def verify_description_match(image_path, description):
    try:
        image = Image.open(image_path)
        texts = [description, "a clear, normal photo with no pollution"]
        inputs = clip_processor(text=texts, images=image, return_tensors="pt", padding=True).to(device)
        outputs = clip_model(**inputs)
        logits_per_image = outputs.logits_per_image
        probs = logits_per_image.softmax(dim=1)
        return probs[0][0].item()
    except Exception:
        return 0.0

def verify_image(image_path, description):
    pollution_confidence, details = analyze_image_for_pollution(image_path)

    if pollution_confidence > POLLUTION_THRESHOLD:
        desc_conf = verify_description_match(image_path, description)
        if desc_conf > DESCRIPTION_MATCH_THRESHOLD:
            return {
                "verified": True,
                "reason": "Pollution detected and description matches",
                "pollution_confidence": pollution_confidence,
                "description_match_confidence": desc_conf,
                "details": details,
                "awarded_credits": 100,
                "points": 100
            }
        else:
            return {
                "verified": False,
                "reason": "Pollution detected but description mismatch",
                "pollution_confidence": pollution_confidence,
                "description_match_confidence": desc_conf,
                "details": details,
                "awarded_credits": 0,
                "points": 0
            }
    else:
        return {
            "verified": False,
            "reason": "No significant pollution detected",
            "pollution_confidence": pollution_confidence,
            "description_match_confidence": 0.0,
            "details": details,
            "awarded_credits": 0,
            "points": 0
        }
