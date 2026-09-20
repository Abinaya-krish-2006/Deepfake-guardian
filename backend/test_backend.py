import os
import asyncio
import io
from starlette.testclient import TestClient

# Ensure environment variables for testing
os.environ["DETECTION_MODE"] = "demo"
os.environ["CORS_ORIGINS"] = "http://localhost:5173"

from app.main import app
from app.services.aiornot_service import (
    validate_media_file,
    MediaValidationError,
    analyze_image,
    ConfigurationError,
)

client = TestClient(app)

def test_health_check():
    print("Testing GET /api/health...")
    response = client.get("/api/health")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "DeepFake Guardian"
    print("  -> Passed! Health status: ok")

def test_invalid_file_type():
    print("Testing POST /api/analyze with invalid file (.txt)...")
    fake_file = io.BytesIO(b"Hello world executable or plain text")
    response = client.post(
        "/api/analyze",
        files={"file": ("malicious.txt", fake_file, "text/plain")}
    )
    assert response.status_code == 400, f"Expected 400, got {response.status_code}"
    data = response.json()
    assert "detail" in data
    print(f"  -> Passed! Rejected with: {data['detail']}")

def test_demo_image_analysis():
    print("Testing POST /api/analyze with demo image...")
    fake_image = io.BytesIO(b"\xFF\xD8\xFF\xE0" + b"A" * 500) # JPEG magic header
    response = client.post(
        "/api/analyze",
        files={"file": ("test_photo.jpg", fake_image, "image/jpeg")}
    )
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert data["success"] is True
    assert data["status"] in ["AUTHENTIC", "POTENTIALLY_MANIPULATED", "UNCERTAIN"]
    assert 0 <= data["confidence"] <= 100
    assert data["media_type"] == "image"
    assert data["detection_mode"] == "demo"
    assert "DEMO DETECTION MODE" in data["explanation"]
    print(f"  -> Passed! Status: {data['status']}, Confidence: {data['confidence']}%, Mode: {data['detection_mode']}")

def test_demo_video_analysis():
    print("Testing POST /api/analyze with demo video...")
    fake_video = io.BytesIO(b"\x00\x00\x00\x20ftypmp42" + b"V" * 1000)
    response = client.post(
        "/api/analyze",
        files={"file": ("sample_clip.mp4", fake_video, "video/mp4")}
    )
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert data["success"] is True
    assert data["media_type"] == "video"
    assert data["detection_mode"] == "demo"
    print(f"  -> Passed! Video Status: {data['status']}, Confidence: {data['confidence']}%, Mode: {data['detection_mode']}")

def test_missing_api_key_in_ai_mode():
    print("Testing missing API key behavior in AI mode...")
    os.environ["DETECTION_MODE"] = "ai"
    os.environ["AIORNOT_API_KEY"] = ""
    fake_image = io.BytesIO(b"\xFF\xD8\xFF\xE0" + b"A" * 500)
    response = client.post(
        "/api/analyze",
        files={"file": ("real_test.jpg", fake_image, "image/jpeg")}
    )
    assert response.status_code == 503, f"Expected 503, got {response.status_code}"
    data = response.json()
    assert "AI detection service is not configured" in data["detail"]
    print(f"  -> Passed! Clean error returned: {data['detail']}")

def test_oversized_file():
    print("Testing oversized file validation...")
    try:
        # Simulate 60 MB file
        validate_media_file("big.mp4", 60 * 1024 * 1024, "video/mp4")
        assert False, "Should have raised MediaValidationError"
    except MediaValidationError as e:
        assert "too large" in e.message
        print(f"  -> Passed! Caught expected error: {e.message}")

if __name__ == "__main__":
    print("--- Running DeepFake Guardian Backend Automated Tests ---")
    test_health_check()
    test_invalid_file_type()
    test_demo_image_analysis()
    test_demo_video_analysis()
    test_missing_api_key_in_ai_mode()
    test_oversized_file()
    print("--- All Automated Tests Passed Successfully! ---")
