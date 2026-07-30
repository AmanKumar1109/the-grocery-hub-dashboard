import React, { useState } from 'react';
import { Printer, X, CheckCircle, Send, Cpu, Receipt } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

export default function ThermalReceiptModal({ order, onClose }) {
  const { recordPrintBill } = useAdmin();
  const [printStatus, setPrintStatus] = useState('ready');

  if (!order) return null;

  const handlePrint = () => {
    setPrintStatus('sending');
    setTimeout(() => {
      recordPrintBill(order.id);
      setPrintStatus('printed');
      window.print();
    }, 600);
  };

  const numberToWords = (num) => {
    if (num === 0) return 'Zero Only';
    const a = ['','One ','Two ','Three ','Four ','Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
    const b = ['', '','Twenty ','Thirty ','Forty ','Fifty ','Sixty ','Seventy ','Eighty ','Ninety '];
    const n = ('000000000' + Math.floor(num)).slice(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? (a[Number(n[5])] || b[n[5][0]] + a[n[5][1]]) : '';
    return str.trim() + ' Only';
  };

  const subtotal = parseFloat(order.subTotal || order.totalAmount || 0);
  const deliveryFee = parseFloat(order.deliveryFee || 0);
  const total = subtotal + deliveryFee;
  
  let totalQty = 0;
  let totalMrp = 0;
  
  order.items?.forEach(item => {
    const qty = parseFloat(item.quantity || item.qty || 1);
    totalQty += qty;
    const price = parseFloat(item.price || 0);
    const mrp = parseFloat(item.mrp || price);
    totalMrp += (mrp * qty);
  });

  const totalSavings = totalMrp - subtotal;
  const customerName = order.customerName || 'Cash';
  const customerPhone = order.customerPhone || '';

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in print:bg-white print:p-0 print:absolute print:inset-0 print:block print:items-start print:justify-start">
      <style>
        {`
          @media print {
            @page {
              margin: 0;
              size: 80mm auto;
            }
            html, body {
              background: white;
              margin: 0 !important;
              padding: 0 !important;
              color: black;
            }
            body * {
              visibility: hidden;
            }
            .thermal-print-container, .thermal-print-container * {
              visibility: visible;
            }
            .thermal-print-container {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 80mm !important;
              max-width: 80mm !important;
              margin: 0 !important;
              padding: 4mm !important;
              box-shadow: none !important;
              border: none !important;
              font-family: 'Courier New', Courier, monospace !important;
            }
          }
        `}
      </style>

      <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden print:shadow-none print:border-none print:w-full print:max-w-none print:m-0 print:p-0">
        
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
        <div className="p-6 bg-slate-100 flex justify-center print:bg-white print:p-0 print:block">
          <div className="thermal-print-container w-full max-w-[380px] mx-auto bg-white shadow-xl p-6 font-mono text-[12px] leading-tight text-black print:shadow-none print:w-full print:max-w-full print:p-2">
            
            {/* Header */}
            <div className="text-center mb-2">
              <h1 className="text-xl font-bold uppercase mb-1">The Grocery Hub</h1>
              <p>DADU COMPLEX, NEAR SHITLA MANDIR</p>
              <p>BAHARAGORA, JHARKHAND-832101</p>
              <p>MOB: 6207462800, 6203341481</p>
              <p>GSTIN: 20AAYFT4502E1ZC</p>
            </div>
            
            <div className="border-t border-b border-dashed border-black py-1 text-center font-bold mb-2">
              TAX INVOICE
            </div>
            
            {/* Info */}
            <div className="mb-2 space-y-1">
              <div className="flex justify-between">
                <span>Inv No: {order.id?.slice(0, 8)}</span>
                <span>Date: {order.orderTime?.split(',')[0] || new Date().toLocaleDateString('en-GB')}</span>
              </div>
              <div className="flex justify-between">
                <span>Name: {customerName?.slice(0, 15)}</span>
                <span>Mob: {customerPhone}</span>
              </div>
            </div>
            
            <div className="border-t border-black border-dashed mb-2"></div>
            
            {/* Items Table */}
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black border-dashed">
                  <th className="py-1 font-normal w-1/2">Item</th>
                  <th className="py-1 font-normal text-center w-1/6">Qty</th>
                  <th className="py-1 font-normal text-right w-1/6">Rate</th>
                  <th className="py-1 font-normal text-right w-1/6">Amt</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item, idx) => {
                  const qty = parseFloat(item.quantity || item.qty || 1);
                  const price = parseFloat(item.price || 0);
                  const amt = price * qty;
                  return (
                    <tr key={idx} className="align-top">
                      <td className="py-1 pr-1">
                        {idx + 1}. {item.name} {item.weight ? `(${item.weight})` : ''}
                      </td>
                      <td className="py-1 text-center">{qty}</td>
                      <td className="py-1 text-right">{price.toFixed(2)}</td>
                      <td className="py-1 text-right">{amt.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            <div className="border-t border-black border-dashed mt-2 py-2">
              <div className="flex justify-between font-bold">
                <span>Total Items: {totalQty.toFixed(2)}</span>
                <div className="flex items-center gap-2">
                  <span>Total:</span>
                  <span className="text-right">{subtotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            {/* Tax & Summary */}
            <div className="border-t border-black border-dashed py-2 space-y-1">
              <div className="flex justify-between">
                <span>Total MRP</span>
                <span>: {totalMrp.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Savings</span>
                <span>: {totalSavings.toFixed(2)}</span>
              </div>
              {deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>: {deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-[14px] mt-1">
                <span>NET PAYABLE</span>
                <span>: Rs. {total.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t border-black border-dashed mt-2 pt-2 text-center text-[10px]">
              <p>Rupees {numberToWords(total)}</p>
            </div>

            <div className="border-t border-black border-dashed mt-2 pt-2 text-center">
              <p className="font-bold">Thank You, Visit Again!</p>
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
