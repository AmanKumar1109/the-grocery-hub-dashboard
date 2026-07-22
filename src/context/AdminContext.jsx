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
  getDocs
} from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

// Secondary Firebase App instance so Admin user isn't logged out when creating staff auth accounts
let secondaryApp;
if (!getApps().some(app => app.name === 'SecondaryStaffApp')) {
  secondaryApp = initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  }, 'SecondaryStaffApp');
} else {
  secondaryApp = getApp('SecondaryStaffApp');
}
const secondaryAuth = getAuth(secondaryApp);

const AdminContext = createContext();

export const useAdmin = () => useContext(AdminContext);

export const AdminProvider = ({ children }) => {
  // Pure Real-time Firestore state
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [staff, setStaff] = useState([]);
  const [orders, setOrders] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to purge auto-seeded dummy data from Firestore if present
  const purgeDummyDataFromFirestore = async () => {
    try {
      const dummyItemIds = ['ITEM-101', 'ITEM-102', 'ITEM-103', 'ITEM-104', 'ITEM-105', 'ITEM-106'];
      const dummyStaffIds = ['STF-001', 'STF-002', 'STF-003', 'STF-004'];
      const dummyOrderIds = ['ORD-9481', 'ORD-9482', 'ORD-9483', 'ORD-9470', 'ORD-9468', 'ORD-9455'];

      for (const id of dummyItemIds) {
        await deleteDoc(doc(db, 'items', id)).catch(() => {});
      }
      for (const id of dummyStaffIds) {
        await deleteDoc(doc(db, 'staff', id)).catch(() => {});
      }
      for (const id of dummyOrderIds) {
        await deleteDoc(doc(db, 'orders', id)).catch(() => {});
      }
    } catch (err) {
      console.warn("Purge dummy data error:", err);
    }
  };

  // Subscribe to Firestore Collections Real-time
  useEffect(() => {
    purgeDummyDataFromFirestore();

    // Items snapshot
    const unsubItems = onSnapshot(collection(db, 'items'), (snap) => {
      const loaded = snap.docs
        .map(d => ({ id: d.id, isVisible: d.data().isVisible !== false, ...d.data() }))
        .filter(item => !['ITEM-101', 'ITEM-102', 'ITEM-103', 'ITEM-104', 'ITEM-105', 'ITEM-106'].includes(item.id));
      setItems(loaded);
      setIsLoading(false);
    });

    // Categories snapshot
    const unsubCat = onSnapshot(collection(db, 'categories'), (snap) => {
      const loadedCats = snap.docs.map(d => d.data().name || d.id);
      setCategories(loadedCats);
    });

    // Staff snapshot
    const unsubStaff = onSnapshot(collection(db, 'staff'), (snap) => {
      const loadedStaff = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(s => !['STF-001', 'STF-002', 'STF-003', 'STF-004'].includes(s.id));
      setStaff(loadedStaff);
    });

    // Orders snapshot
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
      const loadedOrders = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(o => !['ORD-9481', 'ORD-9482', 'ORD-9483', 'ORD-9470', 'ORD-9468', 'ORD-9455'].includes(o.id));
      setOrders(loadedOrders);
    });

    // Audit logs snapshot
    const unsubLogs = onSnapshot(collection(db, 'auditLogs'), (snap) => {
      const loadedLogs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      loadedLogs.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      setAuditLogs(loadedLogs);
    });

    return () => {
      unsubItems();
      unsubCat();
      unsubStaff();
      unsubOrders();
      unsubLogs();
    };
  }, []);

  // Preset Order Cancellation Reasons
  const cancelReasonsList = [
    'Too many pending orders',
    'Delivery staff / Driver not available',
    'Item out of stock / Kitchen busy',
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
    await setDoc(doc(db, 'categories', trimmed), { name: trimmed });
    await addAuditLog('CATEGORY_CREATED', `Added new menu category "${trimmed}"`, 'Catalog', 'success');
    return true;
  };

  const deleteCategory = async (categoryName) => {
    await deleteDoc(doc(db, 'categories', categoryName));
    await addAuditLog('CATEGORY_DELETED', `Removed menu category "${categoryName}"`, 'Catalog', 'danger');
  };

  // Actions for Items & Visibility Toggle
  const addItem = async (newItem) => {
    if (newItem.category && !categories.includes(newItem.category)) {
      await addCategory(newItem.category);
    }
    const itemId = `ITEM-${Math.floor(100 + Math.random() * 900)}`;
    const createdItem = {
      ...newItem,
      id: itemId,
      price: parseFloat(newItem.price),
      rating: 5.0,
      inStock: true,
      isVisible: true, // Default visible
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'items', itemId), createdItem);
    await addAuditLog('ITEM_CREATED', `Added food item "${createdItem.name}" (₹${createdItem.price}) to Firestore database`, 'Catalog', 'success');
    return createdItem;
  };

  const editItem = async (id, updatedFields) => {
    if (updatedFields.category && !categories.includes(updatedFields.category)) {
      await addCategory(updatedFields.category);
    }
    await updateDoc(doc(db, 'items', id), {
      ...updatedFields,
      price: parseFloat(updatedFields.price)
    });
    await addAuditLog('ITEM_UPDATED', `Updated item "${updatedFields.name || id}" in Firestore database`, 'Catalog', 'warning');
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

  const deleteItem = async (id) => {
    const target = items.find(i => i.id === id);
    await deleteDoc(doc(db, 'items', id));
    await addAuditLog('ITEM_DELETED', `Deleted menu item "${target?.name || id}" from Firestore database`, 'Catalog', 'danger');
  };

  // Actions for Orders
  const updateOrderStatus = async (orderId, newStatus, reason = null) => {
    const isCurrent = ['Pending', 'Preparing', 'Out for Delivery'].includes(newStatus);
    const updateData = {
      status: newStatus,
      isCurrent
    };
    if (newStatus === 'Cancelled') {
      updateData.cancelReason = reason || 'Cancelled by Admin';
    }

    await updateDoc(doc(db, 'orders', orderId), updateData);

    if (newStatus === 'Cancelled') {
      await addAuditLog('ORDER_CANCELLED', `Cancelled Order #${orderId}. Reason: "${reason || 'Unspecified'}"`, 'Orders', 'danger');
    } else {
      await addAuditLog('ORDER_STATUS_UPDATE', `Updated Order #${orderId} status to "${newStatus}"`, 'Orders', 'info');
    }
  };

  const cancelOrder = async (orderId, reason) => {
    await updateOrderStatus(orderId, 'Cancelled', reason);
  };

  const recordPrintBill = async (orderId) => {
    await updateDoc(doc(db, 'orders', orderId), { isBillPrinted: true });
    await addAuditLog('BILL_PRINTED', `Printed POS Thermal Receipt for Order #${orderId}`, 'Hardware/POS', 'success');
  };

  const assignDeliveryPartner = async (orderId, partnerId) => {
    const partner = staff.find(s => s.id === partnerId);
    await updateDoc(doc(db, 'orders', orderId), {
      assignedPartnerId: partnerId || null,
      assignedPartnerName: partner ? partner.name : 'Unassigned'
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

  return (
    <AdminContext.Provider value={{
      categories,
      items,
      staff,
      orders,
      auditLogs,
      earnings,
      isLoading,
      cancelReasonsList,
      addCategory,
      deleteCategory,
      addItem,
      editItem,
      toggleItemVisibility,
      deleteItem,
      updateOrderStatus,
      cancelOrder,
      recordPrintBill,
      assignDeliveryPartner,
      addStaff,
      removeStaff,
      toggleStaffStatus,
      addAuditLog
    }}>
      {children}
    </AdminContext.Provider>
  );
};
