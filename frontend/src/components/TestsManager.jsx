import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  Upload, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Eye, 
  Plus, 
  Search, 
  X,
  AlertCircle
} from 'lucide-react';
import { storageService } from '../services/storageService';

export default function TestsManager() {
  const [tests, setTests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [previewModal, setPreviewModal] = useState(null);
  const [uploadModal, setUploadModal] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    setTests(storageService.getTests());
    const unsub = storageService.subscribe(({ collection }) => {
      if (collection === 'tests' || collection === 'all') {
        setTests(storageService.getTests());
      }
    });
    return unsub;
  }, []);

  const filtered = tests.filter(t => {
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesSearch = !searchTerm || 
      t.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.patientName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleFileUpload = (e, testId) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read as Data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      const reportUrl = event.target.result;
      const updated = storageService.attachReportToTest(testId, {
        reportUrl,
        reportFileName: file.name,
        reportFileType: file.type
      });
      setTests(updated);
      setUploadModal(null);
      setNotice(`Report '${file.name}' attached successfully to test!`);
      setTimeout(() => setNotice(null), 3000);
    };
    reader.readAsDataURL(file);
  };

  const getStatusBadge = (status) => {
    if (status === 'report_attached' || status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Report Ready
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3 h-3 text-amber-600" /> Report Pending
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-teal-700 text-xs font-bold uppercase tracking-wider mb-1">
            <FlaskConical className="w-4 h-4" /> Diagnostic Lab & Investigations
          </div>
          <h1 className="text-xl font-bold text-slate-900">Diagnostic Tests & Attached Reports</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track prescribed pathology, ultrasound, and blood tests, and securely attach lab report files.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-slate-100 p-2 rounded-xl text-slate-700 font-medium">
          <span>Pending Reports: <strong>{tests.filter(t => t.status !== 'report_attached').length}</strong></span>
          <span>•</span>
          <span>Attached: <strong className="text-teal-700">{tests.filter(t => t.status === 'report_attached').length}</strong></span>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-teal-50 border border-teal-200 text-teal-900 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2">
          {['all', 'prescribed', 'report_attached'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize ${
                statusFilter === st 
                  ? 'bg-teal-600 text-white font-semibold' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'all' ? 'All Tests' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search test name, patient..."
            className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Tests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4">Test Name</th>
              <th className="py-3 px-4">Patient</th>
              <th className="py-3 px-4">Date Prescribed</th>
              <th className="py-3 px-4">Instructions</th>
              <th className="py-3 px-4">Report Status</th>
              <th className="py-3 px-4 text-right">Attached Report</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-10 text-center text-slate-400">
                  No diagnostic tests currently recorded.
                </td>
              </tr>
            ) : (
              filtered.map((test) => (
                <tr key={test.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {test.testName}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    {test.patientName || 'Rajesh Sharma'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono">
                    {test.prescribedDate || test.datePrescribed || '2026-11-24'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 italic">
                    {test.instructions || 'Routine investigation'}
                  </td>
                  <td className="py-3.5 px-4">
                    {getStatusBadge(test.status)}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    {test.reportUrl ? (
                      <button
                        onClick={() => setPreviewModal(test)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-800 hover:bg-teal-100 font-bold text-[11px] border border-teal-200"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Report</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setUploadModal(test)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] border border-slate-300"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Attach Report</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Upload Modal */}
      {uploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Attach Diagnostic Report</h3>
              <button onClick={() => setUploadModal(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600">
              Attach scan, PDF, or image file for <strong>{uploadModal.testName}</strong> ({uploadModal.patientName}).
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-teal-500 transition-colors">
              <Upload className="w-8 h-8 text-teal-600 mx-auto mb-2" />
              <label className="cursor-pointer block text-xs font-bold text-teal-700 hover:text-teal-800">
                <span>Select PDF or Image file</span>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={(e) => handleFileUpload(e, uploadModal.id)}
                  className="hidden"
                />
              </label>
              <p className="text-[10px] text-slate-400 mt-1">Supports PDF, PNG, JPG up to 10MB</p>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{previewModal.testName} - Report</h3>
                <p className="text-[11px] text-slate-500">{previewModal.reportFileName || 'Attached document'}</p>
              </div>
              <button onClick={() => setPreviewModal(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-100 rounded-xl flex items-center justify-center min-h-[300px]">
              {previewModal.reportFileType?.startsWith('image/') || previewModal.reportUrl?.startsWith('data:image') ? (
                <img 
                  src={previewModal.reportUrl} 
                  alt="Diagnostic Report" 
                  className="max-h-[500px] object-contain rounded-lg shadow-sm"
                />
              ) : (
                <div className="text-center p-8">
                  <FileText className="w-16 h-16 text-teal-600 mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-800">{previewModal.reportFileName || 'PDF Report Document'}</p>
                  <a
                    href={previewModal.reportUrl}
                    download={previewModal.reportFileName || 'diagnostic-report.pdf'}
                    className="inline-block mt-3 px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs"
                  >
                    Download Report Document
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
