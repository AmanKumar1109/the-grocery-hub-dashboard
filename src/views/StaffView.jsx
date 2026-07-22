import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Eye,
  Trash2,
  Phone,
  Truck,
  Star,
  CheckCircle2,
  Clock,
  XCircle,
  X,
  ShieldAlert,
  Mail,
  Lock,
  FileText,
  User,
  Shield
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import Header from '../components/Header';
import { Link } from 'react-router-dom';
import gsap from 'gsap';

export default function StaffView() {
  const { staff, removeStaff, toggleStaffStatus } = useAdmin();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals state
  const [viewingStaff, setViewingStaff] = useState(null);
  const [removingStaff, setRemovingStaff] = useState(null);

  const containerRef = useRef(null);

  const filteredStaff = staff.filter(person => {
    const matchesStatus = statusFilter === 'All' || person.status === statusFilter;
    const matchesSearch = person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (person.email && person.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          person.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          person.phone.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.children,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' }
      );
    }
  }, [statusFilter, searchQuery]);

  const handleConfirmRemove = async () => {
    if (removingStaff) {
      await removeStaff(removingStaff.id);
      setRemovingStaff(null);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-50/50 flex flex-col">
      <Header
        title="Delivery Personnel & Staff"
        subtitle="Manage active delivery partners, view Firestore account details (Role: delivery), status toggles, and register new staff"
      />

      <main className="p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
        {/* Controls Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search staff name, email, vehicle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
              {['All', 'Available', 'On Duty', 'Offline'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    statusFilter === st
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <Link
            to="/staff/add"
            className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" /> Add Delivery Person
          </Link>
        </div>

        {/* Staff Grid */}
        {filteredStaff.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">No delivery staff found</h3>
            <p className="text-xs text-slate-400">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStaff.map((person) => (
              <div
                key={person.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-6 space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3.5">
                    {/* Clean Default User Avatar Icon */}
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-extrabold text-lg shrink-0 shadow-xs">
                      {person.name ? person.name.charAt(0).toUpperCase() : 'U'}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-emerald-600 truncate">{person.id}</span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-extrabold uppercase tracking-wider">
                          {person.role || 'delivery'}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-slate-800 text-base truncate">{person.name}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-slate-400" /> {person.vehicle}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <p className="flex items-center gap-2 text-slate-600 font-medium truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{person.email || 'No email provided'}</span>
                    </p>
                    <p className="flex items-center gap-2 text-slate-600 font-medium">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {person.phone}
                    </p>
                    {person.aadhaarNumber && (
                      <p className="flex items-center gap-2 text-slate-500 text-[11px]">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        Aadhaar: <span className="font-semibold text-slate-700">{person.aadhaarNumber}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Selector & Actions */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Duty Status</span>
                    <select
                      value={person.status}
                      onChange={(e) => toggleStaffStatus(person.id, e.target.value)}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${
                        person.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        person.status === 'On Duty' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      <option value="Available">Available</option>
                      <option value="On Duty">On Duty</option>
                      <option value="Offline">Offline</option>
                    </select>
                  </div>

                  {/* Actions: View Details & Remove */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setViewingStaff(person)}
                      className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Profile
                    </button>
                    <button
                      onClick={() => setRemovingStaff(person)}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors"
                      title="Remove Delivery Person"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* VIEW STAFF PROFILE MODAL */}
      {viewingStaff && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800">Delivery Partner Profile</h3>
              <button onClick={() => setViewingStaff(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-extrabold text-xl shadow-md">
                {viewingStaff.name ? viewingStaff.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-600">{viewingStaff.id}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                    Role: {viewingStaff.role || 'delivery'}
                  </span>
                </div>
                <h2 className="text-lg font-extrabold text-slate-800">{viewingStaff.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  {viewingStaff.status}
                </span>
              </div>
            </div>

            <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div>
                <p className="text-slate-400 font-bold uppercase text-[10px]">Email Authentication</p>
                <p className="font-bold text-slate-800 mt-0.5">{viewingStaff.email || 'N/A'}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Phone Contact</p>
                  <p className="font-bold text-slate-800 mt-0.5">{viewingStaff.phone}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Vehicle Mode</p>
                  <p className="font-bold text-slate-800 mt-0.5">{viewingStaff.vehicle}</p>
                </div>
              </div>

              {viewingStaff.aadhaarNumber && (
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Aadhaar Identification</p>
                  <p className="font-bold text-slate-800 mt-0.5">{viewingStaff.aadhaarNumber}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Deliveries Completed</p>
                  <p className="font-bold text-slate-800 mt-0.5">{viewingStaff.totalDeliveries || 0}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Joined Date</p>
                  <p className="font-bold text-slate-800 mt-0.5">{viewingStaff.joinedDate || 'Recent'}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setViewingStaff(null)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REMOVE STAFF CONFIRMATION MODAL */}
      {removingStaff && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-800">Remove Delivery Personnel?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <strong>"{removingStaff.name}"</strong> ({removingStaff.id}) from Firestore?
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setRemovingStaff(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRemove}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Yes, Remove Partner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
