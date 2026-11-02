from fastapi import APIRouter, UploadFile, File, HTTPException
from services.vision_service import analyze_face_expression
import base64

router = APIRouter()


@router.post("/analyze-face")
async def analyze_face(image: UploadFile = File(...)):
    """Analyze facial expressions from an uploaded image."""
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    image_bytes = await image.read()
    result = analyze_face_expression(image_bytes)
    return result


@router.post("/analyze-face-base64")
async def analyze_face_base64(data: dict):
    """Analyze face from base64 encoded image (for webcam snapshots)."""
    image_b64 = data.get("image")
    if not image_b64:
        raise HTTPException(status_code=400, detail="Image data required")

    # Remove data URL prefix if present
    if "," in image_b64:
        image_b64 = image_b64.split(",")[1]

    image_bytes = base64.b64decode(image_b64)
    result = analyze_face_expression(image_bytes)
    return result
