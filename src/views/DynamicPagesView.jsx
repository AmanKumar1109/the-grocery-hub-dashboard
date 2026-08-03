import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { collection, doc, getDocs, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { FileText, Save, Loader2, Plus, Pencil, Trash2, ArrowLeft, Eye, CheckCircle, AlertTriangle } from 'lucide-react';
import JoditEditor from 'jodit-react';

export default function DynamicPagesView() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'edit'
  
  // Editor state
  const [currentSlug, setCurrentSlug] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showInFooter, setShowInFooter] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);

  const editorRef = useRef(null);

  const loadPages = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'pages'));
      const pagesList = [];
      snap.forEach(doc => {
        pagesList.push({ slug: doc.id, ...doc.data() });
      });
      // Sort alphabetically by title
      pagesList.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      setPages(pagesList);
    } catch (err) {
      console.error('Failed to load pages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPages();
  }, []);

  const handleCreateNew = () => {
    setCurrentSlug('');
    setTitle('');
    setContent('');
    setShowInFooter(true);
    setError(null);
    setPreviewMode(false);
    setViewMode('edit');
  };

  const handleEdit = (page) => {
    setCurrentSlug(page.slug);
    setTitle(page.title || '');
    setContent(page.content || '');
    setShowInFooter(page.showInFooter ?? true);
    setError(null);
    setPreviewMode(false);
    setViewMode('edit');
  };

  const handleDelete = async (slug) => {
    if (!window.confirm('Are you sure you want to delete this page? This cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'pages', slug));
      setPages(pages.filter(p => p.slug !== slug));
    } catch (err) {
      console.error('Failed to delete page:', err);
      alert('Failed to delete page.');
    }
  };

  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    setSaving(true);
    setError(null);

    // If it's a new page, generate slug from title. If editing, preserve old slug unless we want them to change it. 
    // We will keep the slug immutable for simplicity, or just generate if currentSlug is empty.
    const targetSlug = currentSlug || generateSlug(title);

    try {
      await setDoc(doc(db, 'pages', targetSlug), {
        title: title.trim(),
        content: content,
        showInFooter: showInFooter,
        updatedAt: serverTimestamp()
      });

      // Reload list and go back
      await loadPages();
      setViewMode('list');
    } catch (err) {
      console.error('Failed to save page:', err);
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const joditConfig = useMemo(() => ({
    readonly: false,
    placeholder: 'Start writing your page content here...',
    height: 600,
    style: {
      fontFamily: 'inherit',
      color: '#334155'
    }
  }), []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50/50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Loading pages…</p>
        </div>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-slate-50/50 p-6 lg:p-10">
        <div className="max-w-5xl mx-auto w-full space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Dynamic Pages</h1>
              <p className="text-sm text-slate-500 mt-1 font-medium">Manage footer links and custom pages like Privacy Policy, Offers, etc.</p>
            </div>
            <button 
              onClick={handleCreateNew}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md shadow-emerald-200"
            >
              <Plus className="w-5 h-5" /> Add New Page
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                  <th className="p-4">Page Title</th>
                  <th className="p-4">URL Slug</th>
                  <th className="p-4">Footer Visibility</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pages.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500 font-medium">
                      No pages found. Click "Add New Page" to create one.
                    </td>
                  </tr>
                ) : (
                  pages.map(page => (
                    <tr key={page.slug} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{page.title}</div>
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded">/{page.slug}</span>
                      </td>
                      <td className="p-4">
                        {page.showInFooter ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-3.5 h-3.5" /> Visible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                            Hidden
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleEdit(page)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(page.slug)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Edit Mode
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50/50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="px-6 lg:px-10 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setViewMode('list')}
              className="p-2 -ml-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-extrabold text-slate-800 tracking-tight">
                {currentSlug ? 'Edit Page' : 'Create New Page'}
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                {currentSlug ? `/${currentSlug}` : 'URL will be generated from title'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
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

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-emerald-200 disabled:shadow-none"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Saving…' : 'Save Page'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 lg:px-10 py-6 max-w-5xl mx-auto w-full space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-semibold px-4 py-3 rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Page Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-base focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold"
                placeholder="e.g. About Us"
              />
            </div>
            <div className="md:col-span-2">
               <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showInFooter} 
                    onChange={e => setShowInFooter(e.target.checked)} 
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  <div className="ml-3">
                    <span className="block text-sm font-bold text-slate-700">Show link in Footer</span>
                    <span className="block text-xs font-medium text-slate-400">If active, this page will be linked under Customer Support.</span>
                  </div>
                </label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
          {!previewMode ? (
            <JoditEditor
              ref={editorRef}
              value={content}
              config={joditConfig}
              onBlur={newContent => setContent(newContent)}
              onChange={() => {}}
            />
          ) : (
            <div
              className="prose prose-slate max-w-none p-8 lg:p-12 min-h-[500px] privacy-policy-content"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}
        </div>
      </div>

      <style>{`
        .privacy-policy-content { color: #334155; font-size: 1rem; caret-color: #10b981; }
        .privacy-policy-content h1 { font-size: 1.75rem; font-weight: 800; color: #1e293b; margin-top: 1.5rem; margin-bottom: 0.75rem; line-height: 1.3; }
        .privacy-policy-content h2 { font-size: 1.35rem; font-weight: 700; color: #334155; margin-top: 1.25rem; margin-bottom: 0.5rem; line-height: 1.35; }
        .privacy-policy-content h3 { font-size: 1.1rem; font-weight: 700; color: #475569; margin-top: 1rem; margin-bottom: 0.5rem; }
        .privacy-policy-content p { font-size: 0.925rem; line-height: 1.7; color: #475569; margin-bottom: 0.75rem; }
        .privacy-policy-content ul, .privacy-policy-content ol { padding-left: 1.5rem; margin-bottom: 0.75rem; }
        .privacy-policy-content li { font-size: 0.925rem; line-height: 1.7; color: #475569; margin-bottom: 0.25rem; }
        .privacy-policy-content blockquote { border-left: 4px solid #10b981; background: #f0fdf4; padding: 0.75rem 1rem; margin: 1rem 0; border-radius: 0 0.5rem 0.5rem 0; color: #065f46; font-style: italic; }
        .privacy-policy-content a { color: #059669; text-decoration: underline; font-weight: 600; }
        .privacy-policy-content hr { border: none; border-top: 2px solid #e2e8f0; margin: 1.5rem 0; }
      `}</style>
    </div>
  );
}
