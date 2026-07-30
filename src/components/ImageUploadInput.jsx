import React, { useState, useRef } from 'react';
import { UploadCloud, Link as LinkIcon, Image as ImageIcon, X, Check, Loader2, AlertCircle } from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

export default function ImageUploadInput({ value, onChange, label = "Product Image", folder = "products" }) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'url'
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Handle File Upload to Firebase Storage
  const handleFileUpload = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WEBP, SVG).');
      return;
    }

    // Limit file size to 10MB
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds 10MB limit.');
      return;
    }

    setUploadError('');
    setIsUploading(true);
    setUploadProgress(0);

    const fileExt = file.name.split('.').pop() || 'jpg';
    const cleanName = file.name.replace(/[^a-zA-Z0-9]/g, '_');
    const storagePath = `${folder}/${Date.now()}_${cleanName}.${fileExt}`;
    const storageRef = ref(storage, storagePath);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Firebase Storage Upload Error:", error);
        setIsUploading(false);
        setUploadError(
          error.code === 'storage/unauthorized'
            ? 'Firebase Storage Permission Denied. Check your Firebase Storage security rules.'
            : error.message || 'Failed to upload image to Firebase Storage.'
        );
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          onChange(downloadURL);
          setIsUploading(false);
          setUploadProgress(100);
        } catch (err) {
          console.error("Error fetching download URL:", err);
          setIsUploading(false);
          setUploadError('Uploaded file, but failed to retrieve image URL.');
        }
      }
    );
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const isFirebaseStorageUrl = (url) => {
    return url && (url.includes('firebasestorage.googleapis.com') || url.includes('storage.googleapis.com'));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 block">{label} *</label>
        
        {/* Mode Switcher Tabs */}
        <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'url'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Paste URL Link
          </button>
        </div>
      </div>

      {/* Upload File Tab */}
      {activeTab === 'upload' && (
        <div className="space-y-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
            accept="image/*"
            className="hidden"
          />

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-emerald-500 bg-emerald-50/50'
                : 'border-slate-200 hover:border-emerald-400 bg-slate-50/50 hover:bg-slate-50'
            }`}
          >
            {isUploading ? (
              <div className="space-y-3 py-2">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                <div>
                  <p className="text-xs font-bold text-slate-800">Uploading to Firebase Storage...</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{uploadProgress}% uploaded</p>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden max-w-xs mx-auto">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2 py-1">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Click to browse <span className="font-normal text-slate-500">or drag & drop image</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, WEBP, SVG up to 10MB</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Paste URL Link Tab */}
      {activeTab === 'url' && (
        <div className="space-y-1">
          <div className="relative">
            <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="url"
              required
              placeholder="https://images.unsplash.com/... or image link"
              value={value}
              onChange={(e) => {
                setUploadError('');
                onChange(e.target.value);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <p className="text-[10px] text-slate-400 pl-1">Enter any direct HTTPS image link from the web.</p>
        </div>
      )}

      {/* Error Message */}
      {uploadError && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span className="flex-1">{uploadError}</span>
          <button
            type="button"
            onClick={() => setUploadError('')}
            className="p-1 hover:bg-rose-100 rounded-lg text-rose-500"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Live Image Preview & Storage Source Badge */}
      {value && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-lg bg-slate-200 overflow-hidden shrink-0 border border-slate-300">
              <img
                src={value}
                alt="Selected Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&auto=format&fit=crop&q=80';
                }}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-800">Image Ready</span>
                {isFirebaseStorageUrl(value) ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" /> Firebase Storage
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200 flex items-center gap-1">
                    <LinkIcon className="w-3 h-3 text-blue-500" /> External Link
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5" title={value}>
                {value}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onChange('')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Clear image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
