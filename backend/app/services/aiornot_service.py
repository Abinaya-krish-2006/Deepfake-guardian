import os
import mimetypes
from pathlib import Path
from typing import Dict, Any, Tuple, Optional
import httpx
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

AI_BASE_URL = "https://api.aiornot.com"

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".mov", ".webm"}

ALLOWED_IMAGE_MIMES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
}
ALLOWED_VIDEO_MIMES = {
    "video/mp4",
    "video/quicktime",
    "video/webm",
}

class DetectionError(Exception):
    """Base exception for AI detection errors."""
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code

class ConfigurationError(DetectionError):
    """Raised when detection service is improperly configured."""
    def __init__(self, message: str = "AI detection service is not configured. Please contact the administrator."):
        super().__init__(message, status_code=503)

class MediaValidationError(DetectionError):
    """Raised when media validation fails."""
    def __init__(self, message: str):
        super().__init__(message, status_code=400)

class AiServiceError(DetectionError):
    """Raised when upstream AI or Not service fails."""
    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message, status_code=status_code)


def get_detection_mode() -> str:
    load_dotenv(override=True)
    return os.getenv("DETECTION_MODE", "ai").strip().lower()


def get_api_key() -> Optional[str]:
    load_dotenv(override=True)
    key = os.getenv("AIORNOT_API_KEY", "").strip()
    return key if key else None


def get_max_file_size_mb() -> int:
    try:
        return int(os.getenv("MAX_FILE_SIZE_MB", "50"))
    except ValueError:
        return 50


def get_max_video_duration_seconds() -> int:
    try:
        return int(os.getenv("MAX_VIDEO_DURATION_SECONDS", "60"))
    except ValueError:
        return 60


def validate_media_file(filename: str, file_size_bytes: int, content_type: Optional[str] = None) -> Tuple[str, str]:
    """
    Validates file extension, size, and MIME type.
    Returns (media_type, sanitized_extension).
    media_type is either 'image' or 'video'.
    """
    max_mb = get_max_file_size_mb()
    max_bytes = max_mb * 1024 * 1024
    if file_size_bytes > max_bytes:
        raise MediaValidationError(f"This file is too large. Please upload a file smaller than {max_mb} MB.")

    if file_size_bytes == 0:
        raise MediaValidationError("The uploaded file is empty. Please choose a valid image or video.")

    ext = Path(filename).suffix.lower()
    guessed_mime, _ = mimetypes.guess_type(filename)
    mime = (content_type or guessed_mime or "").lower()

    if ext in ALLOWED_IMAGE_EXTENSIONS:
        if mime and mime not in ALLOWED_IMAGE_MIMES and "octet-stream" not in mime:
            raise MediaValidationError("Please upload a supported image (JPG, JPEG, PNG, WEBP).")
        return "image", ext

    if ext in ALLOWED_VIDEO_EXTENSIONS:
        if mime and mime not in ALLOWED_VIDEO_MIMES and "octet-stream" not in mime:
            raise MediaValidationError("Please upload a supported video (MP4, MOV, WEBM).")
        return "video", ext

    raise MediaValidationError("Unsupported file format. Please upload a JPG, JPEG, PNG, WEBP image, or MP4, MOV, WEBM video.")


def _normalize_confidence(raw_val: Any) -> int:
    """Safely converts confidence float or int to integer percentage 0-100."""
    try:
        val = float(raw_val)
        if 0.0 <= val <= 1.0:
            return min(100, max(0, round(val * 100)))
        return min(100, max(0, round(val)))
    except (ValueError, TypeError):
        return 75


