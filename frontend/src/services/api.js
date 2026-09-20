const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

/**
 * Checks FastAPI backend health status
 */
export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
    });
    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    throw new Error('Unable to connect to the detection service. Make sure the backend server is running.');
  }
}

/**
 * Sends image or video file to FastAPI /api/analyze endpoint.
 * Notice: We DO NOT manually set Content-Type header so the browser
 * automatically sets multipart/form-data with the correct boundary.
 */
export async function analyzeMedia(file) {
  if (!file) {
    throw new Error('Please select a valid image or video file.');
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 400) {
        throw new Error(data?.detail || 'Please upload a supported image or video.');
      } else if (response.status === 413) {
        throw new Error('File size is too large.');
      } else if (response.status === 429) {
        throw new Error('AI detection requests are temporarily limited. Please try again later.');
      } else if (response.status === 503) {
        throw new Error(data?.detail || 'The AI detection service is temporarily unavailable. Please try again later.');
      } else if (response.status === 504) {
        throw new Error('The detection service timed out. Please try uploading a smaller file.');
      } else {
        throw new Error(data?.detail || 'An unexpected error occurred during analysis.');
      }
    }

    if (!data) {
      throw new Error('Received an empty response from the analysis server.');
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Unable to connect to the detection service. Please ensure the backend is running.');
    }
    throw error;
  }
}
