import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileVideo,
  FileImage,
  Trash2,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { analyzeMedia } from '../services/api';
import { saveScanRecord } from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';
import ResultCard from './ResultCard';

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.mov', '.webm'];
const MAX_FILE_SIZE_MB = 50;

export default function ScanUpload({ onScanSaved }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const fileInputRef = useRef(null);
  const { currentUser } = useAuth();

  const handleFileChange = (selectedFile) => {
    setError('');
    setResult(null);

    if (!selectedFile) return;

    // Check size limit (50 MB)
    if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File size is too large. Please upload a file smaller than ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }

    // Check extension
    const ext = '.' + selectedFile.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError('Please upload a supported image (JPG, PNG, WEBP) or video (MP4, MOV, WEBM).');
      return;
    }

    setFile(selectedFile);
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setError('');
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isVideo = file?.type?.startsWith('video/') ||
    ['.mp4', '.mov', '.webm'].some((ext) => file?.name?.toLowerCase().endsWith(ext));

  const handleAnalyze = async () => {
    if (!file || loading) return;

    setLoading(true);
    setError('');
    setResult(null);

    // Progressive loading indicators
    setLoadingStep('Uploading media...');

    const timer1 = setTimeout(() => {
      setLoadingStep('AI is analyzing your media...');
    }, 1200);

    const timer2 = setTimeout(() => {
      setLoadingStep('Preparing your result...');
    }, 3500);

    try {
      const data = await analyzeMedia(file);
      setResult(data);

      // Save scan record for authenticated user
      if (currentUser?.uid) {
        await saveScanRecord(currentUser.uid, {
          fileName: file.name,
          mediaType: isVideo ? 'video' : 'image',
          status: data.status,
          confidence: data.confidence,
          explanation: data.explanation,
          detectionMode: data.detection_mode,
          isDemo: data.is_demo,
        });
        if (onScanSaved) {
          onScanSaved();
        }
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div>
      {/* Hero Intro */}
      <section className="hero-section">
        <div className="hero-badge">
          <ShieldCheck size={16} />
          <span>Advanced AI Manipulation Detection</span>
        </div>
        <h2 className="hero-title">Deepfake & AI Media Detection</h2>
        <p className="hero-subtitle">
          Upload any photo or video to inspect authentic signatures, face-swapping indicators, and synthetic generative artifacts.
        </p>
      </section>

      {/* Upload Box */}
      <div className="upload-card">
        {error && (
          <div className="form-error" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div>{error}</div>
                {error.includes('not configured') && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#fecdd3', lineHeight: 1.4 }}>
                    👉 <strong>How to test:</strong> Paste your API key in <code>backend/.env</code> (<code>AIORNOT_API_KEY=...</code>), or set <code>DETECTION_MODE=demo</code> in <code>backend/.env</code> to test immediately with the development fallback.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!file ? (
          <div
            className={`dropzone ${isDragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.mp4,.mov,.webm"
              style={{ display: 'none' }}
              onChange={(e) => handleFileChange(e.target.files[0])}
            />

            <div className="dropzone-icon">
              <UploadCloud size={28} />
            </div>

            <div className="dropzone-title">Upload an image or video</div>
            <div className="dropzone-subtitle">
              Drag and drop your file here, or click to browse files
            </div>

            <div className="format-tags">
              <span className="format-tag">JPG</span>
              <span className="format-tag">JPEG</span>
              <span className="format-tag">PNG</span>
              <span className="format-tag">WEBP</span>
              <span className="format-tag">MP4</span>
              <span className="format-tag">MOV</span>
              <span className="format-tag">WEBM</span>
              <span className="format-tag" style={{ color: '#93c5fd' }}>Up to 50 MB</span>
            </div>
          </div>
        ) : (
          <div>
            <div className="preview-box">
              <div className="preview-media-wrapper">
                {isVideo ? (
                  <video src={previewUrl} controls playsInline />
                ) : (
                  <img src={previewUrl} alt="Preview" />
                )}
              </div>

              <div className="file-info-row">
                <div className="file-info-details">
                  <span className="file-type-badge">{isVideo ? 'Video' : 'Image'}</span>
                  <div>
                    <div className="file-name">{file.name}</div>
                    <div className="file-size">{formatFileSize(file.size)}</div>
                  </div>
                </div>

                {!loading && (
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={handleRemoveFile}
                    title="Remove file"
                  >
                    <Trash2 size={15} />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="loading-box">
                <div className="spinner"></div>
                <div className="loading-step-title">{loadingStep}</div>
                <div className="loading-subtext">
                  Examining deep generative patterns and forensic signals...
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleRemoveFile}
                  disabled={loading}
                >
                  Choose Different File
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleAnalyze}
                  disabled={loading}
                  style={{ minWidth: '150px', justifyContent: 'center' }}
                >
                  <Sparkles size={18} />
                  <span>Analyze Media</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Result Display */}
      {result && <ResultCard result={result} />}
    </div>
  );
}