def _normalize_image_response(data: Dict[str, Any], filename: str) -> Dict[str, Any]:
    """Normalizes official AI or Not image response."""
    report = data.get("report", {})
    ai_gen = report.get("ai_generated") or {}
    deepfake = report.get("deepfake") or {}

    is_ai = False
    is_deepfake = False
    highest_conf = 0

    if isinstance(ai_gen, dict):
        verdict = ai_gen.get("verdict", "").lower()
        if verdict == "ai":
            is_ai = True
            ai_data = ai_gen.get("ai", {})
            highest_conf = max(highest_conf, _normalize_confidence(ai_data.get("confidence", 0.85)))
        elif verdict == "human":
            human_data = ai_gen.get("human", {})
            highest_conf = max(highest_conf, _normalize_confidence(human_data.get("confidence", 0.85)))

    if isinstance(deepfake, dict):
        if deepfake.get("is_detected"):
            is_deepfake = True
            highest_conf = max(highest_conf, _normalize_confidence(deepfake.get("confidence", 0.85)))

    if is_deepfake or is_ai:
        status = "POTENTIALLY_MANIPULATED"
        confidence = highest_conf if highest_conf > 0 else 88
        explanation = "AI analysis identified potential manipulation indicators. This result is not definitive proof."
    elif ai_gen.get("verdict") == "human":
        status = "AUTHENTIC"
        confidence = highest_conf if highest_conf > 0 else 90
        explanation = "AI analysis indicates the media is likely authentic without prominent manipulation markers. This result is not definitive proof."
    else:
        status = "UNCERTAIN"
        confidence = highest_conf if highest_conf > 0 else 50
        explanation = "AI analysis was unable to conclusively determine authenticity. Consider verifying the original source."

    return {
        "success": True,
        "status": status,
        "confidence": confidence,
        "media_type": "image",
        "file_name": filename,
        "explanation": explanation,
        "detection_mode": "ai",
        "raw_details": {
            "ai_generated_verdict": ai_gen.get("verdict") if isinstance(ai_gen, dict) else None,
            "deepfake_detected": deepfake.get("is_detected") if isinstance(deepfake, dict) else False,
        }
    }


def _normalize_video_response(data: Dict[str, Any], filename: str) -> Dict[str, Any]:
    """Normalizes official AI or Not video response."""
    report = data.get("report", {})
    ai_video = report.get("ai_video") or {}
    deepfake_video = report.get("deepfake_video") or {}
    meta = report.get("meta") or {}

    max_seconds = get_max_video_duration_seconds()
    duration = meta.get("duration")
    if duration is not None:
        try:
            dur_float = float(duration)
            if dur_float > max_seconds:
                raise MediaValidationError(f"Please upload a video shorter than {max_seconds} seconds.")
        except ValueError:
            pass

    is_ai_vid = ai_video.get("is_detected", False) if isinstance(ai_video, dict) else False
    is_df_vid = deepfake_video.get("is_detected", False) if isinstance(deepfake_video, dict) else False

    highest_conf = 0
    if is_ai_vid:
        highest_conf = max(highest_conf, _normalize_confidence(ai_video.get("confidence", 0.85)))
    if is_df_vid:
        highest_conf = max(highest_conf, _normalize_confidence(deepfake_video.get("confidence", 0.85)))

    if is_ai_vid or is_df_vid:
        status = "POTENTIALLY_MANIPULATED"
        confidence = highest_conf if highest_conf > 0 else 85
        explanation = "AI analysis identified potential manipulation indicators in this video. This result is not definitive proof."
    else:
        status = "AUTHENTIC"
        confidence = 88
        explanation = "AI analysis indicates the video frames are likely authentic without prominent deepfake markers. This result is not definitive proof."

    return {
        "success": True,
        "status": status,
        "confidence": confidence,
        "media_type": "video",
        "file_name": filename,
        "explanation": explanation,
        "detection_mode": "ai",
        "raw_details": {
            "ai_video_detected": is_ai_vid,
            "deepfake_video_detected": is_df_vid,
            "duration": duration,
        }
    }


