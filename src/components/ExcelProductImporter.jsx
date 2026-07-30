import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  Trash2,
  AlertTriangle,
  Plus,
  Loader2,
  CheckCircle,
  X,
  Image as ImageIcon,
  Edit2,
  ArrowRight,
  Check,
  Package
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import ImageUploadInput from './ImageUploadInput';
import { useNavigate } from 'react-router-dom';

export default function ExcelProductImporter() {
  const { categories, addItem } = useAdmin();
  const navigate = useNavigate();

  const [batchItems, setBatchItems] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [successCount, setSuccessCount] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Modal for editing image of a specific batch row
  const [imageModalItem, setImageModalItem] = useState(null);

  const fileInputRef = useRef(null);

  // Generate & Download Sample Template Excel
  const handleDownloadTemplate = () => {
    const sampleData = [
      {
        "Product Name": "Fresh Organic Tomatoes (1kg)",
        "Category": "Fresh Vegetables",
        "MRP": 60,
        "Our Price": 45,
        "Image URL": "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&auto=format&fit=crop&q=80",
        "In Stock": "Yes"
      },
      {
        "Product Name": "Amul Taaza Toned Milk (1L)",
        "Category": "Dairy & Eggs",
        "MRP": 54,
        "Our Price": 52,
        "Image URL": "",
        "In Stock": "Yes"
      },
      {
        "Product Name": "Fortune Sunflower Oil (1L)",
        "Category": "Snacks & Munchies",
        "MRP": 160,
        "Our Price": 140,
        "Image URL": "",
        "In Stock": "Yes"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Grocery Products");
    XLSX.writeFile(workbook, "Grocery_Products_Template.xlsx");
  };

  // Parse Excel / CSV File
  const processExcelFile = (file) => {
    if (!file) return;

    const validExtensions = ['xlsx', 'xls', 'csv'];
    const ext = file.name.split('.').pop().toLowerCase();
    if (!validExtensions.includes(ext)) {
      setErrorMsg('Invalid file format. Please upload a .xlsx, .xls, or .csv file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          setErrorMsg('Uploaded Excel sheet is empty.');
          return;
        }

        const parsedRows = rawJson.map((row, idx) => {
          // Flexible key lookup
          const findVal = (keys) => {
            for (const k of Object.keys(row)) {
              if (keys.some(key => k.toLowerCase().trim() === key.toLowerCase())) {
                return row[k];
              }
            }
            return '';
          };

          const name = findVal(['product name', 'name', 'product', 'item name', 'item', 'title', 'product_name']);
          const category = findVal(['category', 'cat', 'department', 'type']);
          const sellingPrice = findVal(['mrp', 'mrp (₹)', 'mrp (rs)', 'selling price', 'original price', 'retail price', 'retail_price']);
          const price = findVal(['our price', 'price', 'our price (₹)', 'our price (rs)', 'sale price', 'offer price', 'cost']);
          const image = findVal(['image url', 'image', 'img', 'photo', 'picture', 'image_url']);
          const stockVal = findVal(['in stock', 'stock', 'available']);

          const inStock = stockVal ? !['no', 'false', '0', 'out of stock'].includes(String(stockVal).toLowerCase().trim()) : true;

          return {
            id: `batch-${Date.now()}-${idx}`,
            name: String(name || '').trim(),
            category: String(category || '').trim() || 'General',
            sellingPrice: sellingPrice !== '' ? String(sellingPrice) : '',
            price: price !== '' ? String(price) : (sellingPrice !== '' ? String(sellingPrice) : ''),
            image: String(image || '').trim(),
            inStock: inStock
          };
        });

        setBatchItems(parsedRows);
        setErrorMsg('');
        setSuccessCount(null);
      } catch (err) {
        console.error("Excel Read Error:", err);
        setErrorMsg('Failed to process Excel file. Please verify sheet format.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processExcelFile(e.dataTransfer.files[0]);
    }
  };

  // Update a single field in batch row
  const updateBatchItem = (id, field, value) => {
    setBatchItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  // Delete a row from batch
  const removeBatchItem = (id) => {
    setBatchItems(prev => prev.filter(item => item.id !== id));
  };

  // Add an empty new row to batch
  const addBlankRow = () => {
    const newRow = {
      id: `batch-${Date.now()}-${Math.random()}`,
      name: '',
      category: 'General',
      sellingPrice: '',
      price: '',
      image: '',
      inStock: true
    };
    setBatchItems(prev => [...prev, newRow]);
  };

  // Save all valid batch items to Firestore catalog
  const handleSaveAllToFirestore = async () => {
    if (batchItems.length === 0) return;

    // Filter items with at least a name
    const validItems = batchItems.filter(item => item.name.trim() !== '');

    if (validItems.length === 0) {
      setErrorMsg('Please enter a product name for at least one product before importing.');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    let count = 0;
    try {
      for (let i = 0; i < validItems.length; i++) {
        const item = validItems[i];
        
        // Default fallback image if empty
        const finalImage = item.image.trim() || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&auto=format&fit=crop&q=80';

        await addItem({
          name: item.name.trim(),
          category: item.category.trim() || 'General',
          sellingPrice: item.sellingPrice || item.price || '0',
          price: item.price || item.sellingPrice || '0',
          image: finalImage,
          inStock: item.inStock !== false,
          isTrending: false,
          isBogo: false,
          recentBuyers: 0
        });

        count++;
        setImportProgress(Math.round(((i + 1) / validItems.length) * 100));
      }

      setSuccessCount(count);
      setBatchItems([]);
      setTimeout(() => {
        navigate('/dashboard/items');
      }, 1500);
    } catch (err) {
      console.error("Bulk Import Error:", err);
      setErrorMsg("Error while importing products to Firestore catalog. Please try again.");
    } finally {
      setIsImporting(false);
    }
  };

  // Summary counts
  const missingPriceCount = batchItems.filter(item => !item.price || parseFloat(item.price) <= 0).length;
  const missingImageCount = batchItems.filter(item => !item.image).length;
  const validNameCount = batchItems.filter(item => item.name.trim() !== '').length;

  return (
    <div className="space-y-6">
      {/* Excel Upload Header & Download Template Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Bulk Excel / CSV Product Import</h2>
              <p className="text-xs text-slate-400">Upload Excel spreadsheet to automatically extract product names, prices & categories</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" /> Download Sample Template
          </button>
        </div>

        {/* Dropzone */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".xlsx, .xls, .csv"
          onChange={(e) => e.target.files && processExcelFile(e.target.files[0])}
          className="hidden"
        />

        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            isDragOver
              ? 'border-emerald-500 bg-emerald-50/60'
              : 'border-slate-200 hover:border-emerald-400 bg-slate-50/40 hover:bg-slate-50'
          }`}
        >
          <div className="max-w-md mx-auto space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                Click to browse Excel sheet <span className="font-normal text-slate-500">or drag and drop here</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Supports .xlsx, .xls and .csv spreadsheet formats</p>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg('')} className="p-1 hover:bg-rose-100 rounded-lg text-rose-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {successCount !== null && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">Successfully Imported {successCount} Products to Firestore!</p>
              <p className="text-xs text-emerald-600">Redirecting to grocery catalog...</p>
            </div>
          </div>
        )}
      </div>

      {/* PARSED EXCEL BATCH EDIT LOG & PREVIEW TABLE */}
      {batchItems.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
          {/* Stats Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-slate-800">
                  Batch Edit Log ({batchItems.length} Products Imported)
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  {validNameCount} Ready to Save
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Review extracted fields below. You can edit prices, set categories, and upload/link images for each product.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {missingPriceCount > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  {missingPriceCount} Missing Price
                </div>
              )}

              {missingImageCount > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-bold">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                  {missingImageCount} Missing Image
                </div>
              )}
            </div>
          </div>

          {/* Table of Batch Items */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-3 w-12 text-center">#</th>
                  <th className="py-3 px-4 min-w-[200px]">Product Name *</th>
                  <th className="py-3 px-4 min-w-[150px]">Category</th>
                  <th className="py-3 px-3 min-w-[110px]">MRP (₹)</th>
                  <th className="py-3 px-3 min-w-[110px]">Our Price (₹)</th>
                  <th className="py-3 px-4 min-w-[180px]">Product Image</th>
                  <th className="py-3 px-3 min-w-[100px] text-center">Stock</th>
                  <th className="py-3 px-3 w-12 text-center">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batchItems.map((item, index) => {
                  const isMissingPrice = !item.price || parseFloat(item.price) <= 0;
                  const isMissingImage = !item.image;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Row Index */}
                      <td className="py-3 px-3 text-center font-bold text-slate-400">
                        {index + 1}
                      </td>

                      {/* Product Name */}
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          required
                          value={item.name}
                          placeholder="e.g. Fresh Tomatoes"
                          onChange={(e) => updateBatchItem(item.id, 'name', e.target.value)}
                          className={`w-full px-3 py-1.5 rounded-lg border text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none ${
                            !item.name.trim() ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200 bg-white'
                          }`}
                        />
                      </td>

                      {/* Category Dropdown/Text */}
                      <td className="py-3 px-4">
                        <select
                          value={item.category}
                          onChange={(e) => updateBatchItem(item.id, 'category', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="General">General</option>
                          {categories.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </td>

                      {/* MRP */}
                      <td className="py-3 px-3">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="e.g. 60"
                          value={item.sellingPrice}
                          onChange={(e) => updateBatchItem(item.id, 'sellingPrice', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                        />
                      </td>

                      {/* Our Price */}
                      <td className="py-3 px-3">
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="e.g. 45"
                          value={item.price}
                          onChange={(e) => updateBatchItem(item.id, 'price', e.target.value)}
                          className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold focus:ring-2 focus:ring-emerald-500 ${
                            isMissingPrice ? 'border-amber-400 bg-amber-50 text-amber-900' : 'border-slate-200 bg-white text-slate-800'
                          }`}
                        />
                      </td>

                      {/* Product Image & Trigger for Image Upload Modal */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {item.image ? (
                            <div className="w-8 h-8 rounded-md bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-md bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center shrink-0 text-slate-400">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => setImageModalItem(item)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                              isMissingImage
                                ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {isMissingImage ? '+ Add Image' : 'Edit Image'}
                          </button>
                        </div>
                      </td>

                      {/* Stock Status Toggle */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => updateBatchItem(item.id, 'inStock', !item.inStock)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                            item.inStock
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.inStock ? 'In Stock' : 'Out'}
                        </button>
                      </td>

                      {/* Remove Row */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeBatchItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Remove from batch"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Action Footer Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={addBlankRow}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Row Manually
              </button>

              <button
                type="button"
                onClick={() => setBatchItems([])}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" /> Discard Batch
              </button>
            </div>

            <button
              type="button"
              disabled={isImporting || validNameCount === 0}
              onClick={handleSaveAllToFirestore}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving to Catalog ({importProgress}%)...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Save All {validNameCount} Products to Firestore</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* INDIVIDUAL BATCH ITEM IMAGE UPLOAD MODAL */}
      {imageModalItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800">Upload or Link Image</h3>
                <p className="text-xs text-slate-500 truncate max-w-xs">{imageModalItem.name || 'Product Image'}</p>
              </div>
              <button
                onClick={() => setImageModalItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ImageUploadInput
              label="Product Image"
              value={imageModalItem.image}
              onChange={(newUrl) => {
                updateBatchItem(imageModalItem.id, 'image', newUrl);
                setImageModalItem(prev => ({ ...prev, image: newUrl }));
              }}
              folder="products"
            />

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setImageModalItem(null)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
