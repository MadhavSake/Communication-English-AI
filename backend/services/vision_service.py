from google.cloud import vision as gcp_vision
import base64
import io


def analyze_face_expression(image_bytes: bytes) -> dict:
    """
    Analyze facial expressions for confidence, smile, engagement.
    Uses Google Vision API Face Detection.
    """
    client = gcp_vision.ImageAnnotatorClient()
    image = gcp_vision.Image(content=image_bytes)

    response = client.face_detection(image=image)
    faces = response.face_annotations

    if not faces:
        return {
            "face_detected": False,
            "message": "No face detected. Please ensure your face is visible."
        }

    face = faces[0]  # Primary face

    # Likelihood mapping
    likelihood_map = {
        0: 0,   # UNKNOWN
        1: 10,  # VERY_UNLIKELY
        2: 25,  # UNLIKELY
        3: 50,  # POSSIBLE
        4: 75,  # LIKELY
        5: 95,  # VERY_LIKELY
    }

    joy = likelihood_map.get(face.joy_likelihood, 0)
    sorrow = likelihood_map.get(face.sorrow_likelihood, 0)
    anger = likelihood_map.get(face.anger_likelihood, 0)
    surprise = likelihood_map.get(face.surprise_likelihood, 0)

    # Calculate confidence score from headwear/tilt
    tilt_score = max(0, 100 - abs(face.tilt_angle) * 2)
    pan_score = max(0, 100 - abs(face.pan_angle) * 2)
    eye_contact_score = round((tilt_score + pan_score) / 2)

    # Overall confidence estimate
    confidence_score = round(
        (joy * 0.3) + (eye_contact_score * 0.4) + ((100 - sorrow) * 0.3)
    )

    # Feedback generation
    feedback = []
    if joy >= 50:
        feedback.append("Great smile! You look confident and approachable.")
    else:
        feedback.append("Try smiling more — it makes you sound more confident!")

    if eye_contact_score >= 70:
        feedback.append("Good eye contact with the camera.")
    else:
        feedback.append("Try looking directly at the camera for better eye contact.")

    if sorrow >= 50:
        feedback.append("You seem nervous. Take a deep breath before speaking.")

    return {
        "face_detected": True,
        "expressions": {
            "joy_score": joy,
            "sorrow_score": sorrow,
            "anger_score": anger,
            "surprise_score": surprise,
        },
        "eye_contact_score": eye_contact_score,
        "confidence_score": confidence_score,
        "smile_detected": joy >= 50,
        "feedback": feedback,
        "face_angle": {
            "tilt": round(face.tilt_angle, 2),
            "pan": round(face.pan_angle, 2),
            "roll": round(face.roll_angle, 2),
        }
    }