def _generate_demo_result(filename: str, media_type: str) -> Dict[str, Any]:
    """
    Development fallback mode when DETECTION_MODE=demo.
    Clearly labeled with warnings so it is NEVER confused with real AI results.
    """
    # Deterministic preview based on filename length
    is_altered = len(filename) % 2 == 0
    status = "POTENTIALLY_MANIPULATED" if is_altered else "Likely Authentic"
    normalized_status = "POTENTIALLY_MANIPULATED" if is_altered else "AUTHENTIC"
    confidence = 84 if is_altered else 91

    return {
        "success": True,
        "status": normalized_status,
        "confidence": confidence,
        "media_type": media_type,
        "file_name": filename,
        "explanation": "DEMO DETECTION MODE: This result is generated using the development fallback and is NOT a real deepfake detection result.",
        "detection_mode": "demo",
        "is_demo": True,
        "demo_notice": "DEMO DETECTION MODE - This result is generated using the development fallback and is NOT a real deepfake detection result."
    }


async def analyze_image(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Sends image to AI or Not v2 image sync API.
    Endpoint: POST https://api.aiornot.com/v2/image/sync
    """
    mode = get_detection_mode()
    if mode == "demo":
        return _generate_demo_result(filename, "image")

    api_key = get_api_key()
    if not api_key:
        raise ConfigurationError("AI detection service is not configured. Please contact the administrator.")

    url = f"{AI_BASE_URL}/v2/image/sync"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": "application/json",
    }
    files = {
        "image": (filename, file_bytes, "application/octet-stream")
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(url, headers=headers, files=files)
    except httpx.TimeoutException:
        raise AiServiceError("The AI detection service timed out. Please try again with a smaller image.", status_code=504)
    except httpx.NetworkError:
        raise AiServiceError("Unable to connect to the detection service. Please check your network connection.", status_code=502)
    except Exception as exc:
        raise AiServiceError(f"Detection request failed: {str(exc)}", status_code=500)

    if response.status_code == 401:
        raise AiServiceError("AI detection service authentication failed. Invalid API key.", status_code=401)
    elif response.status_code == 429:
        raise AiServiceError("AI detection requests are temporarily limited. Please try again later.", status_code=429)
    elif response.status_code >= 500:
        raise AiServiceError("The AI detection service is temporarily unavailable. Please try again later.", status_code=503)
    elif response.status_code != 200:
        error_msg = response.text[:200]
        raise AiServiceError(f"AI detection service error (HTTP {response.status_code}): {error_msg}", status_code=response.status_code)

    try:
        data = response.json()
    except Exception:
        raise AiServiceError("Received malformed response from AI detection service.", status_code=502)

    return _normalize_image_response(data, filename)


async def analyze_video(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Sends video to AI or Not v2 video sync API.
    Endpoint: POST https://api.aiornot.com/v2/video/sync
    """
    mode = get_detection_mode()
    if mode == "demo":
        return _generate_demo_result(filename, "video")

    api_key = get_api_key()
    if not api_key:
        raise ConfigurationError("AI detection service is not configured. Please contact the administrator.")

    url = f"{AI_BASE_URL}/v2/video/sync"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": "application/json",
    }
    files = {
        "video": (filename, file_bytes, "application/octet-stream")
    }

    try:
        async with httpx.AsyncClient(timeout=180.0) as client:
            response = await client.post(url, headers=headers, files=files)
    except httpx.TimeoutException:
        raise AiServiceError("The AI detection service timed out analyzing the video. Please try again with a shorter video.", status_code=504)
    except httpx.NetworkError:
        raise AiServiceError("Unable to connect to the detection service. Please check your network connection.", status_code=502)
    except Exception as exc:
        raise AiServiceError(f"Detection request failed: {str(exc)}", status_code=500)

    if response.status_code == 401:
        raise AiServiceError("AI detection service authentication failed. Invalid API key.", status_code=401)
    elif response.status_code == 429:
        raise AiServiceError("AI detection requests are temporarily limited. Please try again later.", status_code=429)
    elif response.status_code >= 500:
        raise AiServiceError("The AI detection service is temporarily unavailable. Please try again later.", status_code=503)
    elif response.status_code != 200:
        error_msg = response.text[:200]
        raise AiServiceError(f"AI detection service error (HTTP {response.status_code}): {error_msg}", status_code=response.status_code)

    try:
        data = response.json()
    except Exception:
        raise AiServiceError("Received malformed response from AI detection service.", status_code=502)

    return _normalize_video_response(data, filename)
