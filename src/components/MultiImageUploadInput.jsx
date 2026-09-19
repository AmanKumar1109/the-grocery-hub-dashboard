import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Link as LinkIcon,
  Image as ImageIcon,
  X,
  Check,
  Loader2,
  AlertCircle,
  Star,
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2
} from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

export default function MultiImageUploadInput({
  images = [],
  onChange,
  label = "Product Images",
  folder = "products",
  maxImages = 10
}) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'url'
  const [urlInput, setUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Normalize images array
  const currentImages = Array.isArray(images) ? images.filter(Boolean) : (images ? [images] : []);

  const isFirebaseStorageUrl = (url) => {
    return url && (url.includes('firebasestorage.googleapis.com') || url.includes('storage.googleapis.com'));
  };

  // Upload multiple files sequentially or in parallel
  const handleFilesUpload = async (fileList) => {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    const validImages = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setUploadError(`"${file.name}" is not a valid image format.`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploadError(`"${file.name}" exceeds the 10MB limit.`);
        return;
      }
      validImages.push(file);
    }

    if (currentImages.length + validImages.length > maxImages) {
      setUploadError(`Maximum of ${maxImages} images allowed. You can only add ${maxImages - currentImages.length} more.`);
      return;
    }

    setUploadError('');
    setIsUploading(true);
    setUploadProgress(0);

    const uploadedUrls = [];
    const total = validImages.length;

    try {
      for (let i = 0; i < total; i++) {
        const file = validImages[i];
        setUploadStatusText(`Uploading ${i + 1} of ${total}: ${file.name}...`);

        const fileExt = file.name.split('.').pop() || 'jpg';
        const cleanName = file.name.replace(/[^a-zA-Z0-9]/g, '_');
        const storagePath = `${folder}/${Date.now()}_${cleanName}.${fileExt}`;
        const storageRef = ref(storage, storagePath);

        const uploadTask = uploadBytesResumable(storageRef, file);

        await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const filePercent = (snapshot.bytesTransferred / snapshot.totalBytes);
              const overallPercent = Math.round(((i + filePercent) / total) * 100);
              setUploadProgress(overallPercent);
            },
            (error) => {
              reject(error);
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                uploadedUrls.push(downloadURL);
                resolve();
              } catch (err) {
                reject(err);
              }
            }
          );
        });
      }

      const updatedList = [...currentImages, ...uploadedUrls];
      onChange(updatedList);
      setUploadProgress(100);
      setUploadStatusText('Upload complete!');
    } catch (err) {
      console.error("Multi-image upload error:", err);
      setUploadError(
        err.code === 'storage/unauthorized'
          ? 'Firebase Storage Permission Denied. Check your Firebase Storage security rules.'
          : err.message || 'Failed to upload some images.'
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesUpload(e.dataTransfer.files);
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

  // Add URL from input
  const handleAddUrl = (e) => {
    e?.preventDefault();
    const raw = urlInput.trim();
    if (!raw) return;

    // Support comma or newline separated multiple URLs
    const splitUrls = raw
      .split(/[\n,]+/)
      .map(u => u.trim())
      .filter(u => u.length > 0);

    const validUrls = [];
    for (const u of splitUrls) {
      if (!u.startsWith('http://') && !u.startsWith('https://') && !u.startsWith('data:image/')) {
        setUploadError(`"${u}" is not a valid URL (must start with https:// or http://).`);
        return;
      }
      validUrls.push(u);
    }

    if (currentImages.length + validUrls.length > maxImages) {
      setUploadError(`Maximum of ${maxImages} images allowed. You can only add ${maxImages - currentImages.length} more.`);
      return;
    }

    setUploadError('');
    onChange([...currentImages, ...validUrls]);
    setUrlInput('');
  };

  // Remove single image by index
  const handleRemoveImage = (indexToRemove) => {
    const updated = currentImages.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  // Set image as Primary / Cover (move to index 0)
  const handleSetPrimary = (indexToPrimary) => {
    if (indexToPrimary === 0) return;
    const target = currentImages[indexToPrimary];
    const filtered = currentImages.filter((_, idx) => idx !== indexToPrimary);
    onChange([target, ...filtered]);
  };

  // Move image left or right in array
  const handleMove = (index, direction) => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentImages.length) return;

    const copy = [...currentImages];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    onChange(copy);
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Counter */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-700 block">{label} *</label>
          <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {currentImages.length} / {maxImages} images
          </span>
          {currentImages.length > 0 && (
            <span className="text-[10px] text-emerald-600 font-medium">
              (First image is the Primary cover image)
            </span>
          )}
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Upload Files
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'url'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Add Image Links
          </button>
        </div>
      </div>

      {/* Upload Files Tab */}
      {activeTab === 'upload' && (
        <div className="space-y-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files && handleFilesUpload(e.target.files)}
            accept="image/*"
            multiple
            className="hidden"
          />

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]'
                : 'border-slate-200 hover:border-emerald-400 bg-slate-50/50 hover:bg-slate-50'
            }`}
          >
            {isUploading ? (
              <div className="space-y-3 py-3">
                <Loader2 className="w-9 h-9 text-emerald-600 animate-spin mx-auto" />
                <div>
                  <p className="text-xs font-bold text-slate-800">{uploadStatusText}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{uploadProgress}% overall uploaded</p>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden max-w-sm mx-auto">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2 py-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 shadow-xs">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Click to select multiple images <span className="font-normal text-slate-500">or drag & drop here</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Select multiple PNG, JPG, WEBP, SVG files at once (Up to {maxImages} images, 10MB each)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Paste URL Link Tab */}
      {activeTab === 'url' && (
        <div className="space-y-2 bg-slate-50/70 border border-slate-200 rounded-2xl p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                placeholder="https://example.com/image.jpg (or paste multiple comma-separated URLs)"
                value={urlInput}
                onChange={(e) => {
                  setUploadError('');
                  setUrlInput(e.target.value);
                }}
                onBlur={() => {
                  if (urlInput.trim()) {
                    handleAddUrl();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddUrl();
                  }
                }}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleAddUrl}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Link
            </button>
          </div>
          <p className="text-[10px] text-slate-400 pl-1">
            Tip: You can paste multiple links separated by comma or new lines. Press Enter or click "Add Link".
          </p>
        </div>
      )}

      {/* Error Banner */}
      {uploadError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span className="flex-1 font-medium">{uploadError}</span>
          <button
            type="button"
            onClick={() => setUploadError('')}
            className="p-1 hover:bg-rose-100 rounded-lg text-rose-500 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Images Gallery Grid */}
      {currentImages.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              Attached Images Gallery ({currentImages.length})
            </span>
            <span className="text-[11px] text-slate-400">
              Use arrow buttons to rearrange order
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {currentImages.map((imgUrl, index) => {
              const isPrimary = index === 0;
              const isFirebase = isFirebaseStorageUrl(imgUrl);

              return (
                <div
                  key={`${imgUrl}-${index}`}
                  className={`group relative bg-white rounded-2xl border transition-all overflow-hidden flex flex-col shadow-xs ${
                    isPrimary
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Image Container */}
                  <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
                    <img
                      src={imgUrl}
                      alt={`Product Image ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&auto=format&fit=crop&q=80';
                      }}
                    />

                    {/* Primary Badge or Index Badge */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                      {isPrimary ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                          <Star className="w-3 h-3 fill-white" /> Primary
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold">
                          #{index + 1}
                        </span>
                      )}
                    </div>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      title="Remove image"
                      className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 hover:bg-rose-600 text-white backdrop-blur-xs flex items-center justify-center transition-colors opacity-90 group-hover:opacity-100 z-10 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Source tag on hover */}
                    <div className="absolute bottom-2 left-2 z-10">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs ${
                        isFirebase ? 'bg-emerald-950/70 text-emerald-300' : 'bg-blue-950/70 text-blue-300'
                      }`}>
                        {isFirebase ? 'Storage' : 'Web Link'}
                      </span>
                    </div>
                  </div>

                  {/* Card Controls Footer */}
                  <div className="p-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-1">
                    {/* Move Left Button */}
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMove(index, 'left')}
                      title="Move left"
                      className={`p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors ${
                        index === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>

                    {/* Set as Primary Button */}
                    {!isPrimary ? (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(index)}
                        className="text-[10px] font-bold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 px-2 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                        title="Make this the cover/primary image"
                      >
                        <Star className="w-3 h-3 text-amber-500" />
                        Make Cover
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-700 px-2 py-1">
                        Main Cover
                      </span>
                    )}

                    {/* Move Right Button */}
                    <button
                      type="button"
                      disabled={index === currentImages.length - 1}
                      onClick={() => handleMove(index, 'right')}
                      title="Move right"
                      className={`p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors ${
                        index === currentImages.length - 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Quick "Add More" Card if under maxImages */}
            {currentImages.length < maxImages && (
              <div
                onClick={() => {
                  if (activeTab === 'upload') {
                    fileInputRef.current?.click();
                  } else {
                    window.scrollTo({ behavior: 'smooth' });
                  }
                }}
                className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 hover:border-emerald-400 bg-slate-50/50 hover:bg-emerald-50/30 flex flex-col items-center justify-center gap-2 p-4 text-center cursor-pointer transition-all text-slate-400 hover:text-emerald-600"
              >
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-2xs">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold">Add More</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
