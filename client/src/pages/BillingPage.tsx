import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Printer, Receipt, DollarSign, CreditCard, Search, ArrowRight, Eye, CheckCircle } from 'lucide-react';

export const BillingPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  
  const [invoices, setInvoices] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'summary'>('all');

  // Form Modal States
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [subtotal, setSubtotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [cgst, setCgst] = useState(0);
  const [sgst, setSgst] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [submittingInvoice, setSubmittingInvoice] = useState(false);

  // Add Payment Modal States
  const [showPaymentModal, setShowPaymentModal] = useState<any>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMode, setPayMode] = useState<'CASH' | 'UPI' | 'CARD' | 'CHEQUE' | 'NET_BANKING'>('UPI');
  const [payRef, setPayRef] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Daily Summary States
  const [summaryDate, setSummaryDate] = useState(new Date().toISOString().split('T')[0]);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const [invRes, patRes] = await Promise.all([
        api.get('/invoices'),
        api.get('/patients?limit=50'),
      ]);
      setInvoices(invRes.data);
      setPatients(patRes.data.patients || []);
    } catch {
      console.error('Failed to load billing parameters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const loadDailySummary = async (date: string) => {
    try {
      setLoadingSummary(true);
      const res = await api.get(`/billing/daily-summary?date=${date}`);
      setSummaryData(res.data);
    } catch {
      console.error('Failed to load daily summaries');
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'summary') {
      loadDailySummary(summaryDate);
    }
  }, [activeSubTab, summaryDate]);

  // Derived computed totals
  const totalBilled = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + inv.payments.reduce((s: number, p: any) => s + p.amount, 0), 0);
  const totalPending = totalBilled - totalCollected;

  // Live dynamic values for draft invoice
  const draftTaxable = Math.max(0, subtotal - discount);
  const draftCGST = draftTaxable * (cgst / 100);
  const draftSGST = draftTaxable * (sgst / 100);
  const draftTotal = draftTaxable + draftCGST + draftSGST;

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || subtotal <= 0) return;
    setSubmittingInvoice(true);

    try {
      await api.post('/invoices', {
        patientId: selectedPatientId,
        subtotal,
        discount,
        cgst,
        sgst,
        dueDate: dueDate || null,
      });
      setShowAddInvoice(false);
      // Reset form
      setSelectedPatientId('');
      setSubtotal(0);
      setDiscount(0);
      setCgst(0);
      setSgst(0);
      setDueDate('');
      fetchBillingData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create invoice');
    } finally {
      setSubmittingInvoice(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) return;
    setSubmittingPayment(true);

    try {
      await api.post('/payments', {
        invoiceId: showPaymentModal.id,
        amount: Number(payAmount),
        paymentMode: payMode,
        referenceNumber: payRef,
      });
      setShowPaymentModal(null);
      setPayAmount(0);
      setPayRef('');
      fetchBillingData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to submit payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const triggerInvoicePrint = (inv: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const paymentsHtml = inv.payments
      .map(
        (p: any) => `
      <tr>
        <td style="padding: 6px; border-bottom: 1px solid #eee;">${new Date(p.paymentDate).toLocaleDateString()}</td>
        <td style="padding: 6px; border-bottom: 1px solid #eee;">${p.paymentMode}</td>
        <td style="padding: 6px; border-bottom: 1px solid #eee;">${p.referenceNumber || '—'}</td>
        <td style="padding: 6px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">₹${p.amount.toLocaleString('en-IN')}</td>
      </tr>`
      )
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${inv.invoiceNumber}</title>
          <style>
            body { font-family: 'Helvetica Neue', sans-serif; color: #333; margin: 40px; }
            .header { border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
            .clinic-title { font-size: 24px; font-weight: bold; color: #1e3a8a; }
            .details-grid { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 40px; }
            .patient-box { background: #f3f4f6; padding: 15px; border-radius: 8px; width: 45%; }
            .invoice-box { border: 1px solid #ddd; padding: 15px; border-radius: 8px; width: 45%; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px; }
            th { text-align: left; background: #3b82f6; color: white; padding: 8px; }
            .summary-table { width: 40%; float: right; margin-bottom: 30px; }
            .summary-table td { padding: 6px 0; }
            .total-row { font-weight: bold; border-top: 1px solid #333; border-bottom: 1px solid #333; }
            .footer-notes { border-top: 1px solid #eee; padding-top: 20px; font-size: 11px; color: #666; margin-top: 50px; text-align: center; width: 100%; clear: both; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="header">
            <div class="clinic-title">${currentUser?.clinicName}</div>
            <div style="font-size: 12px; color: #666; margin-top: 5px;">GSTIN: ${currentUser?.role === 'SUPER_ADMIN' ? '—' : '07AAAAA1111A1Z1'} &bull; Ph: 98765 43210</div>
          </div>
          <h3>TAX INVOICE</h3>
          <div class="details-grid">
            <div class="patient-box">
              <strong>Billed To:</strong><br/>
              ${inv.patient.name}<br/>
              Phone: ${inv.patient.phone}<br/>
              ID: ${inv.patient.patientNumber}
            </div>
            <div class="invoice-box">
              <strong>Invoice Number:</strong> ${inv.invoiceNumber}<br/>
              <strong>Date:</strong> ${new Date(inv.createdAt).toLocaleDateString()}<br/>
              <strong>Due Date:</strong> ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'Due on receipt'}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: 600;">Dental Treatment Procedures & Services</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">₹${inv.subtotal.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>

          <table class="summary-table">
            <tr>
              <td>Subtotal</td>
              <td style="text-align: right;">₹${inv.subtotal.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td>Discount</td>
              <td style="text-align: right;">- ₹${inv.discount.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td>Taxable Amount</td>
              <td style="text-align: right; font-weight: 600;">₹${inv.taxableAmount.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td>CGST (${inv.cgst}%)</td>
              <td style="text-align: right;">₹${(inv.taxableAmount * (inv.cgst / 100)).toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td>SGST (${inv.sgst}%)</td>
              <td style="text-align: right;">₹${(inv.taxableAmount * (inv.sgst / 100)).toLocaleString('en-IN')}</td>
            </tr>
            <tr class="total-row">
              <td>Total Due</td>
              <td style="text-align: right; font-size: 16px;">₹${inv.total.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td>Paid</td>
              <td style="text-align: right; font-weight: 600; color: green;">₹${(inv.total - inv.balance).toLocaleString('en-IN')}</td>
            </tr>
            <tr style="border-top: 1px solid #eee;">
              <td style="font-weight: bold;">Balance Due</td>
              <td style="text-align: right; font-weight: bold; color: red;">₹${inv.balance.toLocaleString('en-IN')}</td>
            </tr>
          </table>

          ${
            inv.payments.length > 0
              ? `
          <h4 style="margin-top: 40px; clear: both;">Payment Records</h4>
          <table style="width: 100%; font-size: 12px;">
            <thead>
              <tr style="background: #f3f4f6; color: #333;">
                <th>Date</th>
                <th>Mode</th>
                <th>Ref ID</th>
                <th style="text-align: right;">Amount Paid</th>
              </tr>
            </thead>
            <tbody>
              ${paymentsHtml}
            </tbody>
          </table>`
              : ''
          }

          <div class="footer-notes">
            <p>Thank you for choosing ${currentUser?.clinicName} for your dental healthcare!</p>
            <p>This is a computer generated tax invoice and does not require signature.</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-slate-800 font-bold">Billing & Invoices</h1>
          <p className="text-xs text-slate-500 mt-1">Manage invoice collections, calculate GST taxes, and track daily operational revenue.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddInvoice(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md flex items-center gap-1.5 transition-all self-start sm:self-auto"
          >
            <Plus size={14} /> New Invoice
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border border-slate-200 rounded-2xl p-1 bg-white shadow-sm max-w-sm">
        <button
          onClick={() => setActiveSubTab('all')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeSubTab === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          All Invoices
        </button>
        <button
          onClick={() => setActiveSubTab('summary')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeSubTab === 'summary' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Daily Summary
        </button>
      </div>

      {activeSubTab === 'all' && (
        <>
          {/* STATS TILES */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Receipt size={18} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase leading-none">Total Invoiced</p>
                <h3 className="text-base font-bold text-slate-800 mt-1">₹{totalBilled.toLocaleString('en-IN')}</h3>
              </div>
            </div>

            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign size={18} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase leading-none">Total Collections</p>
                <h3 className="text-base font-bold text-slate-800 mt-1">₹{totalCollected.toLocaleString('en-IN')}</h3>
              </div>
            </div>

            <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <CreditCard size={18} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase leading-none">Pending Collections</p>
                <h3 className="text-base font-bold text-slate-800 mt-1">₹{totalPending.toLocaleString('en-IN')}</h3>
              </div>
            </div>
          </div>

          {/* INVOICES TABLE */}
          {loading ? (
            <div className="min-h-[20vh] flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden shadow-blue-100/20">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                      <th className="py-3 px-4">Invoice No.</th>
                      <th className="py-3 px-4">Patient ID</th>
                      <th className="py-3 px-4">Patient Name</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Total Amount</th>
                      <th className="py-3 px-4">Balance</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-600">
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                          No billing invoice records found.
                        </td>
                      </tr>
                    ) : (
                      invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-bold text-slate-800 text-xs">{inv.invoiceNumber}</td>
                          <td className="py-3 px-4 font-bold text-blue-600 text-xs">{inv.patient.patientNumber}</td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{inv.patient.name}</td>
                          <td className="py-3 px-4 text-xs text-slate-400">
                            {new Date(inv.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 font-semibold">₹{inv.total.toLocaleString('en-IN')}</td>
                          <td className={`py-3 px-4 font-bold ${inv.balance > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                            ₹{inv.balance.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                              inv.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : inv.paymentStatus === 'PARTIAL' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-red-50 text-red-700 border-red-100'
                            }`}>
                              {inv.paymentStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => triggerInvoicePrint(inv)}
                              className="inline-flex p-1.5 rounded-lg border border-slate-100 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                              title="Print Invoice"
                            >
                              <Printer size={14} />
                            </button>
                            {inv.balance > 0 ? (
                              <button
                                onClick={() => setShowPaymentModal(inv)}
                                className="px-2 py-1 text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                              >
                                Pay
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400 inline-flex items-center gap-1"><CheckCircle size={10} className="text-emerald-500" /> Paid</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {activeSubTab === 'summary' && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <h3 className="font-heading font-bold text-slate-800 text-base">Collections Summary & Modes</h3>
            <input
              type="date"
              value={summaryDate}
              onChange={(e) => setSummaryDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none"
            />
          </div>

          {loadingSummary ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : !summaryData ? (
            <p className="text-center text-slate-400 text-sm">Select a date above to load summary metrics.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Daily Stats */}
              <div className="lg:col-span-1 border border-slate-100 rounded-2xl p-4.5 bg-slate-50 flex flex-col gap-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Collections Stats</h4>
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Revenue Generated:</span>
                    <span className="font-bold text-slate-800">₹{summaryData.totalRevenue.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Collections Received:</span>
                    <span className="font-bold text-emerald-600">₹{summaryData.totalCollections.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="border-t border-slate-200/50 pt-4 mt-2">
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">Received by Mode</h5>
                  <div className="space-y-2 text-xs">
                    {Object.entries(summaryData.modeBreakdown).map(([mode, amt]: any) => (
                      <div key={mode} className="flex justify-between items-center">
                        <span className="text-slate-500 capitalize">{mode.replace('_', ' ')}</span>
                        <span className="font-semibold text-slate-700">₹{amt.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Payments log */}
              <div className="lg:col-span-2 flex flex-col gap-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payments Log</h4>
                {summaryData.payments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-6">No payments processed today.</p>
                ) : (
                  <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100 font-semibold text-slate-500">
                          <th className="py-2 px-3">Patient</th>
                          <th className="py-2 px-3">Mode</th>
                          <th className="py-2 px-3">Ref ID</th>
                          <th className="py-2 px-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-slate-600">
                        {summaryData.payments.map((p: any) => (
                          <tr key={p.id}>
                            <td className="py-2 px-3 font-semibold text-slate-700">{p.invoice.patient.name}</td>
                            <td className="py-2 px-3">{p.paymentMode}</td>
                            <td className="py-2 px-3 font-mono text-slate-400">{p.referenceNumber || '—'}</td>
                            <td className="py-2 px-3 text-right font-bold">₹{p.amount.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE INVOICE MODAL */}
      {showAddInvoice && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleCreateInvoice}
            className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-6 border border-slate-100 flex flex-col gap-4 animate-scale-up"
          >
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <h3 className="font-heading font-bold text-slate-800">Generate Tax Invoice</h3>
              <button
                type="button"
                onClick={() => setShowAddInvoice(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                Close
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Select Patient *</label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                required
              >
                <option value="">Choose Patient...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.patientNumber})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Subtotal (INR) *</label>
                <input
                  type="number"
                  value={subtotal}
                  onChange={(e) => setSubtotal(Number(e.target.value))}
                  min={0}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Discount (INR)</label>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  min={0}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-slate-50 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">CGST (%)</label>
                <input
                  type="number"
                  value={cgst}
                  onChange={(e) => setCgst(Number(e.target.value))}
                  max={100}
                  min={0}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">SGST (%)</label>
                <input
                  type="number"
                  value={sgst}
                  onChange={(e) => setSgst(Number(e.target.value))}
                  max={100}
                  min={0}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Invoice Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
              />
            </div>

            {/* Live calculation panel */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 text-xs flex flex-col gap-1 text-slate-600 mt-1">
              <div className="flex justify-between items-center font-medium">
                <span>Taxable Amount:</span>
                <span>₹{draftTaxable.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span>Total GST (CGST+SGST):</span>
                <span>+ ₹{(draftCGST + draftSGST).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center font-bold text-blue-800 text-sm border-t border-blue-100/50 pt-1 mt-1">
                <span>Total Billed Due:</span>
                <span>₹{draftTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingInvoice || subtotal <= 0}
              className="w-full py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-xl shadow-md transition-colors mt-2"
            >
              {submittingInvoice ? 'Generating Invoice...' : 'Generate Invoice Record'}
            </button>
          </form>
        </div>
      )}

      {/* ADD PAYMENT RECORD MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleAddPayment}
            className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-6 border border-slate-100 flex flex-col gap-4 animate-scale-up"
          >
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <h3 className="font-heading font-bold text-slate-800">Add Invoice Payment</h3>
              <button
                type="button"
                onClick={() => setShowPaymentModal(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                Close
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-400">Invoice Ref</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">{showPaymentModal.invoiceNumber}</p>
              <p className="text-xs text-slate-500 mt-1">Outstanding Balance: ₹{showPaymentModal.balance.toLocaleString('en-IN')}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Amount (INR)</label>
              <input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                max={showPaymentModal.balance}
                min={1}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Mode</label>
              <select
                value={payMode}
                onChange={(e) => setPayMode(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card Swipe</option>
                <option value="CHEQUE">Cheque</option>
                <option value="NET_BANKING">Net Banking</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Reference Number / Transaction ID</label>
              <input
                type="text"
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
                placeholder="e.g. TXN882299"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submittingPayment}
              className="w-full py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-xl shadow-md transition-colors"
            >
              {submittingPayment ? 'Submitting Payment...' : 'Record Payment'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
