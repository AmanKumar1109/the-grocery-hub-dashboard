import React, { useState, useEffect, useRef } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Package,
  Plus,
  Search,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  X,
  Filter,
  Star,
  FolderPlus,
  Tag,
  Flame,
  Gift,
  CheckSquare,
  Square,
  ArchiveX,
  Check,
  AlertTriangle,
  Settings,
  Loader2,
  FolderSync,
  MoveRight,
  PenLine,
  DownloadCloud
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import Header from '../components/Header';
import ImageUploadInput from '../components/ImageUploadInput';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import * as XLSX from 'xlsx';

function SortableItemWrapper({ id, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    zIndex: isDragging ? 50 : 1,
    touchAction: 'none',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

export default function ItemsView() {
  const { items, categories, categoryDocs, addCategory, addSubcategory, renameSubcategory, deleteSubcategory, deleteCategory, renameCategory, editItem, toggleItemTrending, toggleItemBogo, toggleItemVisibility, toggleItemStock, deleteItem, bulkUpdateItems, reorderItemsBatch } = useAdmin();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [outOfStockOnly, setOutOfStockOnly] = useState(false);

  // Modals state
  const [viewingItem, setViewingItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [movingItem, setMovingItem] = useState(null);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isRenameCategoryModalOpen, setIsRenameCategoryModalOpen] = useState(false);
  const [isRenameSubcategoryModalOpen, setIsRenameSubcategoryModalOpen] = useState(false);

  // Bulk selection state
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [isBulkMoveModalOpen, setIsBulkMoveModalOpen] = useState(false);

  // Form states
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState('');

  const [renameCategoryName, setRenameCategoryName] = useState('');
  const [oldCategoryName, setOldCategoryName] = useState('');
  const [moveToCategoryName, setMoveToCategoryName] = useState('');
  const [moveToSubcategoryName, setMoveToSubcategoryName] = useState('');

  const [renameSubcategoryName, setRenameSubcategoryName] = useState('');
  const [oldSubcategoryName, setOldSubcategoryName] = useState('');
  const [parentCategoryForSub, setParentCategoryForSub] = useState('');

  const [editFormData, setEditFormData] = useState({
    name: '',
    category: '',
    subcategory: '',
    price: '',
    sellingPrice: '',
    recentBuyers: '',
    inStock: true,
    isTrending: false,
    image: ''
  });

  const listRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement before dragging starts
      },
    })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      const oldIndex = filteredItems.findIndex((item) => item.id === active.id);
      const newIndex = filteredItems.findIndex((item) => item.id === over.id);
      
      const originalSortOrders = filteredItems.map(item => item.sortOrder).sort((a,b) => a - b);
      const newArray = arrayMove(filteredItems, oldIndex, newIndex);
      
      const batchUpdates = newArray.map((item, index) => ({
        ...item,
        sortOrder: originalSortOrders[index]
      }));

      await reorderItemsBatch(batchUpdates);
    }
  };

  useEffect(() => {
    if (listRef.current) {
      gsap.fromTo(
        listRef.current.children,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out' }
      );
    }
  }, [selectedCategory, searchQuery, items.length]);

  const allCategoryTabs = ['All', '🔥 Trending', ...categories];

  const filteredItems = items.filter(item => {
    const matchesCategory =
      selectedCategory === 'All'
        ? true
        : selectedCategory === '🔥 Trending'
          ? !!item.isTrending
          : item.category === selectedCategory;
    const matchesSearch = (item.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStock = outOfStockOnly ? item.inStock === false : true;
    return matchesCategory && matchesSearch && matchesStock;
  });


  const handleAddCategorySubmit = async (e) => {
    e.preventDefault();
    setCategoryError('');
    if (!newCategoryName.trim()) return;

    const success = await addCategory(newCategoryName);
    if (!success) {
      setCategoryError('Category already exists or is invalid.');
      return;
    }

    setSelectedCategory(newCategoryName.trim());
    setNewCategoryName('');
    setIsAddCategoryModalOpen(false);
  };

  const handleStartEdit = (item) => {
    setEditingItem(item);
    setEditFormData({
      name: item.name,
      category: item.category,
      subcategory: item.subcategory || '',
      price: item.price,
      sellingPrice: item.sellingPrice || '',
      recentBuyers: item.recentBuyers !== undefined ? item.recentBuyers : '',
      inStock: item.inStock,
      isTrending: !!item.isTrending,
      isBogo: !!item.isBogo,
      image: item.image
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    await editItem(editingItem.id, editFormData);
    setEditingItem(null);
  };

  const handleConfirmDelete = async () => {
    if (deletingItem) {
      await deleteItem(deletingItem.id);
      setDeletingItem(null);
    }
  };

  const handleRenameCategorySubmit = async (e) => {
    e.preventDefault();
    setCategoryError('');
    if (!renameCategoryName.trim() || !oldCategoryName.trim()) return;

    const success = await renameCategory(oldCategoryName, renameCategoryName);
    if (!success) {
      setCategoryError('Category name already exists or is invalid.');
      return;
    }

    if (selectedCategory === oldCategoryName) {
      setSelectedCategory(renameCategoryName.trim());
    }
    setIsRenameCategoryModalOpen(false);
    setRenameCategoryName('');
    setOldCategoryName('');
  };

  const handleMoveItemSubmit = async (e) => {
    e.preventDefault();
    if (movingItem && moveToCategoryName) {
      await editItem(movingItem.id, { ...movingItem, category: moveToCategoryName, subcategory: moveToSubcategoryName });
      setMovingItem(null);
      setMoveToCategoryName('');
      setMoveToSubcategoryName('');
    }
  };

  const handleBulkMoveSubmit = async (e) => {
    e.preventDefault();
    if (selectedItemIds.length > 0 && moveToCategoryName) {
      const updates = { category: moveToCategoryName, subcategory: moveToSubcategoryName };
      await bulkUpdateItems(selectedItemIds, updates);
      setIsBulkMoveModalOpen(false);
      setSelectedItemIds([]);
      setMoveToCategoryName('');
      setMoveToSubcategoryName('');
    }
  };

  const toggleSelectAll = () => {
    if (selectedItemIds.length === filteredItems.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(filteredItems.map(i => i.id));
    }
  };

  const toggleSelectItem = (id) => {
    setSelectedItemIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleExportToExcel = () => {
    const dataToExport = items.map(item => ({
      ID: item.id,
      Name: item.name,
      Category: item.category || 'General',
      Subcategory: item.subcategory || 'None',
      MRP: item.sellingPrice || 0,
      SellingPrice: item.price || 0,
      Discount_Percentage: item.offPercentage || 0,
      Stock_Status: item.inStock !== false ? 'In Stock' : 'Out of Stock',
      Trending: item.isTrending ? 'Yes' : 'No',
      Buy1Get1: item.isBogo ? 'Yes' : 'No',
      Visibility: item.isVisible !== false ? 'Visible' : 'Hidden',
      RecentBuyers: item.recentBuyers || 0,
      Rating: item.rating || 5.0,
      ImageURL: item.image || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "GroceryProducts");
    XLSX.writeFile(workbook, "Grocery_Products_Catalog.xlsx");
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-50/50 flex flex-col">
      <Header
        title="Grocery Products Catalog"
        subtitle="Manage grocery categories, product listings in Indian Rupees (₹), toggle visibility (Eye/EyeOff), edit and remove products"
      />

      <main className="p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
        {/* Top Header & Actions Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h2 className="text-base font-bold text-slate-800">Supermarket Catalog Management</h2>
            <p className="text-xs text-slate-400">View, search, filter, and manage your supermarket products</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-start sm:justify-end">
            <button
              onClick={() => {
                setCategoryError('');
                setIsAddCategoryModalOpen(true);
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <FolderPlus className="w-4 h-4 text-emerald-600" /> Manage Categories
            </button>

            <button
              onClick={handleExportToExcel}
              className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <DownloadCloud className="w-4 h-4" /> Export to Excel
            </button>

            <Link
              to="/dashboard/items/add"
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Add Grocery Product
            </Link>
          </div>
        </div>

        {/* Search Bar & Horizontal Category Filter Pills */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-4 min-w-0">
          <div className="flex flex-col md:flex-row items-center gap-4 min-w-0">
            {/* Search Bar */}
            <div className="relative w-full md:w-72 shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search grocery item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>

            {/* Category Filter Pills (Smooth scroll with custom scrollbar) */}
            <div className="flex items-center gap-2 overflow-x-auto min-w-0 w-full pb-2 pt-1 custom-horizontal-scrollbar">
              {allCategoryTabs.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${selectedCategory === cat
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  {cat}
                </button>
              ))}

              <button
                onClick={() => {
                  setCategoryError('');
                  setIsAddCategoryModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                title="Create New Category"
              >
                <FolderPlus className="w-3.5 h-3.5" /> + Category
              </button>

              {selectedCategory !== 'All' && selectedCategory !== '🔥 Trending' && (
                <button
                  onClick={() => {
                    setOldCategoryName(selectedCategory);
                    setRenameCategoryName(selectedCategory);
                    setIsRenameCategoryModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  title="Rename this Category"
                >
                  <PenLine className="w-3.5 h-3.5" /> Rename
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={selectedItemIds.length > 0 && selectedItemIds.length === filteredItems.length}
                  onChange={toggleSelectAll}
                  className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                Select All
              </label>

              {selectedItemIds.length > 0 && (
                <button
                  onClick={() => setIsBulkMoveModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
                >
                  <FolderSync className="w-4 h-4" /> Move {selectedItemIds.length} Items
                </button>
              )}
            </div>

            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={outOfStockOnly}
                onChange={(e) => setOutOfStockOnly(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-rose-500 focus:ring-rose-500 border-slate-300"
              />
              <AlertTriangle className={`w-4 h-4 ${outOfStockOnly ? 'text-rose-500' : 'text-slate-400'}`} />
              Out of Stock
            </label>
          </div>
        </div>

        {/* Items Grid / Catalog */}
        {filteredItems.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">No products found</h3>
            <p className="text-xs text-slate-400">
              No grocery products added in Firestore database under "{selectedCategory}". Click below to add a new product.
            </p>
            <Link
              to="/dashboard/items/add"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs mt-2"
            >
              <Plus className="w-4 h-4" /> Add New Grocery Product
            </Link>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filteredItems.map(i => i.id)} strategy={rectSortingStrategy}>
              <div ref={listRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item) => {
                  const isVisible = item.isVisible !== false;

                  return (
                    <SortableItemWrapper key={item.id} id={item.id}>
                      <div
                        className={`bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_30px_-6px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group h-full relative ${
                          !isVisible ? 'opacity-75 bg-slate-50 border-dashed' : ''
                        }`}
                      >
                        {/* Item Image & Badges Container */}
                        <div className="relative h-52 overflow-hidden bg-slate-900 group">
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80'}
                            alt={item.name}
                            className={`w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out ${
                              !isVisible ? 'grayscale-50' : ''
                            }`}
                          />

                          {/* Gradient Overlays for Badges Contrast */}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40 opacity-80 pointer-events-none"></div>

                          {/* Top Left: Checkbox & Category Tag */}
                          <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedItemIds.includes(item.id)}
                              onChange={() => toggleSelectItem(item.id)}
                              className="w-5 h-5 rounded-lg shadow-md text-emerald-600 focus:ring-emerald-500 border-white/80 bg-white/90 cursor-pointer transition-transform active:scale-90"
                            />

                            <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-slate-900 font-extrabold text-[11px] shadow-sm tracking-tight border border-white/40">
                              {item.category || 'General'}
                            </span>
                          </div>

                          {/* Top Right: One-Click Stock & Visibility Badges */}
                          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                            {/* Visibility Badge */}
                            <button
                              onClick={() => toggleItemVisibility(item.id, isVisible)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black shadow-md backdrop-blur-md transition-all active:scale-95 cursor-pointer flex items-center gap-1 border ${
                                isVisible
                                  ? 'bg-emerald-500/90 hover:bg-emerald-600 text-white border-emerald-400/50'
                                  : 'bg-slate-800/90 hover:bg-slate-900 text-slate-300 border-slate-700'
                              }`}
                              title={isVisible ? 'Click to Hide' : 'Click to Show'}
                            >
                              {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                              {isVisible ? 'Visible' : 'Hidden'}
                            </button>

                            {/* Stock Badge */}
                            <button
                              onClick={() => toggleItemStock(item.id, item.inStock !== false)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black shadow-md backdrop-blur-md transition-all active:scale-95 cursor-pointer flex items-center gap-1 border ${
                                item.inStock !== false
                                  ? 'bg-emerald-600/90 hover:bg-emerald-700 text-white border-emerald-400/50'
                                  : 'bg-rose-600/90 hover:bg-rose-700 text-white border-rose-400/50'
                              }`}
                              title={item.inStock !== false ? 'Click to mark Out of Stock' : 'Click to mark In Stock'}
                            >
                              <Package className="w-3 h-3" />
                              {item.inStock !== false ? 'In Stock' : 'Out of Stock'}
                            </button>
                          </div>

                          {/* Bottom Image Overlay Badges: Trending & BOGO */}
                          <div className="absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-1.5">
                            {item.isTrending && (
                              <span className="px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] shadow-lg flex items-center gap-1 border border-amber-300">
                                <Flame className="w-3 h-3 fill-slate-950" /> Trending
                              </span>
                            )}

                            {item.isBogo && (
                              <span className="px-2.5 py-1 rounded-full bg-indigo-600 text-white font-black text-[10px] shadow-lg flex items-center gap-1 border border-indigo-400">
                                <Gift className="w-3 h-3 text-white" /> Buy 1 Get 1
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Card Main Content */}
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div>
                            {/* Title & Rating */}
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-emerald-600 transition-colors line-clamp-2">
                                {item.name}
                              </h3>
                              <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-xl border border-amber-200/60 text-amber-700 font-extrabold text-xs shrink-0 shadow-2xs">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span>{item.rating || 5.0}</span>
                              </div>
                            </div>

                            {item.recentBuyers > 0 && (
                              <span className="inline-block mt-1 text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100 font-bold">
                                🔥 {item.recentBuyers} recent buyers
                              </span>
                            )}
                          </div>

                          {/* Price & Discounts Block */}
                          <div className="pt-3 border-t border-slate-100 space-y-3">
                            <div className="flex items-baseline justify-between">
                              <div>
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Price</span>
                                <div className="flex items-baseline gap-2 flex-wrap mt-0.5">
                                  <span className="text-xl font-black text-slate-900 tracking-tight">₹{(item.price || 0).toFixed(2)}</span>
                                  {item.sellingPrice > 0 && item.sellingPrice > item.price && (
                                    <span className="text-xs text-slate-400 line-through font-bold">₹{(item.sellingPrice).toFixed(2)}</span>
                                  )}
                                </div>
                              </div>

                              {item.offPercentage > 0 && (
                                <span className="px-2 py-0.5 rounded-lg bg-rose-500 text-white text-[10px] font-black shadow-xs tracking-wider uppercase">
                                  {item.offPercentage}% OFF
                                </span>
                              )}
                            </div>

                            {/* Quick Feature Toggles Bar (4 Controls Grid) */}
                            <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                              {/* Trending Switch */}
                              <button
                                onClick={() => toggleItemTrending(item.id, !!item.isTrending)}
                                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer border ${
                                  item.isTrending
                                    ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-xs'
                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-amber-50 hover:text-amber-600'
                                }`}
                              >
                                <Flame className={`w-3.5 h-3.5 ${item.isTrending ? 'fill-slate-950' : ''}`} />
                                <span>Trending</span>
                              </button>

                              {/* BOGO Switch */}
                              <button
                                onClick={() => toggleItemBogo(item.id, !!item.isBogo)}
                                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer border ${
                                  item.isBogo
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600'
                                }`}
                              >
                                <Gift className="w-3.5 h-3.5" />
                                <span>Buy 1 Get 1</span>
                              </button>

                              {/* Stock Switch */}
                              <button
                                onClick={() => toggleItemStock(item.id, item.inStock !== false)}
                                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer border ${
                                  item.inStock !== false
                                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                                }`}
                              >
                                <Package className="w-3.5 h-3.5" />
                                <span>{item.inStock !== false ? 'In Stock' : 'Out Stock'}</span>
                              </button>

                              {/* Visibility Switch */}
                              <button
                                onClick={() => toggleItemVisibility(item.id, isVisible)}
                                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer border ${
                                  isVisible
                                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700 border-slate-300'
                                }`}
                              >
                                {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-slate-600" />}
                                <span>{isVisible ? 'Visible' : 'Hidden'}</span>
                              </button>
                            </div>

                            {/* Primary Action Buttons (Edit, Move, Delete) */}
                            <div className="grid grid-cols-3 gap-1.5 pt-1">
                              {/* Edit Button */}
                              <button
                                onClick={() => handleStartEdit(item)}
                                className="py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200/80 flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>

                              {/* Move Button */}
                              <button
                                onClick={() => setMovingItem(item)}
                                className="py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200/80 flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                              >
                                <MoveRight className="w-3.5 h-3.5" />
                                <span>Move</span>
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() => setDeletingItem(item)}
                                className="py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs border border-rose-200/80 flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </SortableItemWrapper>
            );
          })}
            </div>
            </SortableContext>
          </DndContext>
        )}
      </main>

      {/* MANAGE CATEGORIES MODAL */}
      {isAddCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Manage Grocery Categories</h3>
                  <p className="text-xs text-slate-400">Add new categories or delete existing categories from Firestore</p>
                </div>
              </div>
              <button onClick={() => setIsAddCategoryModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form to Add New Category */}
            <form onSubmit={handleAddCategorySubmit} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <label className="text-xs font-bold text-slate-700 block">Add New Category *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="e.g. Pasta & Noodles, Beverages..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm whitespace-nowrap"
                >
                  + Add Category
                </button>
              </div>
              {categoryError && <p className="text-xs text-rose-600 font-medium">{categoryError}</p>}
            </form>

            {/* List of Existing Categories with Delete Buttons */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Existing Categories ({categories.length})
              </p>
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 border border-slate-100 rounded-xl p-2 bg-slate-50/50">
                {categories.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No categories created yet.</p>
                ) : (
                  categoryDocs.map((catDoc) => (
                    <div
                      key={catDoc.name}
                      className="flex flex-col gap-2 p-2.5 rounded-xl bg-white border border-slate-100 hover:border-slate-200 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">{catDoc.name}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setOldCategoryName(catDoc.name);
                              setRenameCategoryName(catDoc.name);
                              setIsAddCategoryModalOpen(false);
                              setIsRenameCategoryModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-[11px] font-bold border border-amber-200 flex items-center gap-1 transition-colors cursor-pointer"
                            title={`Rename Category "${catDoc.name}"`}
                          >
                            <PenLine className="w-3.5 h-3.5" /> Rename
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (window.confirm(`Are you sure you want to delete category "${catDoc.name}"?`)) {
                                await deleteCategory(catDoc.name);
                                if (selectedCategory === catDoc.name) {
                                  setSelectedCategory('All');
                                }
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px] font-bold border border-rose-200 flex items-center gap-1 transition-colors cursor-pointer"
                            title={`Delete Category "${catDoc.name}"`}
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-50 space-y-2">
                        {/* Subcategories list */}
                        <div className="flex flex-wrap gap-1.5">
                          {(catDoc.subcategories || []).map(sub => (
                            <span key={sub} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-[10px] font-bold text-slate-700">
                              {sub}
                              <button type="button" onClick={() => {
                                setOldSubcategoryName(sub);
                                setRenameSubcategoryName(sub);
                                setParentCategoryForSub(catDoc.name);
                                setIsAddCategoryModalOpen(false);
                                setIsRenameSubcategoryModalOpen(true);
                              }} className="text-slate-400 hover:text-amber-500 cursor-pointer ml-1" title="Rename Subcategory">
                                <PenLine className="w-3 h-3" />
                              </button>
                              <button type="button" onClick={async () => {
                                if(window.confirm(`Delete subcategory "${sub}" from "${catDoc.name}"?`)) {
                                  await deleteSubcategory(catDoc.name, sub);
                                }
                              }} className="text-slate-400 hover:text-rose-500 cursor-pointer" title="Delete Subcategory">
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input type="text" id={`new-sub-${catDoc.name}`} placeholder="Add Subcategory..." className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                          <button type="button" onClick={async () => {
                            const input = document.getElementById(`new-sub-${catDoc.name}`);
                            if(input.value) { await addSubcategory(catDoc.name, input.value); input.value = ''; }
                          }} className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer">Add</button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddCategoryModalOpen(false)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ITEM MODAL */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-800">Edit Item Details</h2>
              <button onClick={() => setEditingItem(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category (Optional)</label>
                  <select
                    value={editFormData.category}
                    onChange={e => setEditFormData({ ...editFormData, category: e.target.value, subcategory: '' })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">General / None (No Category)</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Subcategory (Optional)</label>
                  <select
                    value={editFormData.subcategory}
                    onChange={e => setEditFormData({ ...editFormData, subcategory: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500"
                    disabled={!editFormData.category}
                  >
                    <option value="">None</option>
                    {categoryDocs.find(c => c.name === editFormData.category)?.subcategories?.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">MRP / Selling Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editFormData.sellingPrice}
                    onChange={e => setEditFormData({ ...editFormData, sellingPrice: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 60.00"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Our Price (₹)
                    {(() => {
                      const mrp = parseFloat(editFormData.sellingPrice);
                      const sale = parseFloat(editFormData.price);
                      if (mrp > 0 && sale > 0 && mrp > sale) {
                        const pct = Math.round(((mrp - sale) / mrp) * 100);
                        return (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-[11px]">
                            {pct}% OFF
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editFormData.price}
                    onChange={e => setEditFormData({ ...editFormData, price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 45.00"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Recent Buyers (Social Proof)</label>
                  <input
                    type="number"
                    value={editFormData.recentBuyers}
                    onChange={e => setEditFormData({ ...editFormData, recentBuyers: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 59 (Optional)"
                  />
                </div>
              </div>

              <ImageUploadInput
                label="Product Image"
                value={editFormData.image}
                onChange={(imageUrl) => setEditFormData(prev => ({ ...prev, image: imageUrl }))}
                folder="products"
              />

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Stock Availability</label>
                  <select
                    value={editFormData.inStock ? 'true' : 'false'}
                    onChange={e => setEditFormData({ ...editFormData, inStock: e.target.value === 'true' })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 text-xs font-semibold"
                  >
                    <option value="true">In Stock</option>
                    <option value="false">Out of Stock</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Trending Tag</label>
                  <select
                    value={editFormData.isTrending ? 'true' : 'false'}
                    onChange={e => setEditFormData({ ...editFormData, isTrending: e.target.value === 'true' })}
                    className="w-full bg-slate-50 border border-amber-200 rounded-xl px-2.5 py-2 text-amber-900 font-bold focus:ring-2 focus:ring-amber-400 text-xs"
                  >
                    <option value="false">Normal</option>
                    <option value="true">Trending Product</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Buy 1 Get 1</label>
                  <select
                    value={editFormData.isBogo ? 'true' : 'false'}
                    onChange={e => setEditFormData({ ...editFormData, isBogo: e.target.value === 'true' })}
                    className="w-full bg-slate-50 border border-indigo-200 rounded-xl px-2.5 py-2 text-indigo-900 font-bold focus:ring-2 focus:ring-indigo-400 text-xs"
                  >
                    <option value="false">No Offer</option>
                    <option value="true">Buy 1 Get 1 Free</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-800">Delete Product?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <strong>"{deletingItem.name}"</strong>? This will remove it from Firestore database.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Yes, Delete Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RENAME CATEGORY MODAL */}
      {isRenameCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <PenLine className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-800">Rename Category</h3>
              </div>
              <button onClick={() => setIsRenameCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-700 bg-slate-50 p-1.5 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRenameCategorySubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">New Category Name *</label>
                <input
                  type="text"
                  required
                  value={renameCategoryName}
                  onChange={(e) => setRenameCategoryName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. Fresh Vegetables"
                />
              </div>
              {categoryError && <p className="text-[11px] text-rose-500 font-bold">{categoryError}</p>}

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-[10px] text-amber-800 font-bold leading-tight flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Renaming this category will instantly update all items currently assigned to it!
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsRenameCategoryModalOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RENAME SUBCATEGORY MODAL */}
      {isRenameSubcategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <PenLine className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-800">Rename Subcategory</h3>
              </div>
              <button onClick={() => {
                setIsRenameSubcategoryModalOpen(false);
                setIsAddCategoryModalOpen(true);
              }} className="text-slate-400 hover:text-slate-700 bg-slate-50 p-1.5 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              setCategoryError('');
              if (!renameSubcategoryName.trim() || !oldSubcategoryName.trim()) return;
              
              const success = await renameSubcategory(parentCategoryForSub, oldSubcategoryName, renameSubcategoryName);
              if (!success) {
                setCategoryError('Subcategory name already exists or is invalid.');
                return;
              }
              setIsRenameSubcategoryModalOpen(false);
              setRenameSubcategoryName('');
              setOldSubcategoryName('');
              setParentCategoryForSub('');
              setIsAddCategoryModalOpen(true);
            }} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">New Subcategory Name *</label>
                <input
                  type="text"
                  required
                  value={renameSubcategoryName}
                  onChange={(e) => setRenameSubcategoryName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. Basmati"
                />
              </div>
              {categoryError && <p className="text-[11px] text-rose-500 font-bold">{categoryError}</p>}

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-[10px] text-amber-800 font-bold leading-tight flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Renaming this subcategory will instantly update all items currently assigned to it!
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => {
                  setIsRenameSubcategoryModalOpen(false);
                  setIsAddCategoryModalOpen(true);
                }} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOVE ITEM MODAL */}
      {movingItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                  <MoveRight className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-800">Move Item</h3>
              </div>
              <button onClick={() => setMovingItem(null)} className="text-slate-400 hover:text-slate-700 bg-slate-50 p-1.5 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleMoveItemSubmit} className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 font-semibold mb-1">Moving Product:</p>
                <p className="text-sm font-bold text-slate-800 truncate">{movingItem.name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Current Category: {movingItem.category}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Select New Category *</label>
                <select
                  required
                  value={moveToCategoryName}
                  onChange={(e) => {
                    setMoveToCategoryName(e.target.value);
                    setMoveToSubcategoryName('');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="" disabled>Select category...</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Select Subcategory (Optional)</label>
                <select
                  value={moveToSubcategoryName}
                  onChange={(e) => setMoveToSubcategoryName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  disabled={!moveToCategoryName}
                >
                  <option value="">None</option>
                  {categoryDocs.find(c => c.name === moveToCategoryName)?.subcategories?.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setMovingItem(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm">
                  Move Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK MOVE MODAL */}
      {isBulkMoveModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                  <FolderSync className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-800">Bulk Move Items</h3>
              </div>
              <button onClick={() => setIsBulkMoveModalOpen(false)} className="text-slate-400 hover:text-slate-700 bg-slate-50 p-1.5 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBulkMoveSubmit} className="space-y-4">
              <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 text-center">
                <p className="text-sm font-black text-indigo-800">{selectedItemIds.length} Items Selected</p>
                <p className="text-[11px] text-indigo-600 font-semibold mt-1">Ready to be moved to a new category</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Select New Category *</label>
                <select
                  required
                  value={moveToCategoryName}
                  onChange={(e) => {
                    setMoveToCategoryName(e.target.value);
                    setMoveToSubcategoryName('');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="" disabled>Select category...</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Select Subcategory (Optional)</label>
                <select
                  value={moveToSubcategoryName}
                  onChange={(e) => setMoveToSubcategoryName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  disabled={!moveToCategoryName}
                >
                  <option value="">None</option>
                  {categoryDocs.find(c => c.name === moveToCategoryName)?.subcategories?.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsBulkMoveModalOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm">
                  Move Items
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
