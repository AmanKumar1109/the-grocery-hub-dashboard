import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Search, Filter, Eye, AlertCircle, CheckCircle2, Clock, XCircle, Gift } from 'lucide-react';
import Header from '../components/Header';

export default function ReferralsView() {
  const [referrals, setReferrals] = useState([]);
  const [usersCache, setUsersCache] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedReferral, setSelectedReferral] = useState(null);

  const formatDateTime = (dateObj) => {
    if (!dateObj) return '-';
    try {
      return new Intl.DateTimeFormat('en-IN', {
        month: 'short', day: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false
      }).format(dateObj);
    } catch {
      return '-';
    }
  };

  // Fetch users for name mapping
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        const map = {};
        snap.forEach(doc => {
          const d = doc.data();
          map[doc.id] = d.fullName || d.name || d.email || 'Unknown User';
        });
        setUsersCache(map);
      } catch (err) {
        console.error("Failed to fetch users cache", err);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'referrals'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReferrals(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredReferrals = referrals.filter(ref => {
    const matchesSearch = 
      ref.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      ref.referrerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.referredUserId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (usersCache[ref.referrerId] && usersCache[ref.referrerId].toLowerCase().includes(searchTerm.toLowerCase())) ||
      (usersCache[ref.referredUserId] && usersCache[ref.referredUserId].toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'ALL' || ref.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch(status) {
      case 'REWARDED': return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 flex items-center gap-1 w-max"><CheckCircle2 className="w-3.5 h-3.5"/> Rewarded</span>;
      case 'REGISTERED': return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-200 flex items-center gap-1 w-max"><Clock className="w-3.5 h-3.5"/> Registered</span>;
      case 'NOT_QUALIFIED': return <span className="px-2.5 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 flex items-center gap-1 w-max"><XCircle className="w-3.5 h-3.5"/> Not Qualified</span>;
      case 'CANCELLED': return <span className="px-2.5 py-1 bg-slate-50 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 flex items-center gap-1 w-max"><AlertCircle className="w-3.5 h-3.5"/> Cancelled</span>;
      default: return <span className="px-2.5 py-1 bg-slate-50 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 w-max">{status}</span>;
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-50/50 flex flex-col">
      <Header
        title="Referral Management"
        subtitle="Track and audit the referral lifecycle"
      />
      <div className="p-6 max-w-7xl mx-auto space-y-6 w-full">
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search ID or User..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 appearance-none"
            >
              <option value="ALL">All Status</option>
              <option value="REGISTERED">Registered</option>
              <option value="REWARDED">Rewarded</option>
              <option value="NOT_QUALIFIED">Not Qualified</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Referrals</span>
            <span className="text-3xl font-black text-slate-800">{referrals.length}</span>
          </div>
          <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 shadow-sm flex flex-col gap-1">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Successful</span>
            <span className="text-3xl font-black text-emerald-800">{referrals.filter(r => r.status === 'REWARDED').length}</span>
          </div>
          <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 shadow-sm flex flex-col gap-1">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Pending</span>
            <span className="text-3xl font-black text-amber-800">{referrals.filter(r => r.status === 'REGISTERED').length}</span>
          </div>
          <div className="bg-rose-50 p-5 rounded-2xl border border-rose-200 shadow-sm flex flex-col gap-1">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Not Qualified</span>
            <span className="text-3xl font-black text-rose-800">{referrals.filter(r => r.status === 'NOT_QUALIFIED').length}</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="px-5 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Referral ID</th>
                  <th className="px-5 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Referrer (User A)</th>
                  <th className="px-5 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Referred (User B)</th>
                  <th className="px-5 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Order</th>
                  <th className="px-5 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="7" className="text-center py-10 font-bold text-slate-400">Loading...</td></tr>
                ) : filteredReferrals.length === 0 ? (
                  <tr><td colSpan="7" className="text-center py-10 font-bold text-slate-400">No referrals found.</td></tr>
                ) : (
                  filteredReferrals.map((ref) => (
                    <tr key={ref.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{ref.id}</span>
                      </td>
                      <td className="px-5 py-4 truncate max-w-[150px]">
                        <div className="text-sm font-semibold text-slate-800">{usersCache[ref.referrerId] || 'Unknown'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{ref.referrerId}</div>
                      </td>
                      <td className="px-5 py-4 truncate max-w-[150px]">
                        <div className="text-sm font-semibold text-slate-800">{usersCache[ref.referredUserId] || 'Unknown'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{ref.referredUserId}</div>
                      </td>
                      <td className="px-5 py-4 text-xs font-medium text-slate-500">
                        {ref.createdAt ? formatDateTime(ref.createdAt.toDate()) : '-'}
                      </td>
                      <td className="px-5 py-4">
                        {ref.orderId ? (
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-700">#{ref.orderId.substring(0,8)}</span>
                            <span className="text-xs font-semibold text-emerald-600">₹{ref.orderAmount}</span>
                          </div>
                        ) : <span className="text-slate-400 text-xs">-</span>}
                      </td>
                      <td className="px-5 py-4">{getStatusBadge(ref.status)}</td>
                      <td className="px-5 py-4 text-right">
                        <button 
                          onClick={() => setSelectedReferral(ref)}
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer inline-flex"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Referral Details Modal */}
      {selectedReferral && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-amber-500" />
                  Referral Details
                </h3>
                <p className="text-xs font-bold text-slate-500 mt-1 font-mono">{selectedReferral.id}</p>
              </div>
              <button 
                onClick={() => setSelectedReferral(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Timeline Style Overview */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <p className="text-xs font-black uppercase text-slate-400">Referrer</p>
                    <p className="text-sm font-bold text-slate-800">{usersCache[selectedReferral.referrerId] || 'Unknown'}</p>
                    <p className="text-[10px] font-mono text-slate-400">{selectedReferral.referrerId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black uppercase text-slate-400">Referred User</p>
                    <p className="text-sm font-bold text-slate-800">{usersCache[selectedReferral.referredUserId] || 'Unknown'}</p>
                    <p className="text-[10px] font-mono text-slate-400">{selectedReferral.referredUserId}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black uppercase text-slate-400 mb-3">Lifecycle Timeline</h4>
                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                    
                    {/* Registered */}
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full border-4 border-white bg-emerald-500 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2"></div>
                      <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-3 rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between space-x-2 mb-1">
                          <div className="font-bold text-slate-900 text-xs">User Registered</div>
                          <time className="text-[10px] font-medium text-slate-500">
                            {selectedReferral.registeredAt ? formatDateTime(selectedReferral.registeredAt.toDate()) : '-'}
                          </time>
                        </div>
                      </div>
                    </div>

                    {/* Order Qualified */}
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                      <div className={`flex items-center justify-center w-5 h-5 rounded-full border-4 border-white ${selectedReferral.orderQualifiedAt ? 'bg-emerald-500' : 'bg-slate-300'} shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2`}></div>
                      <div className={`w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-3 rounded-xl border border-slate-200 bg-white shadow-sm ${!selectedReferral.orderQualifiedAt && 'opacity-50'}`}>
                        <div className="flex items-center justify-between space-x-2 mb-1">
                          <div className="font-bold text-slate-900 text-xs">Order Qualified</div>
                          {selectedReferral.orderQualifiedAt && (
                            <time className="text-[10px] font-medium text-slate-500">
                              {formatDateTime(selectedReferral.orderQualifiedAt.toDate())}
                            </time>
                          )}
                        </div>
                        {selectedReferral.orderId && (
                          <p className="text-[10px] font-semibold text-slate-600">Order #{selectedReferral.orderId} (₹{selectedReferral.orderAmount})</p>
                        )}
                      </div>
                    </div>

                    {/* Rewarded */}
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                      <div className={`flex items-center justify-center w-5 h-5 rounded-full border-4 border-white ${selectedReferral.rewardedAt ? 'bg-emerald-500' : 'bg-slate-300'} shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2`}></div>
                      <div className={`w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-3 rounded-xl border border-slate-200 bg-white shadow-sm ${!selectedReferral.rewardedAt && 'opacity-50'}`}>
                        <div className="flex items-center justify-between space-x-2 mb-1">
                          <div className="font-bold text-slate-900 text-xs">Reward Generated</div>
                          {selectedReferral.rewardedAt && (
                            <time className="text-[10px] font-medium text-slate-500">
                              {formatDateTime(selectedReferral.rewardedAt.toDate())}
                            </time>
                          )}
                        </div>
                        {selectedReferral.scratchCardId && (
                          <p className="text-[10px] font-semibold text-slate-600">Scratch Card: {selectedReferral.scratchCardId}</p>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedReferral(null)}
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
