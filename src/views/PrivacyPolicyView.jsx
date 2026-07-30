import React, { useState, useEffect, useRef, useCallback } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import {
  FileText,
  Save,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link as LinkIcon,
  Unlink,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo2,
  Redo2,
  Type,
  Minus,
  Quote,
  Eye,
  Pencil
} from 'lucide-react';

const POLICY_DOC_REF = doc(db, 'settings', 'privacyPolicy');

// Toolbar button component
function ToolbarBtn({ icon: Icon, label, onClick, active, disabled }) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`p-2 rounded-lg transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed ${
        active
          ? 'bg-emerald-100 text-emerald-700 shadow-sm'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
      }`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

function ToolbarSeparator() {
  return <div className="w-px h-6 bg-slate-200 mx-1" />;
}

// Memoized Editor to prevent React from resetting contentEditable during parent re-renders
const Editor = React.memo(({ initialContent, onInput, editorRef }) => {
  return (
    <div
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      onInput={onInput}
      dangerouslySetInnerHTML={{ __html: initialContent }}
      className="prose prose-slate max-w-none p-8 lg:p-12 min-h-[500px] focus:outline-none privacy-policy-content"
      data-placeholder="Start writing your privacy policy here…"
      style={{ minHeight: 500 }}
    />
  );
}, (prev, next) => prev.initialContent === next.initialContent);

export default function PrivacyPolicyView() {
  const editorRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [initialContent, setInitialContent] = useState('');
  const originalContent = useRef('');

  // Load existing policy from Firestore
  useEffect(() => {
    async function loadPolicy() {
      try {
        const snap = await getDoc(POLICY_DOC_REF);
        if (snap.exists()) {
          const data = snap.data();
          const content = data.content || '';
          setInitialContent(content);
          originalContent.current = content;
          if (data.updatedAt) {
            setLastUpdated(data.updatedAt.toDate());
          }
          setTimeout(updateWordCount, 100);
        }
      } catch (err) {
        console.error('Failed to load privacy policy:', err);
        setError('Failed to load privacy policy content.');
      } finally {
        setLoading(false);
      }
    }
    loadPolicy();
  }, []);

  const updateWordCount = useCallback(() => {
    if (editorRef.current) {
      const text = editorRef.current.innerText || '';
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      setWordCount(words);
    }
  }, []);

  const handleInput = useCallback(() => {
    setHasChanges(true);
    setSaved(false);
    updateWordCount();
  }, [updateWordCount]);

  // Execute formatting command
  const execCmd = useCallback((command, value = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    setHasChanges(true);
    setSaved(false);
  }, []);

  const handleInsertLink = useCallback(() => {
    const url = prompt('Enter URL:');
    if (url) {
      execCmd('createLink', url);
    }
  }, [execCmd]);

  // Save to Firestore
  const handleSave = async () => {
    if (!editorRef.current) return;
    setSaving(true);
    setError(null);
    try {
      const content = editorRef.current.innerHTML;
      await setDoc(POLICY_DOC_REF, {
        content,
        updatedAt: serverTimestamp()
      });
      originalContent.current = content;
      setHasChanges(false);
      setSaved(true);
      setLastUpdated(new Date());
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save privacy policy:', err);
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
          <p className="text-sm font-semibold text-slate-500">Loading privacy policy…</p>
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
              <h1 className="text-lg font-extrabold text-slate-800 tracking-tight">Privacy Policy</h1>
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
        {/* Toolbar — hidden in preview mode */}
        {!previewMode && (
          <div className="sticky top-[85px] z-10 bg-white/90 backdrop-blur-md rounded-xl border border-slate-200 shadow-sm px-4 py-2 flex flex-wrap items-center justify-center gap-1 mb-6">
            {/* Text formatting */}
              <ToolbarBtn icon={Bold} label="Bold (Ctrl+B)" onClick={() => execCmd('bold')} />
              <ToolbarBtn icon={Italic} label="Italic (Ctrl+I)" onClick={() => execCmd('italic')} />
              <ToolbarBtn icon={Underline} label="Underline (Ctrl+U)" onClick={() => execCmd('underline')} />

              <ToolbarSeparator />

              {/* Headings */}
              <ToolbarBtn icon={Heading1} label="Heading 1" onClick={() => execCmd('formatBlock', 'h1')} />
              <ToolbarBtn icon={Heading2} label="Heading 2" onClick={() => execCmd('formatBlock', 'h2')} />
              <ToolbarBtn icon={Heading3} label="Heading 3" onClick={() => execCmd('formatBlock', 'h3')} />
              <ToolbarBtn icon={Type} label="Paragraph" onClick={() => execCmd('formatBlock', 'p')} />

              <ToolbarSeparator />

              {/* Lists */}
              <ToolbarBtn icon={List} label="Bullet List" onClick={() => execCmd('insertUnorderedList')} />
              <ToolbarBtn icon={ListOrdered} label="Numbered List" onClick={() => execCmd('insertOrderedList')} />
              <ToolbarBtn icon={Quote} label="Block Quote" onClick={() => execCmd('formatBlock', 'blockquote')} />

              <ToolbarSeparator />

              {/* Alignment */}
              <ToolbarBtn icon={AlignLeft} label="Align Left" onClick={() => execCmd('justifyLeft')} />
              <ToolbarBtn icon={AlignCenter} label="Align Center" onClick={() => execCmd('justifyCenter')} />
              <ToolbarBtn icon={AlignRight} label="Align Right" onClick={() => execCmd('justifyRight')} />

              <ToolbarSeparator />

              {/* Links */}
              <ToolbarBtn icon={LinkIcon} label="Insert Link" onClick={handleInsertLink} />
              <ToolbarBtn icon={Unlink} label="Remove Link" onClick={() => execCmd('unlink')} />

              <ToolbarSeparator />

              {/* Misc */}
              <ToolbarBtn icon={Minus} label="Horizontal Rule" onClick={() => execCmd('insertHorizontalRule')} />
              <ToolbarBtn icon={Undo2} label="Undo (Ctrl+Z)" onClick={() => execCmd('undo')} />
              <ToolbarBtn icon={Redo2} label="Redo (Ctrl+Y)" onClick={() => execCmd('redo')} />
            </div>
        )}

        <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Editable content area */}
          <div className={!previewMode ? 'hidden' : ''}>
            <div
              className="prose prose-slate max-w-none p-8 lg:p-12 min-h-[500px] privacy-policy-content"
              dangerouslySetInnerHTML={{ __html: editorRef.current?.innerHTML || initialContent }}
            />
          </div>

          <div className={previewMode ? 'hidden' : ''}>
            <Editor
              initialContent={initialContent}
              onInput={handleInput}
              editorRef={editorRef}
            />
          </div>
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
