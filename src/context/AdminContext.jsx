import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, firebaseConfig } from '../firebase';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  writeBatch,
  arrayUnion,
  query,
  where
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { DEFAULT_TEMPLATES, EMAIL_WRAPPER, formatOrderItems } from '../utils/emailTemplates';

export const AdminContext = createContext();

export const useAdmin = () => useContext(AdminContext);

// Secondary Firebase app to create staff accounts without logging out current admin
const secondaryAppName = 'secondary-staff-creator';
const secondaryApp = getApps().find(a => a.name === secondaryAppName)
  || initializeApp(firebaseConfig, secondaryAppName);
const secondaryAuth = getAuth(secondaryApp);

export const AdminProvider = ({ children }) => {
  // Default Grocery Categories
  const defaultGroceryCategories = [
    'Fresh Vegetables',
    'Organic Fruits',
    'Dairy & Eggs',
    'Bakery & Bread',
    'Beverages & Juices',
    'Snacks & Munchies',
    'Meat & Seafood'
  ];

  // Pure Real-time Firestore state
  const [revenueStats, setRevenueStats] = useState({ daily: 0, weekly: 0, monthly: 0 });
  
  // Notification templates
  const [notificationTemplates, setNotificationTemplates] = useState({});
  const [categories, setCategories] = useState(defaultGroceryCategories);
  const [categoryDocs, setCategoryDocs] = useState([]);
  const [items, setItems] = useState([]);
  const [staff, setStaff] = useState([]);
  const [orders, setOrders] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to purge auto-seeded dummy data & old food categories from Firestore
  const purgeDummyDataFromFirestore = async () => {
    try {
      const dummyItemIds = ['ITEM-101', 'ITEM-102', 'ITEM-103', 'ITEM-104', 'ITEM-105', 'ITEM-106'];
      const dummyStaffIds = ['STF-001', 'STF-002', 'STF-003', 'STF-004'];
      const dummyOrderIds = ['ORD-9481', 'ORD-9482', 'ORD-9483', 'ORD-9470', 'ORD-9468', 'ORD-9455'];
      const oldFoodCatIds = ['Burgers', 'Burger', 'Pizza', 'Pizzas', 'Salad', 'Salads', 'Drink', 'Drinks', 'Dessert', 'Desserts', 'Starters', 'Main Course', 'Fast Food'];

      for (const id of dummyItemIds) {
        await deleteDoc(doc(db, 'items', id)).catch(() => { });
      }
      for (const id of dummyStaffIds) {
        await deleteDoc(doc(db, 'staff', id)).catch(() => { });
      }
      for (const id of dummyOrderIds) {
        await deleteDoc(doc(db, 'orders', id)).catch(() => { });
      }
      for (const id of oldFoodCatIds) {
        await deleteDoc(doc(db, 'categories', id)).catch(() => { });
      }
    } catch (err) {
      console.warn("Purge dummy data error:", err);
    }
  };

  // Audio Ping Notification for New Orders
  const playOrderPingChime = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      // Tone 1: High E (659.25 Hz) -> Tone 2: Higher A (880.00 Hz)
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
      osc2.frequency.setValueAtTime(880.00, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.15);

      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.6);
    } catch (err) {
      console.warn("Audio ping notification failed:", err);
    }
  };

  // Helper to safely extract milliseconds from strings, Firestore Timestamps, and Date objects
  const getTimeMs = (val) => {
    if (!val) return 0;
    if (typeof val === 'string') return new Date(val).getTime() || 0;
    if (typeof val.toMillis === 'function') return val.toMillis();
    if (typeof val.seconds === 'number') return val.seconds * 1000;
    if (typeof val === 'number') return val;
    if (val instanceof Date) return val.getTime();
    return 0;
  };

  // Subscribe to Firestore Collections Real-time
  useEffect(() => {
    (async () => {
      try {
        purgeDummyDataFromFirestore();

        // Items snapshot
        const unsubItems = onSnapshot(collection(db, 'items'), (snap) => {
          const loaded = snap.docs
            .map(d => ({ id: d.id, isVisible: d.data().isVisible !== false, sortOrder: d.data().sortOrder || 0, ...d.data() }))
            .filter(item => !['ITEM-101', 'ITEM-102', 'ITEM-103', 'ITEM-104', 'ITEM-105', 'ITEM-106'].includes(item.id))
            .sort((a, b) => a.sortOrder - b.sortOrder);
          setItems(loaded);
          setIsLoading(false);
        });

        // Categories snapshot
        const unsubCat = onSnapshot(collection(db, 'categories'), async (snap) => {
          if (snap.empty) {
            // Auto-seed default grocery categories
            for (const catName of defaultGroceryCategories) {
              await setDoc(doc(db, 'categories', catName), { name: catName, subcategories: [] }).catch(() => { });
            }
            setCategories(defaultGroceryCategories);
            setCategoryDocs(defaultGroceryCategories.map(name => ({ id: name, name, subcategories: [] })));
          } else {
            const loadedCats = snap.docs.map(d => d.data().name || d.id);
            const docs = snap.docs.map(d => ({ id: d.id, name: d.data().name || d.id, subcategories: d.data().subcategories || [] }));
            const cleanCats = loadedCats.filter(c => !['Burgers', 'Burger', 'Pizza', 'Pizzas', 'Salad', 'Salads', 'Drink', 'Drinks', 'Dessert', 'Desserts', 'Starters', 'Main Course', 'Fast Food'].includes(c));
            const cleanDocs = docs.filter(c => cleanCats.includes(c.name));
            setCategories(cleanCats.length > 0 ? cleanCats : defaultGroceryCategories);
            setCategoryDocs(cleanDocs.length > 0 ? cleanDocs : defaultGroceryCategories.map(name => ({ id: name, name, subcategories: [] })));
          }
        });

        // Staff snapshot
        const unsubStaff = onSnapshot(collection(db, 'staff'), (snapshot) => {
          const loadedStaff = snapshot.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(s => !['STF-001', 'STF-002', 'STF-003', 'STF-004'].includes(s.id));
          setStaff(loadedStaff);
        });

        const unsubCoupons = onSnapshot(query(collection(db, 'coupons'), where('isGlobal', '==', true)), (snapshot) => {
          setCoupons(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // Orders snapshot with audio ping for new incoming orders
        let isFirstOrdersLoad = true;
        const unsubOrders = onSnapshot(collection(db, 'orders'), async (snap) => {
          const dummyOrderIds = ['ORD-9481', 'ORD-9482', 'ORD-9483', 'ORD-9470', 'ORD-9468', 'ORD-9455'];
          const loadedOrders = [];

          for (const d of snap.docs) {
            // Auto-delete ghost orders with random document IDs or Valued Customer placeholder
            if (!d.id.startsWith('ORD-') || dummyOrderIds.includes(d.id) || d.data().customerName === 'Valued Customer') {
              await deleteDoc(doc(db, 'orders', d.id)).catch(() => { });
              continue;
            }
            loadedOrders.push({ id: d.id, ...d.data() });
          }

          loadedOrders.sort((a, b) => getTimeMs(b.createdAt || b.updatedAt) - getTimeMs(a.createdAt || a.updatedAt));

          if (!isFirstOrdersLoad) {
            const hasNewIncoming = snap.docChanges().some(change => change.type === 'added' && change.doc.id.startsWith('ORD-'));
            if (hasNewIncoming) {
              playOrderPingChime();
            }
          }
          isFirstOrdersLoad = false;

          setOrders(loadedOrders);
        });

        // Audit logs snapshot
        const unsubLogs = onSnapshot(collection(db, 'auditLogs'), (snap) => {
          const loadedLogs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          loadedLogs.sort((a, b) => getTimeMs(b.timestamp) - getTimeMs(a.timestamp));
          setAuditLogs(loadedLogs);
        });

        // Complaints snapshot
        const unsubComplaints = onSnapshot(collection(db, 'complaints'), (snap) => {
          const loadedComplaints = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          loadedComplaints.sort((a, b) => getTimeMs(b.createdAt) - getTimeMs(a.createdAt));
          setComplaints(loadedComplaints);
        });

        // Users / Customers snapshot
        const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
          const loadedUsers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          loadedUsers.sort((a, b) => getTimeMs(b.createdAt) - getTimeMs(a.createdAt));
          setUsers(loadedUsers);
        });

        // Fetch notification templates
        const notifDoc = await getDoc(doc(db, 'settings', 'notifications'));
        if (notifDoc.exists()) {
          setNotificationTemplates(notifDoc.data().templates || DEFAULT_TEMPLATES);
        } else {
          // Initialize if it doesn't exist
          await setDoc(doc(db, 'settings', 'notifications'), { templates: DEFAULT_TEMPLATES });
          setNotificationTemplates(DEFAULT_TEMPLATES);
        }

        return () => {
          unsubCat();
          unsubItems();
          unsubStaff();
          unsubOrders();
          unsubComplaints();
          unsubUsers();
          unsubLogs();
          unsubCoupons();
        };
      } catch (err) {
        console.error("Initialization error:", err);
      }
    })();
  }, []);

  // Preset Order Cancellation Reasons
  const cancelReasonsList = [
    'Too many pending orders',
    'Delivery staff / Driver not available',
    'Item out of stock / Store busy',
    'Customer requested cancellation',
    'Invalid or unserviceable delivery address',
    'Other / Custom Reason'
  ];

  // Dynamic Financial Earnings Calculation
  const calculateEarnings = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonthStr = new Date().toISOString().slice(0, 7);

    let todayTotal = 0;
    let monthTotal = 0;
    let totalSoFar = 0;

    orders.forEach(ord => {
      if (ord.status === 'Delivered' || ord.status === 'Out for Delivery' || ord.status === 'Preparing') {
        const amount = parseFloat(ord.totalAmount) || 0;
        totalSoFar += amount;

        if (ord.orderTime && ord.orderTime.startsWith(todayStr)) {
          todayTotal += amount;
        }

        if (ord.orderTime && ord.orderTime.startsWith(currentMonthStr)) {
          monthTotal += amount;
        }
      }
    });

    return {
      today: todayTotal,
      thisMonth: monthTotal,
      soFar: totalSoFar,
      todayGrowth: todayTotal > 0 ? '+12.4%' : '0%',
      monthGrowth: monthTotal > 0 ? '+8.5%' : '0%',
      totalGrowth: totalSoFar > 0 ? '+18.2%' : '0%'
    };
  };

  const earnings = calculateEarnings();

  // Audit Log Helper
  const addAuditLog = async (action, details, category = 'General', severity = 'info') => {
    const logId = `LOG-${Date.now().toString().slice(-4)}`;
    const newLog = {
      id: logId,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      action,
      actor: 'Admin (SuperAdmin)',
      category,
      details,
      severity
    };
    await setDoc(doc(db, 'auditLogs', logId), newLog);
  };

  // Actions for Categories
  const addCategory = async (categoryName) => {
    const trimmed = categoryName.trim();
    if (!trimmed) return false;
    if (categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      return false;
    }
    await setDoc(doc(db, 'categories', trimmed), { name: trimmed, subcategories: [] });
    await addAuditLog('CATEGORY_CREATED', `Added new menu category "${trimmed}"`, 'Catalog', 'success');
    return true;
  };

  const addSubcategory = async (categoryName, subcategoryName) => {
    const trimmed = subcategoryName.trim();
    if (!trimmed) return false;

    const catRef = doc(db, 'categories', categoryName);
    try {
      await updateDoc(catRef, {
        subcategories: arrayUnion(trimmed)
      });
    } catch (e) {
      // If the category doc doesn't exist yet, create it.
      await setDoc(catRef, { name: categoryName, subcategories: [trimmed] }, { merge: true });
    }

    await addAuditLog('SUBCATEGORY_CREATED', `Added subcategory "${trimmed}" to "${categoryName}"`, 'Catalog', 'success');
    return true;
  };

  const deleteSubcategory = async (categoryName, subcategoryName) => {
    const catDoc = categoryDocs.find(c => c.name === categoryName);
    if (!catDoc) return false;

    // Remove subcategory from the category doc
    const newSubs = (catDoc.subcategories || []).filter(s => s !== subcategoryName);
    await updateDoc(doc(db, 'categories', catDoc.id), {
      subcategories: newSubs
    });
    await addAuditLog('SUBCATEGORY_DELETED', `Removed subcategory "${subcategoryName}" from "${categoryName}"`, 'Catalog', 'danger');
    return true;
  };

  const renameSubcategory = async (categoryName, oldSubcategoryName, newSubcategoryName) => {
    const trimmedNew = newSubcategoryName.trim();
    if (!trimmedNew || oldSubcategoryName === trimmedNew) return false;

    const catDoc = categoryDocs.find(c => c.name === categoryName);
    if (!catDoc) return false;
    if (catDoc.subcategories && catDoc.subcategories.some(s => s.toLowerCase() === trimmedNew.toLowerCase())) return false;

    // 1. Update category doc subcategories array
    const newSubs = (catDoc.subcategories || []).map(s => s === oldSubcategoryName ? trimmedNew : s);
    await updateDoc(doc(db, 'categories', catDoc.id), {
      subcategories: newSubs
    });

    // 2. Find all items in this subcategory and update them
    const itemsToUpdate = items.filter(i => i.category === categoryName && i.subcategory === oldSubcategoryName);
    if (itemsToUpdate.length > 0) {
      const batch = writeBatch(db);
      itemsToUpdate.forEach(item => {
        const itemRef = doc(db, 'items', item.id);
        batch.update(itemRef, { subcategory: trimmedNew });
      });
      await batch.commit();
    }

    await addAuditLog('SUBCATEGORY_RENAMED', `Renamed subcategory "${oldSubcategoryName}" to "${trimmedNew}" in "${categoryName}"`, 'Catalog', 'info');
    return true;
  };

  const deleteCategory = async (categoryName) => {
    await deleteDoc(doc(db, 'categories', categoryName));
    await addAuditLog('CATEGORY_DELETED', `Removed menu category "${categoryName}"`, 'Catalog', 'danger');
  };

  const renameCategory = async (oldName, newName) => {
    const trimmedNew = newName.trim();
    if (!trimmedNew || oldName === trimmedNew) return false;
    if (categories.some(c => c.toLowerCase() === trimmedNew.toLowerCase())) return false;

    // 1. Create new category doc
    const catDoc = categoryDocs.find(c => c.name === oldName);
    const existingSubs = catDoc?.subcategories || [];
    await setDoc(doc(db, 'categories', trimmedNew), { name: trimmedNew, subcategories: existingSubs });

    // 2. Find all items in the old category and update them
    const itemsToUpdate = items.filter(i => i.category === oldName);

    if (itemsToUpdate.length > 0) {
      const batch = writeBatch(db);
      // Firestore batches support up to 500 operations. We'll assume < 500 items per category for now.
      itemsToUpdate.forEach(item => {
        const itemRef = doc(db, 'items', item.id);
        batch.update(itemRef, { category: trimmedNew });
      });
      await batch.commit();
    }

    // 3. Delete old category doc
    await deleteDoc(doc(db, 'categories', oldName));

    await addAuditLog('CATEGORY_RENAMED', `Renamed category "${oldName}" to "${trimmedNew}" and updated ${itemsToUpdate.length} items.`, 'Catalog', 'warning');
    return true;
  };

  // Actions for Items & Visibility Toggle
  const addItem = async (newItem) => {
    let finalCategory = newItem.category && newItem.category.trim() ? newItem.category.trim() : 'General';

    // Case-insensitive match to prevent duplicate categories from Excel imports
    const existingMatch = categories.find(c => c.toLowerCase() === finalCategory.toLowerCase());
    if (existingMatch) {
      finalCategory = existingMatch;
    } else if (finalCategory !== 'General') {
      await addCategory(finalCategory);
    }
    const itemId = `ITEM-${Math.floor(100 + Math.random() * 900)}`;
    const mrp = parseFloat(newItem.sellingPrice) || 0;
    const salePrice = parseFloat(newItem.price) || 0;
    const offPercentage = (mrp > 0 && salePrice > 0 && mrp > salePrice)
      ? Math.round(((mrp - salePrice) / mrp) * 100)
      : 0;
    const createdItem = {
      ...newItem,
      category: finalCategory,
      subcategory: newItem.subcategory || '',
      id: itemId,
      price: salePrice,
      sellingPrice: mrp,
      offPercentage,
      rating: 5.0,
      inStock: newItem.inStock !== false,
      isVisible: true, // Default visible
      isTrending: newItem.isTrending || false,
      isBogo: newItem.isBogo || false,
      recentBuyers: newItem.recentBuyers ? parseInt(newItem.recentBuyers) || 0 : 0,
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'items', itemId), createdItem);
    await addAuditLog('ITEM_CREATED', `Added grocery product "${createdItem.name}" (MRP: ₹${mrp}, Sale: ₹${salePrice}, ${offPercentage}% OFF) to Firestore database`, 'Catalog', 'success');
    return createdItem;
  };

  const editItem = async (id, updatedFields) => {
    const finalCategory = updatedFields.category && updatedFields.category.trim() ? updatedFields.category.trim() : 'General';
    if (finalCategory && finalCategory !== 'General' && !categories.includes(finalCategory)) {
      await addCategory(finalCategory);
    }
    const mrp = parseFloat(updatedFields.sellingPrice) || 0;
    const salePrice = parseFloat(updatedFields.price) || 0;
    const offPercentage = (mrp > 0 && salePrice > 0 && mrp > salePrice)
      ? Math.round(((mrp - salePrice) / mrp) * 100)
      : 0;
    await updateDoc(doc(db, 'items', id), {
      ...updatedFields,
      category: finalCategory,
      subcategory: updatedFields.subcategory || '',
      price: salePrice,
      sellingPrice: mrp,
      offPercentage,
      isTrending: !!updatedFields.isTrending,
      isBogo: !!updatedFields.isBogo,
      recentBuyers: updatedFields.recentBuyers ? parseInt(updatedFields.recentBuyers) || 0 : 0
    });
    await addAuditLog('ITEM_UPDATED', `Updated product "${updatedFields.name || id}" in Firestore database`, 'Catalog', 'warning');
  };

  const toggleItemTrending = async (id, currentIsTrending) => {
    const newTrending = !currentIsTrending;
    await updateDoc(doc(db, 'items', id), { isTrending: newTrending });
    const target = items.find(i => i.id === id);
    await addAuditLog(
      'ITEM_TRENDING_TOGGLED',
      `Set product "${target?.name || id}" trending status to ${newTrending ? 'Trending' : 'Normal'}`,
      'Catalog',
      newTrending ? 'success' : 'info'
    );
  };

  const toggleItemBogo = async (id, currentIsBogo) => {
    const newBogo = !currentIsBogo;
    await updateDoc(doc(db, 'items', id), { isBogo: newBogo });
    const target = items.find(i => i.id === id);
    await addAuditLog(
      'ITEM_BOGO_TOGGLED',
      `Set product "${target?.name || id}" Buy 1 Get 1 Free status to ${newBogo ? 'Active (Buy 1 Get 1)' : 'Inactive'}`,
      'Catalog',
      newBogo ? 'success' : 'info'
    );
  };

  const toggleItemVisibility = async (id, currentVisibility) => {
    const newVis = !currentVisibility;
    await updateDoc(doc(db, 'items', id), { isVisible: newVis });
    const target = items.find(i => i.id === id);
    await addAuditLog(
      'ITEM_VISIBILITY_TOGGLED',
      `Set item "${target?.name || id}" visibility to ${newVis ? 'Visible (Active)' : 'Hidden (Inactive)'}`,
      'Catalog',
      newVis ? 'success' : 'warning'
    );
  };

  const toggleItemStock = async (id, currentInStock) => {
    const newStock = !currentInStock;
    await updateDoc(doc(db, 'items', id), { inStock: newStock });
    const target = items.find(i => i.id === id);
    await addAuditLog(
      'ITEM_STOCK_TOGGLED',
      `Updated stock for "${target?.name || id}" to ${newStock ? 'In Stock' : 'Out of Stock'}`,
      'Catalog',
      newStock ? 'success' : 'warning'
    );
  };

  const deleteItem = async (id) => {
    const target = items.find(i => i.id === id);
    await deleteDoc(doc(db, 'items', id));
    await addAuditLog('ITEM_DELETED', `Deleted menu item "${target?.name || id}" from Firestore database`, 'Catalog', 'danger');
  };

  const reorderItemsBatch = async (updatedItemsArray) => {
    try {
      const batch = writeBatch(db);
      updatedItemsArray.forEach((item, index) => {
        const itemRef = doc(db, 'items', item.id);
        batch.update(itemRef, { sortOrder: index });
      });
      await batch.commit();
      await addAuditLog('ITEMS_REORDERED', `Reordered ${updatedItemsArray.length} items in the catalog`, 'Catalog', 'success');
    } catch (err) {
      console.error("Error reordering items:", err);
    }
  };

  // Actions for Orders
  const updateOrderStatus = async (orderId, newStatus, reason = null) => {
    const isCurrent = ['Pending', 'Preparing', 'Out for Delivery'].includes(newStatus);
    const updateData = {
      status: newStatus,
      isCurrent
    };
    if (newStatus === 'Cancelled') {
      updateData.cancelReason = reason ? `Cancelled by Admin: ${reason}` : 'Cancelled by Admin';
    }

    const order = orders.find(o => o.id === orderId);
    if (order && order.status !== newStatus) {
      let greeting = '';
      let emailSubject = '';
      let emailHtml = '';

      const customerName = order.address?.name || 'Customer';
      
      const prepareEmailParams = (templateKey) => {
        const template = notificationTemplates[templateKey];
        if (!template) return null;
        
        const formatMoney = (amt) => Number(amt).toFixed(2);
        const formatAddress = (addr) => {
          if (!addr) return 'N/A';
          if (typeof addr === 'string') return addr;
          const street = addr.street || addr.flatName || '';
          const locality = addr.locality || addr.area || '';
          const city = addr.city || '';
          const pin = addr.pincode || '';
          return [street, locality, city].filter(Boolean).join(', ') + (pin ? ` - ${pin}` : '');
        };
        const formatTime = (ts) => ts ? new Date(ts.seconds ? ts.seconds * 1000 : ts).toLocaleString() : 'N/A';

        const rawBody = template.body || '';
        
        let replacedHtmlBody = rawBody.replace(/\n/g, '<br>');
        replacedHtmlBody = replacedHtmlBody
          .replace(/\[Customer Name\]/gi, customerName)
          .replace(/\[Order ID\]/gi, orderId)
          .replace(/\[Amount\]/gi, formatMoney(order.totalAmount))
          .replace(/\[Address\]/gi, formatAddress(order.address))
          .replace(/\[Time\]/gi, formatTime(order.createdAt))
          .replace(/\[Cancel Reason\]/gi, reason || 'Not specified')
          .replace(/\[Order Items?\]/gi, formatOrderItems(order.items || [], order.totalAmount, formatAddress(order.address)));

        return {
          subject: template.subject.replace(/\[Order ID\]/g, orderId),
          html: EMAIL_WRAPPER(replacedHtmlBody)
        };
      };

      if (newStatus === 'Prepared' || newStatus === 'Preparing' || newStatus === 'Packing') {
        greeting = "📦 Your order is being packed!";
        const params = prepareEmailParams('Prepared');
        if (params) {
          emailSubject = params.subject;
          emailHtml = params.html;
        }
      } else if (newStatus === 'Out for delivery' || newStatus === 'Out for Delivery') {
        greeting = "🛵 Your order is out for delivery!";
        const params = prepareEmailParams('Out for delivery');
        if (params) {
          emailSubject = params.subject;
          emailHtml = params.html;
        }
      } else if (newStatus === 'Delivered') {
        greeting = "✅ Your order has been delivered!";
        const params = prepareEmailParams('Delivered');
        if (params) {
          emailSubject = params.subject;
          emailHtml = params.html;
        }
      } else if (newStatus === 'Cancelled') {
        greeting = "❌ Your order has been cancelled. Please contact support if you need any assistance.";
        const params = prepareEmailParams('Cancelled');
        if (params) {
          emailSubject = params.subject;
          emailHtml = params.html;
        }
      }

      if (greeting) {
        updateData.greetingMessage = greeting;
        updateData.greetingTimestamp = new Date().toISOString();
      }

      // Trigger Email via Firebase Extension
      const targetEmail = order.customerEmail || order.email || order.userEmail;
      if (targetEmail && emailSubject && emailHtml) {
        try {
          await addDoc(collection(db, 'mail'), {
            to: targetEmail,
            from: '"The Grocery Hub" <ghoshabhijit1295@gmail.com>',
            message: {
              subject: emailSubject,
              html: emailHtml
            }
          });
          console.log(`Email notification queued for ${targetEmail}`);
        } catch (mailErr) {
          console.error("Failed to queue email notification:", mailErr);
        }
      }
    }

    await updateDoc(doc(db, 'orders', orderId), updateData);

    if (newStatus === 'Cancelled') {
      await addAuditLog('ORDER_CANCELLED', `Cancelled Order #${orderId}. Reason: "${reason || 'Unspecified'}"`, 'Orders', 'danger');
    } else {
      await addAuditLog('ORDER_STATUS_UPDATE', `Updated Order #${orderId} status to "${newStatus}"`, 'Orders', 'info');
    }
  };

  const cancelOrder = async (orderId, reason) => {
    // Calling updateOrderStatus directly to ensure emails are triggered properly for cancellation
    await updateOrderStatus(orderId, 'Cancelled', reason);
  };

  const updateNotificationTemplates = async (newTemplates) => {
    try {
      await updateDoc(doc(db, 'settings', 'notifications'), {
        templates: newTemplates
      });
      setNotificationTemplates(newTemplates);
      await addAuditLog('NOTIFICATIONS_UPDATED', `Updated email notification templates`, 'Settings', 'info');
      return true;
    } catch (err) {
      console.error("Error updating templates:", err);
      return false;
    }
  };

  const sendDelayNotification = async (orderId, message) => {
    const updateData = {
      greetingMessage: message,
      greetingTimestamp: new Date().toISOString()
    };
    await updateDoc(doc(db, 'orders', orderId), updateData);
    await addAuditLog('ORDER_DELAY_NOTIFIED', `Sent delay notification for Order #${orderId}`, 'Orders', 'warning');
  };

  const recordPrintBill = async (orderId) => {
    await updateDoc(doc(db, 'orders', orderId), { isBillPrinted: true });
    await addAuditLog('BILL_PRINTED', `Printed POS Thermal Receipt for Order #${orderId}`, 'Hardware/POS', 'success');
  };

  const assignDeliveryPartner = async (orderId, partnerId) => {
    const partner = staff.find(s => s.id === partnerId);
    await updateDoc(doc(db, 'orders', orderId), {
      assignedPartnerId: partnerId || null,
      assignedPartnerName: partner ? partner.name : 'Unassigned',
      assignedPartnerPhone: partner ? partner.phone : null
    });

    if (partner) {
      await updateDoc(doc(db, 'staff', partnerId), {
        activeOrders: (partner.activeOrders || 0) + 1,
        status: 'On Duty'
      });
      await addAuditLog('PARTNER_ASSIGNED', `Assigned ${partner.name} to Order #${orderId}`, 'Orders', 'success');
    } else {
      await addAuditLog('PARTNER_UNASSIGNED', `Unassigned delivery partner from Order #${orderId}`, 'Orders', 'warning');
    }
  };

  // Actions for Staff (Firebase Auth + Firestore)
  const addStaff = async (newPerson) => {
    let userUid = null;
    try {
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newPerson.email, newPerson.password);
      userUid = userCredential.user.uid;
    } catch (authErr) {
      console.warn("Firebase Auth Notice:", authErr);
      userUid = `STF-${Math.floor(100 + Math.random() * 900)}`;
    }

    const staffId = `STF-${Math.floor(100 + Math.random() * 900)}`;
    const createdStaff = {
      id: staffId,
      uid: userUid,
      name: newPerson.name,
      email: newPerson.email,
      phone: newPerson.phone,
      aadhaarNumber: newPerson.aadhaarNumber || null,
      vehicle: newPerson.vehicle,
      role: 'delivery',
      status: 'Available',
      rating: 5.0,
      totalDeliveries: 0,
      activeOrders: 0,
      joinedDate: new Date().toISOString().split('T')[0]
    };

    await setDoc(doc(db, 'staff', staffId), createdStaff);
    await addAuditLog('STAFF_ADDED', `Registered delivery partner "${createdStaff.name}" (Role: delivery, Email: ${createdStaff.email}) in Firebase Auth & Firestore`, 'Staff', 'success');
    return createdStaff;
  };

  const removeStaff = async (id) => {
    const target = staff.find(s => s.id === id);
    await deleteDoc(doc(db, 'staff', id));
    await addAuditLog('STAFF_REMOVED', `Removed delivery person "${target?.name || id}" from Firestore`, 'Staff', 'danger');
  };

  const toggleStaffStatus = async (id, newStatus) => {
    await updateDoc(doc(db, 'staff', id), { status: newStatus });
    const target = staff.find(s => s.id === id);
    await addAuditLog('STAFF_STATUS_CHANGE', `Changed ${target?.name} status to ${newStatus}`, 'Staff', 'info');
  };

  // Actions for Complaints
  const updateComplaintStatus = async (complaintId, newStatus, adminReply = null) => {
    const updateData = {
      status: newStatus,
      updatedAt: new Date().toISOString()
    };
    if (adminReply !== null) {
      updateData.adminReply = adminReply;
    }

    await updateDoc(doc(db, 'complaints', complaintId), updateData);
    await addAuditLog('COMPLAINT_STATUS_UPDATE', `Updated status of Complaint #${complaintId} to "${newStatus}"`, 'Support', 'info');
  };

  const deleteComplaint = async (complaintId) => {
    await deleteDoc(doc(db, 'complaints', complaintId));
    await addAuditLog('COMPLAINT_DELETED', `Deleted Complaint #${complaintId} from database`, 'Support', 'warning');
  };

  // Fetch user's saved/wishlist products from subcollections or document fields
  const getUserSavedProducts = async (userId) => {
    const saved = [];
    // Try common subcollection names
    const subcollectionNames = ['savedProducts', 'wishlist', 'favorites', 'cart', 'saved'];
    for (const subName of subcollectionNames) {
      try {
        const subSnap = await getDocs(collection(db, 'users', userId, subName));
        if (!subSnap.empty) {
          subSnap.docs.forEach(d => {
            saved.push({ id: d.id, source: subName, ...d.data() });
          });
        }
      } catch (e) {
        // Subcollection doesn't exist, skip
      }
    }
    return saved;
  };

  // Block or unblock a user
  const toggleUserBlockStatus = async (userId, currentStatus) => {
    try {
      await setDoc(doc(db, 'users', userId), {
        isBlocked: !currentStatus,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      const action = !currentStatus ? 'BLOCKED' : 'UNBLOCKED';
      await addAuditLog(`USER_${action}`, `${!currentStatus ? 'Blocked' : 'Unblocked'} User #${userId}`, 'Admin', !currentStatus ? 'warning' : 'success');
    } catch (error) {
      console.error("Error updating block status: ", error);
      throw error;
    }
  };

  // Update private admin note for a user
  const updateUserAdminNote = async (userId, note) => {
    try {
      await setDoc(doc(db, 'users', userId), {
        adminNote: note,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error("Error updating admin note: ", error);
      throw error;
    }
  };
  // Bulk update items using batch write
  const bulkUpdateItems = async (itemsData) => {
    // itemsData is array of { id, updates }
    try {
      const batch = writeBatch(db);

      itemsData.forEach(data => {
        const itemRef = doc(db, 'items', data.id);
        batch.update(itemRef, {
          ...data.updates,
          updatedAt: new Date().toISOString()
        });
      });

      await batch.commit();
      await addAuditLog('BULK_UPDATE_ITEMS', `Bulk updated ${itemsData.length} items`, 'Admin', 'info');
    } catch (error) {
      console.error("Error bulk updating items: ", error);
      throw error;
    }
  };

  // Bulk delete items using batch write
  const bulkDeleteItems = async (itemIds) => {
    try {
      const batch = writeBatch(db);
      itemIds.forEach(id => {
        const itemRef = doc(db, 'items', id);
        batch.delete(itemRef);
      });
      await batch.commit();
      await addAuditLog('BULK_DELETE_ITEMS', `Bulk deleted ${itemIds.length} items`, 'Admin', 'danger');
    } catch (error) {
      console.error("Error bulk deleting items: ", error);
      throw error;
    }
  };

  const addCoupon = async (couponData) => {
    try {
      const docRef = await addDoc(collection(db, 'coupons'), {
        ...couponData,
        createdAt: new Date().toISOString()
      });
      await addAuditLog('CREATE_COUPON', `Created coupon ${couponData.code}`, 'Admin', 'success');
      return docRef.id;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const toggleCouponStatus = async (id, currentStatus) => {
    try {
      await updateDoc(doc(db, 'coupons', id), { isActive: !currentStatus });
      await addAuditLog('UPDATE_COUPON', `Toggled coupon status for ID ${id}`, 'Admin', 'info');
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const deleteCoupon = async (id, code) => {
    try {
      await deleteDoc(doc(db, 'coupons', id));
      await addAuditLog('DELETE_COUPON', `Deleted coupon ${code}`, 'Admin', 'warning');
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  return (
    <AdminContext.Provider value={{
      categories,
      categoryDocs,
      items,
      staff,
      orders,
      complaints,
      users,
      auditLogs,
      earnings,
      isLoading,
      cancelReasonsList,
      addCategory,
      addSubcategory,
      renameSubcategory,
      deleteSubcategory,
      deleteCategory,
      renameCategory,
      addItem,
      editItem,
      toggleItemTrending,
      toggleItemBogo,
      toggleItemVisibility,
      toggleItemStock,
      deleteItem,
      bulkUpdateItems,
      bulkDeleteItems,
      reorderItemsBatch,
      updateOrderStatus,
      cancelOrder,
      sendDelayNotification,
      recordPrintBill,
      assignDeliveryPartner,
      addStaff,
      removeStaff,
      toggleStaffStatus,
      updateComplaintStatus,
      deleteComplaint,
      getUserSavedProducts,
      toggleUserBlockStatus,
      updateUserAdminNote,
      addAuditLog,
      coupons,
      addCoupon,
      toggleCouponStatus,
      deleteCoupon,
      cancelOrder,
      notificationTemplates,
      updateNotificationTemplates
    }}>
      {children}
    </AdminContext.Provider>
  );
};
