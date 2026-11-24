import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Phone, 
  Calendar, 
  Share2,
  ShieldCheck,
  Search
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { aisensyService } from '../services/aisensyService';

export default function WhatsAppCenter() {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [notice, setNotice] = useState(null);
  const settings = storageService.getAisensySettings();

  useEffect(() => {
    setLogs(storageService.getWhatsAppLogs());
    const unsub = storageService.subscribe(({ collection }) => {
      if (collection === 'whatsapp_logs' || collection === 'all') {
        setLogs(storageService.getWhatsAppLogs());
      }
    });
    return unsub;
  }, []);

  const handleRetry = async (logId) => {
    try {
      const updated = await aisensyService.retryMessage(logId);
      setLogs(storageService.getWhatsAppLogs());
      setNotice('Message retry successfully initiated.');
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredLogs = logs.filter(item => {
    return !searchTerm || 
      item.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.phone?.includes(searchTerm) ||
      item.type?.includes(searchTerm);
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Delivered
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3 h-3 text-blue-600" /> Sent to Gateway
          </span>
        );
      case 'queued':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> Scheduled / Queued
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <AlertTriangle className="w-3 h-3 text-red-600" /> Failed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">
            <MessageSquare className="w-4 h-4" /> Aisensy WhatsApp Communication Hub
          </div>
          <h1 className="text-xl font-bold text-slate-900">WhatsApp Messaging & Reminder Logs</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time delivery status for finalized prescriptions and automated follow-up visit reminders.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className={`px-3 py-1.5 rounded-xl font-bold border flex items-center gap-1.5 ${
            settings.isConnected ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${settings.isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            {settings.isConnected ? 'Aisensy API Gateway Active' : 'Aisensy Gateway Configured'}
          </span>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="text-xs font-bold text-slate-700">
          Delivery Logs ({filteredLogs.length})
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search patient, phone, type..."
            className="w-full px-3.5 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Messages List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4">Patient</th>
              <th className="py-3 px-4">Mobile Number</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Message Content Preview</th>
              <th className="py-3 px-4">Delivery Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-10 text-center text-slate-400">
                  No WhatsApp logs recorded yet.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {log.patientName}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">
                    {log.phone}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      log.type === 'prescription' ? 'bg-teal-100 text-teal-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {log.type === 'prescription' ? 'Prescription' : 'Follow-up'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                    {log.timestamp}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-sm truncate" title={log.messageText}>
                    {log.messageText}
                  </td>
                  <td className="py-3.5 px-4">
                    {getStatusBadge(log.status)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {log.status === 'failed' && (
                      <button
                        onClick={() => handleRetry(log.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[11px] border border-red-200"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Retry</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
