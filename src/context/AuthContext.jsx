import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Super Admin credentials (hardcoded)
const SUPER_ADMIN_EMAIL = 'admin@admin.com';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);       // 'superadmin' | 'delivery' | null
  const [riderStaffDoc, setRiderStaffDoc] = useState(null); // staff doc for logged-in rider
  const [authLoading, setAuthLoading] = useState(true);

  // Fetch role from Firestore based on logged-in user's email
  const fetchUserRole = async (user) => {
    if (!user) {
      setUserRole(null);
      setRiderStaffDoc(null);
      return;
    }

    // Hardcoded super admin check
    if (user.email.toLowerCase() === SUPER_ADMIN_EMAIL) {
      setUserRole('superadmin');
      setRiderStaffDoc(null);
      return;
    }

    // Look up in 'staff' collection by email
    try {
      const staffRef = collection(db, 'staff');
      const q = query(staffRef, where('email', '==', user.email));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const staffData = { id: snap.docs[0].id, ...snap.docs[0].data() };
        const role = staffData.role || 'delivery';
        setUserRole(role);
        setRiderStaffDoc(staffData);
      } else {
        // No matching staff — treat as unauthorized
        setUserRole('unknown');
        setRiderStaffDoc(null);
      }
    } catch (err) {
      console.error('Role lookup error:', err);
      setUserRole('unknown');
      setRiderStaffDoc(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      await fetchUserRole(user);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    await fetchUserRole(credential.user);
    return credential;
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(auth, provider);
    await fetchUserRole(credential.user);
    return credential;
  };

  const logout = () => {
    setUserRole(null);
    setRiderStaffDoc(null);
    return signOut(auth);
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      userRole,
      riderStaffDoc,
      authLoading,
      login,
      loginWithGoogle,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};
