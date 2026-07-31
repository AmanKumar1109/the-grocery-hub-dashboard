import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Save, Loader2, Image as ImageIcon, Trash2, Plus, CheckCircle, AlertTriangle, GripVertical } from 'lucide-react';
import ImageUploadInput from '../components/ImageUploadInput';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const BANNERS_DOC_REF = doc(db, 'settings', 'banners');

// Sortable Item Wrapper for Drag & Drop
function SortableBannerItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex items-center pr-4">
      <div {...attributes} {...listeners} className="p-4 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600">
        <GripVertical className="w-5 h-5" />
      </div>
      {children}
    </div>
  );
}

export default function BannersView() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  
  const [banners, setBanners] = useState([]);
  const [newBannerImage, setNewBannerImage] = useState('');
  const [newBannerLink, setNewBannerLink] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  useEffect(() => {
    async function loadBanners() {
      try {
        const snap = await getDoc(BANNERS_DOC_REF);
        if (snap.exists()) {
          const data = snap.data();
          setBanners(data.items || []);
        }
      } catch (err) {
        console.error('Failed to load banners:', err);
        setError('Failed to load banners.');
      } finally {
        setLoading(false);
      }
    }
    loadBanners();
  }, []);

  const handleAddBanner = () => {
    if (!newBannerImage) return;
    const newId = Date.now().toString();
    setBanners([...banners, { id: newId, image: newBannerImage, link: newBannerLink }]);
    setNewBannerImage('');
    setNewBannerLink('');
  };

  const handleDeleteBanner = (id) => {
    setBanners(banners.filter(b => b.id !== id));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setBanners((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await setDoc(BANNERS_DOC_REF, {
        items: banners,
        updatedAt: serverTimestamp()
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save banners:', err);
      setError('Failed to save banners. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Loading Banners…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50/50">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="px-6 lg:px-10 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-200">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-800 tracking-tight">App Banners</h1>
              <p className="text-xs text-slate-400 font-medium">Manage sliding hero banners for the customer app</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {saved && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1 animate-in fade-in duration-200">
                <CheckCircle className="w-3 h-3" /> Saved!
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed cursor-pointer text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-purple-200 disabled:shadow-none"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save Banners'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 lg:px-10 py-8 max-w-4xl mx-auto w-full space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-semibold px-4 py-3 rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}

        {/* Add New Banner */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
          <h2 className="text-base font-bold text-slate-800">Add New Banner</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <ImageUploadInput
                label="Upload Banner Image"
                folder="banners"
                value={newBannerImage}
                onChange={setNewBannerImage}
              />
              <p className="text-[10px] text-slate-400 mt-2">Recommended size: 800x400px (2:1 ratio)</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Banner Link (Optional)</label>
                <input
                  type="text"
                  value={newBannerLink}
                  onChange={(e) => setNewBannerLink(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none"
                  placeholder="e.g., /category/organic-fruits"
                />
                <p className="text-[10px] text-slate-400 mt-1.5">Where should users go when they click this banner?</p>
              </div>

              <button
                onClick={handleAddBanner}
                disabled={!newBannerImage}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white disabled:bg-slate-300 disabled:cursor-not-allowed py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add to Sliders
              </button>
            </div>
          </div>
        </div>

        {/* Existing Banners */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">Current Banners ({banners.length})</h2>
            <p className="text-xs text-slate-500">Drag & drop to reorder</p>
          </div>

          {banners.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 border-dashed p-10 text-center text-slate-400">
              <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold">No banners added yet.</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={banners.map(b => b.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {banners.map((banner) => (
                    <SortableBannerItem key={banner.id} id={banner.id}>
                      <div className="flex-1 flex items-center gap-4 py-2">
                        <img 
                          src={banner.image} 
                          alt="Banner Preview" 
                          className="w-32 h-16 object-cover rounded-lg bg-slate-100 border border-slate-200"
                        />
                        <div className="flex-1">
                          <p className="text-xs text-slate-400 font-semibold mb-1">Link Destination</p>
                          <p className="text-sm font-bold text-slate-700 truncate">{banner.link || 'None (Unclickable)'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteBanner(banner.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove Banner"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </SortableBannerItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </div>
  );
}
