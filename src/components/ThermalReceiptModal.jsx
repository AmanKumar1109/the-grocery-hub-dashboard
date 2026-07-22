import React, { useState } from 'react';
import { Printer, X, CheckCircle, Send, Cpu, Receipt } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

export default function ThermalReceiptModal({ order, onClose }) {
  const { recordPrintBill } = useAdmin();
  const [printStatus, setPrintStatus] = useState('ready'); // 'ready', 'sending', 'printed'

  if (!order) return null;

  const subtotal = parseFloat(order.totalAmount) || 0;
  const tax = subtotal * 0.05; // 5% GST
  const grandTotal = subtotal + tax;

  const handlePrint = () => {
    setPrintStatus('sending');

    setTimeout(() => {
      recordPrintBill(order.id);
      setPrintStatus('printed');

      // Trigger browser print window with thermal receipt layout
      window.print();
    }, 600);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in print:bg-white print:p-0 print:static">
      <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden print:shadow-none print:border-none print:w-full print:max-w-none">
        
        {/* Modal Top Controls (Hidden when printing) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <div>
              <h3 className="font-bold text-xs">POS Thermal Receipt Printer</h3>
              <p className="text-[10px] text-slate-400">EPSON TM-T88VI (80mm Thermal)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Print Feedback Banner (Hidden when printing) */}
        {printStatus === 'printed' && (
          <div className="bg-emerald-50 border-b border-emerald-200 p-3 text-emerald-800 text-xs font-bold flex items-center gap-2 justify-center print:hidden">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Print request sent to POS Thermal Printer & Browser!</span>
          </div>
        )}

        {/* 80mm Thermal Receipt Layout Preview */}
        <div className="p-6 bg-slate-100 flex justify-center print:bg-white print:p-0">
          <div className="bg-white w-[300px] p-5 shadow-md border border-slate-200 font-mono text-[11px] text-slate-900 space-y-3 leading-tight rounded-sm print:shadow-none print:border-none print:w-full">
            
            {/* Store Header */}
            <div className="text-center space-y-1">
              <h2 className="font-extrabold text-sm uppercase tracking-widest">GROCERY HUB FOODS</h2>
              <p className="text-[10px]">104 Central Boulevard, City Center</p>
              <p className="text-[10px]">GSTIN: 27AAAAA0000A1Z5 | Tel: 1800-FOODS</p>
              <div className="border-b border-dashed border-slate-400 my-2"></div>
            </div>

            {/* Receipt Meta */}
            <div className="space-y-0.5">
              <div className="flex justify-between">
                <span>RECEIPT NO:</span>
                <span className="font-bold">{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span>DATE/TIME:</span>
                <span>{order.orderTime}</span>
              </div>
              <div className="flex justify-between">
                <span>CUSTOMER:</span>
                <span className="font-bold">{order.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>PHONE:</span>
                <span>{order.customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span>DRIVER:</span>
                <span>{order.assignedPartnerName}</span>
              </div>
            </div>

            <div className="border-b border-dashed border-slate-400 my-2"></div>

            {/* Items Table */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-[10px] uppercase">
                <span>ITEM</span>
                <span>QTY x PRICE</span>
                <span>TOTAL</span>
              </div>
              <div className="border-b border-slate-300"></div>

              {order.items && order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-[10px]">
                  <span className="truncate max-w-[140px]">{item.name}</span>
                  <span>{item.quantity} x ₹{item.price.toFixed(2)}</span>
                  <span className="font-bold">₹{(item.quantity * item.price).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-b border-dashed border-slate-400 my-2"></div>

            {/* Totals in Indian Rupees */}
            <div className="space-y-1 text-right">
              <div className="flex justify-between">
                <span>SUBTOTAL:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST TAX (5%):</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-xs pt-1 border-t border-slate-400">
                <span>GRAND TOTAL:</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-b border-dashed border-slate-400 my-2"></div>

            {/* Delivery Address */}
            <div>
              <p className="font-bold uppercase text-[9px]">DELIVERY ADDRESS:</p>
              <p className="text-[10px] break-words">{order.deliveryAddress}</p>
            </div>

            {/* Barcode Simulation */}
            <div className="text-center pt-2 space-y-1">
              <div className="font-mono text-[9px] tracking-widest bg-slate-900 text-white p-1 rounded-xs inline-block">
                |||| | ||||| |||| || |||| ||||
              </div>
              <p className="text-[9px] text-slate-500">THANK YOU FOR YOUR ORDER!</p>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls (Hidden when printing) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
          <span className="text-xs text-slate-500 font-medium">
            POS Status: <strong className="text-emerald-600">Online</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              disabled={printStatus === 'sending'}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              {printStatus === 'sending' ? 'Sending to Printer...' : 'Print Thermal Receipt'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
