import os
import re
import tempfile
from pathlib import Path
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from app.services.aiornot_service import (
    validate_media_file,
    analyze_image,
    analyze_video,
    DetectionError,
    ConfigurationError,
    MediaValidationError,
    AiServiceError,
)

load_dotenv()

app = FastAPI(
    title="DeepFake Guardian API",
    description=(
        "FastAPI backend for DeepFake Guardian: Detect AI manipulations and deepfakes "
        "in images and videos using the official AI or Not detection API."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
def get_cors_origins() -> List[str]:
    raw = os.getenv("CORS_ORIGINS", "http://localhost:5173")
    origins = [item.strip() for item in raw.split(",") if item.strip()]
    return origins if origins else ["http://localhost:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class HealthResponse(BaseModel):
    status: str = Field(..., example="ok")
    service: str = Field(..., example="DeepFake Guardian")


class AnalysisResponse(BaseModel):
    success: bool = Field(..., example=True)
    status: str = Field(..., example="POTENTIALLY_MANIPULATED", description="AUTHENTIC, POTENTIALLY_MANIPULATED, or UNCERTAIN")
    confidence: int = Field(..., example=87, description="Probabilistic confidence score from 0 to 100")
    media_type: str = Field(..., example="image", description="'image' or 'video'")
    file_name: str = Field(..., example="sample.jpg")
    explanation: str = Field(..., example="AI analysis identified potential manipulation indicators.")
    detection_mode: str = Field(..., example="ai", description="'ai' or 'demo'")
    is_demo: Optional[bool] = Field(False, example=False)
    demo_notice: Optional[str] = None
    raw_details: Optional[Dict[str, Any]] = None


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent path traversal attacks."""
    basename = os.path.basename(filename)
    sanitized = re.sub(r'[^a-zA-Z0-9_\.-]', '_', basename)
    return sanitized or "uploaded_media"


@app.get(
    "/api/health",
    response_model=HealthResponse,
    summary="Service Health Check",
    tags=["Health"],
)
async def health_check():
    """Health check endpoint confirming service status."""
    return {
        "status": "ok",
        "service": "DeepFake Guardian"
    }


@app.post(
    "/api/analyze",
    response_model=AnalysisResponse,
    summary="Analyze Media for Deepfakes and AI Manipulation",
    tags=["Analysis"],
)
async def analyze_media(
    file: UploadFile = File(..., description="Image (JPG, JPEG, PNG, WEBP) or Video (MP4, MOV, WEBM) to analyze")
):
    """
    Receives an uploaded media file, validates its format and size,
    transfers it safely to the AI or Not detection engine, and returns
    a normalized probabilistic analysis response.
    """
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file was provided for analysis."
        )

    clean_filename = sanitize_filename(file.filename)
    temp_file_path: Optional[str] = None

    try:
        # Read uploaded file content securely
        file_bytes = await file.read()
        file_size = len(file_bytes)

        # Validate file type, MIME, and size
        media_type, ext = validate_media_file(
            filename=clean_filename,
            file_size_bytes=file_size,
            content_type=file.content_type
        )

        # Save to a temporary file with secure context
        suffix = ext if ext else (".tmp" if media_type == "image" else ".mp4")
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(file_bytes)
            temp_file_path = tmp.name

        # Route to appropriate detection engine
        if media_type == "image":
            result = await analyze_image(file_bytes=file_bytes, filename=clean_filename)
        elif media_type == "video":
            result = await analyze_video(file_bytes=file_bytes, filename=clean_filename)
        else:
            raise MediaValidationError("Unsupported media category.")

        return JSONResponse(status_code=status.HTTP_200_OK, content=result)

    except MediaValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=exc.message)
    except ConfigurationError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=exc.message)
    except AiServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)
    except DetectionError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)
    except Exception as exc:
        # Fallback to prevent exposing unhandled stack traces
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while processing the media."
        )
    finally:
        # Ensure temporary file is always deleted
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except OSError:
                pass
        await file.close()

# Mount frontend built distribution for single-link access
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

@app.get("/", tags=["Health"])
async def root():
    if frontend_dist.exists() and (frontend_dist / "index.html").is_file():
        return FileResponse(frontend_dist / "index.html")
    return {
        "status": "ok",
        "service": "DeepFake Guardian Backend API",
        "docs": "/docs",
        "health": "/api/health",
        "analyze": "/api/analyze"
    }

if frontend_dist.exists() and (frontend_dist / "assets").is_dir():
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        if (
            full_path.startswith("api/")
            or full_path.startswith("docs")
            or full_path.startswith("openapi.json")
            or full_path.startswith("redoc")
        ):
            raise HTTPException(status_code=404, detail="Not found")
        file_path = frontend_dist / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        if (frontend_dist / "index.html").is_file():
            return FileResponse(frontend_dist / "index.html")
        raise HTTPException(status_code=404, detail="Not found")
