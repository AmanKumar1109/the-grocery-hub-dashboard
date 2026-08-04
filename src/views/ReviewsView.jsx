import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, XCircle, Search, Clock, ShieldAlert } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import Header from '../components/Header';

export default function ReviewsView() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'approved', 'rejected'

  useEffect(() => {
    const q = query(collection(db, 'customer_reviews'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const revs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReviews(revs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching reviews:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, 'customer_reviews', id), {
        status: newStatus
      });
    } catch (err) {
      console.error("Error updating review status:", err);
      alert("Failed to update status.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this review?")) {
      try {
        await deleteDoc(doc(db, 'customer_reviews', id));
      } catch (err) {
        console.error("Error deleting review:", err);
      }
    }
  };

  const filteredReviews = reviews.filter(rev => {
    const matchesTab = rev.status === activeTab;
    const matchesSearch = (rev.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (rev.comment || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="flex-1 bg-slate-50 min-h-screen">
      <Header title="Customer Reviews" />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Top Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-between bg-white p-4 rounded-3xl border border-slate-200/60 shadow-sm">
          {/* Tabs */}
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-full sm:w-auto">
            {['pending', 'approved', 'rejected'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-black capitalize transition-all ${
                  activeTab === tab 
                    ? 'bg-white text-emerald-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab} 
                <span className="ml-2 px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px]">
                  {reviews.filter(r => r.status === tab).length}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-500 font-bold text-sm">Loading reviews...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/60 shadow-sm">
            <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-black text-slate-800">No {activeTab} reviews found</h3>
            <p className="text-slate-500 text-sm mt-1">Try searching for something else or check another tab.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredReviews.map(rev => (
              <div key={rev.id} className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-black text-lg">
                        {(rev.userName || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900">{rev.userName || 'Anonymous'}</h4>
                        <p className="text-xs font-bold text-slate-500">{rev.userEmail || 'No Email'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 mb-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
                        ))}
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3" />
                        {rev.createdAt?.toDate().toLocaleDateString() || 'Just now'}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm font-semibold text-slate-700 bg-slate-50 p-4 rounded-2xl italic leading-relaxed mb-6">
                    "{rev.comment}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  {activeTab !== 'approved' && (
                    <button
                      onClick={() => handleStatusChange(rev.id, 'approved')}
                      className="flex-1 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" /> Approve
                    </button>
                  )}
                  {activeTab !== 'rejected' && (
                    <button
                      onClick={() => handleStatusChange(rev.id, 'rejected')}
                      className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-black text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  )}
                  {activeTab === 'rejected' && (
                    <button
                      onClick={() => handleDelete(rev.id)}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Delete Permanently
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
