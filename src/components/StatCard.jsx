import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function StatCard({ title, amount, growth, icon: Icon, color = 'emerald', index = 0 }) {
  const cardRef = useRef(null);

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, delay: index * 0.1, ease: 'power2.out' }
      );
    }
  }, [index]);

  return (
    <div
      ref={cardRef}
      className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{title}</p>
          <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">{amount}</h3>
        </div>
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xs">
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {growth && (
        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            {growth}
          </span>
          <span className="text-xs text-slate-400">vs last period</span>
        </div>
      )}

      {/* Subtle green accent gradient strip */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
    </div>
  );
}
