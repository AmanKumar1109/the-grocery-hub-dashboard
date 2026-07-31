import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import {
  FileText,
  Save,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Eye,
  Pencil
} from 'lucide-react';
import JoditEditor from 'jodit-react';

const POLICY_DOC_REF = doc(db, 'settings', 'termsOfService');

export default function termsOfServiceView() {
  const editorRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [content, setContent] = useState('');
  const originalContent = useRef('');

  // Load existing policy from Firestore
  useEffect(() => {
    async function loadPolicy() {
      try {
        const snap = await getDoc(POLICY_DOC_REF);
        if (snap.exists()) {
          const data = snap.data();
          const loadedContent = data.content || '';
          setContent(loadedContent);
          originalContent.current = loadedContent;
          if (data.updatedAt) {
            setLastUpdated(data.updatedAt.toDate());
          }
          setTimeout(() => updateWordCount(loadedContent), 100);
        }
      } catch (err) {
        console.error('Failed to load Terms of Service:', err);
        setError('Failed to load Terms of Service content.');
      } finally {
        setLoading(false);
      }
    }
    loadPolicy();
  }, []);

  const updateWordCount = useCallback((textHtml) => {
    // Strip html tags
    const tmp = document.createElement("DIV");
    tmp.innerHTML = textHtml || "";
    const text = tmp.textContent || tmp.innerText || "";
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
  }, []);

  const handleInput = useCallback((newContent) => {
    setContent(newContent);
    setHasChanges(true);
    setSaved(false);
    updateWordCount(newContent);
  }, [updateWordCount]);

  // Jodit Editor Config
  const joditConfig = useMemo(() => ({
    readonly: false,
    placeholder: 'Start writing your Terms of Service here...',
    height: 600,
    style: {
      fontFamily: 'inherit',
      color: '#334155'
    },
    buttons: [
      'source', '|',
      'bold', 'strikethrough', 'underline', 'italic', '|',
      'superscript', 'subscript', '|',
      'ul', 'ol', '|',
      'outdent', 'indent', '|',
      'font', 'fontsize', 'brush', 'paragraph', '|',
      'image', 'video', 'table', 'link', '|',
      'align', 'undo', 'redo', '|',
      'hr', 'eraser', 'copyformat', '|',
      'symbol', 'fullsize', 'print'
    ]
  }), []);

  // Save to Firestore
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await setDoc(POLICY_DOC_REF, {
        content: content,
        updatedAt: serverTimestamp()
      });
      originalContent.current = content;
      setHasChanges(false);
      setSaved(true);
      setLastUpdated(new Date());
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save Terms of Service:', err);
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Loading Terms of Service…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50/50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="px-6 lg:px-10 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-200">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-800 tracking-tight">Terms of Service</h1>
              <p className="text-xs text-slate-400 font-medium">
                {lastUpdated
                  ? `Last updated: ${lastUpdated.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                  : 'No policy saved yet'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Word count */}
            <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
              {wordCount} words
            </span>

            {/* Status badge */}
            {hasChanges && (
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Unsaved
              </span>
            )}
            {saved && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1 animate-in fade-in duration-200">
                <CheckCircle className="w-3 h-3" /> Saved!
              </span>
            )}

            {/* Preview toggle */}
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                previewMode
                  ? 'bg-violet-100 text-violet-700 border border-violet-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {previewMode ? <Pencil className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {previewMode ? 'Edit' : 'Preview'}
            </button>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-emerald-200 disabled:shadow-none"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Saving…' : 'Save Policy'}
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-6 lg:mx-10 mt-4 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Editor area */}
      <div className="flex-1 px-6 lg:px-10 py-6 max-w-5xl mx-auto w-full">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
          {!previewMode ? (
            <JoditEditor
              ref={editorRef}
              value={content}
              config={joditConfig}
              onBlur={newContent => handleInput(newContent)}
              onChange={() => {}} // React to blur to avoid re-renders on every keystroke
            />
          ) : (
            <div
              className="prose prose-slate max-w-none p-8 lg:p-12 min-h-[500px] privacy-policy-content"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}
        </div>
      </div>

      {/* Editor placeholder styles + prose overrides */}
      <style>{`
        [data-placeholder]:empty::before {
          content: attr(data-placeholder);
          color: #94a3b8;
          font-style: italic;
          pointer-events: none;
        }
        .privacy-policy-content {
          color: #334155;
          font-size: 1rem;
          caret-color: #10b981;
        }
        .privacy-policy-content h1 {
          font-size: 1.75rem;
          font-weight: 800;
          color: #1e293b;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          line-height: 1.3;
        }
        .privacy-policy-content h2 {
          font-size: 1.35rem;
          font-weight: 700;
          color: #334155;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
          line-height: 1.35;
        }
        .privacy-policy-content h3 {
          font-size: 1.1rem;
          font-weight: 700;
          color: #475569;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        .privacy-policy-content p {
          font-size: 0.925rem;
          line-height: 1.7;
          color: #475569;
          margin-bottom: 0.75rem;
        }
        .privacy-policy-content ul, .privacy-policy-content ol {
          padding-left: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .privacy-policy-content li {
          font-size: 0.925rem;
          line-height: 1.7;
          color: #475569;
          margin-bottom: 0.25rem;
        }
        .privacy-policy-content blockquote {
          border-left: 4px solid #10b981;
          background: #f0fdf4;
          padding: 0.75rem 1rem;
          margin: 1rem 0;
          border-radius: 0 0.5rem 0.5rem 0;
          color: #065f46;
          font-style: italic;
        }
        .privacy-policy-content a {
          color: #059669;
          text-decoration: underline;
          font-weight: 600;
        }
        .privacy-policy-content hr {
          border: none;
          border-top: 2px solid #e2e8f0;
          margin: 1.5rem 0;
        }
      `}</style>
    </div>
  );
}
