import React, { useState } from 'react';
import { 
  ClipboardList, 
  UserCheck, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RotateCcw, 
  ArrowRight, 
  Phone, 
  AlertCircle,
  Filter,
  Volume2
} from 'lucide-react';
import { storageService } from '../services/storageService';

export default function LiveQueue({ 
  queue, 
  onQueueUpdate, 
  onOpenConsultation, 
  userRole = 'doctor' 
}) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [calledAlert, setCalledAlert] = useState(null);

  // Status metrics
  const waitingCount = queue.filter(q => q.status === 'waiting').length;
  const inConsultCount = queue.filter(q => q.status === 'in_consultation' || q.status === 'called').length;
  const completedCount = queue.filter(q => q.status === 'completed').length;
  const cancelledCount = queue.filter(q => q.status === 'cancelled' || q.status === 'no_show').length;

  // Filtered queue items
  const filteredQueue = queue.filter(item => {
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesSearch = !searchTerm || 
      item.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.token.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.phone.includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  // Call Next Waiting Patient
  const handleCallNext = () => {
    const nextPatient = storageService.callNextWaiting();
    if (nextPatient) {
      onQueueUpdate(storageService.getQueue());
      setCalledAlert(`Called next patient: ${nextPatient.patientName} (${nextPatient.token})`);
      setTimeout(() => setCalledAlert(null), 4000);
    } else {
      alert('No waiting patients currently in the queue.');
    }
  };

  // Change Status Handler
  const handleStatusChange = (queueId, newStatus) => {
    const updated = storageService.updateQueueStatus(queueId, newStatus);
    onQueueUpdate(updated);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'waiting':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> Waiting
          </span>
        );
      case 'called':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
            <Volume2 className="w-3 h-3 text-blue-600" /> Called
          </span>
        );
      case 'in_consultation':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping"></span> In Consultation
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed
          </span>
        );
      case 'no_show':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            No-Show
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Call Next Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-teal-700 text-xs font-bold uppercase tracking-wider mb-1">
            <ClipboardList className="w-4 h-4" /> Real-time Clinic Patient Flow
          </div>
          <h1 className="text-xl font-bold text-slate-900">Live Consultation Queue</h1>
          <p className="text-xs text-slate-500 mt-1">
            Synchronized patient queue across reception intake and doctor consultation room.
          </p>
        </div>

        {/* Doctor Call Next Button */}
        {userRole !== 'staff' && (
          <button
            onClick={handleCallNext}
            disabled={waitingCount === 0}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white text-xs font-bold shadow-md shadow-teal-700/20 transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            <Volume2 className="w-4 h-4" />
            <span>Call Next Waiting Patient</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {calledAlert && (
        <div className="p-4 bg-teal-50 border border-teal-200 text-teal-800 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs animate-bounce">
          <Volume2 className="w-5 h-5 text-teal-600 shrink-0" />
          <span>{calledAlert}</span>
        </div>
      )}

      {/* Queue Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => setFilterStatus('waiting')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filterStatus === 'waiting' ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Waiting in Lobby</div>
          <div className="text-2xl font-extrabold text-amber-900 mt-1">{waitingCount}</div>
          <div className="text-[10px] text-amber-600 mt-1">Ready for consultation</div>
        </div>

        <div 
          onClick={() => setFilterStatus('in_consultation')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filterStatus === 'in_consultation' ? 'bg-teal-50/80 border-teal-300 ring-2 ring-teal-400' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-semibold text-teal-700 uppercase tracking-wider">In Consultation</div>
          <div className="text-2xl font-extrabold text-teal-900 mt-1">{inConsultCount}</div>
          <div className="text-[10px] text-teal-600 mt-1">Currently with doctor</div>
        </div>

        <div 
          onClick={() => setFilterStatus('completed')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filterStatus === 'completed' ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Completed Today</div>
          <div className="text-2xl font-extrabold text-emerald-900 mt-1">{completedCount}</div>
          <div className="text-[10px] text-emerald-600 mt-1">Prescriptions finalized</div>
        </div>

        <div 
          onClick={() => setFilterStatus('all')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filterStatus === 'all' ? 'bg-slate-100 border-slate-300 ring-2 ring-slate-400' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">Total in Queue</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{queue.length}</div>
          <div className="text-[10px] text-slate-500 mt-1">View all records</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-500 shrink-0">Filter:</span>
          {['all', 'waiting', 'called', 'in_consultation', 'completed'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 capitalize ${
                filterStatus === st 
                  ? 'bg-teal-600 text-white font-semibold' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search name, token, phone..."
            className="w-full px-3.5 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Patient List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Token #</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Demographics</th>
                <th className="py-3 px-4">Arrival Time</th>
                <th className="py-3 px-4">Intake Notes</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-400">
                    No patients match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredQueue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Token */}
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-800 text-sm">
                      {item.token}
                    </td>

                    {/* Patient Name & Phone */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{item.patientName}</div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {item.phone}
                      </div>
                    </td>

                    {/* Age / Gender */}
                    <td className="py-3.5 px-4 text-slate-600">
                      {item.age} yrs • {item.gender}
                    </td>

                    {/* Arrival Time */}
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {item.arrivalTime}
                    </td>

                    {/* Notes */}
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate" title={item.notes}>
                      {item.notes || '—'}
                    </td>

                    {/* Status Chip */}
                    <td className="py-3.5 px-4">
                      {getStatusBadge(item.status)}
                    </td>

                    {/* Quick Actions */}
                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                      {/* Doctor Open Workspace Action */}
                      {userRole !== 'staff' && (
                        <button
                          onClick={() => onOpenConsultation(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] shadow-xs transition-colors"
                        >
                          <Play className="w-3 h-3" />
                          <span>Consult</span>
                        </button>
                      )}

                      {/* Status transitions */}
                      {item.status === 'waiting' && (
                        <button
                          onClick={() => handleStatusChange(item.id, 'called')}
                          title="Call Patient"
                          className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-[11px] border border-blue-200"
                        >
                          Call
                        </button>
                      )}

                      {item.status === 'called' && (
                        <button
                          onClick={() => handleStatusChange(item.id, 'in_consultation')}
                          title="Start Consultation"
                          className="px-2.5 py-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 font-semibold text-[11px] border border-teal-200"
                        >
                          In Consult
                        </button>
                      )}

                      {(item.status === 'in_consultation' || item.status === 'called') && (
                        <button
                          onClick={() => handleStatusChange(item.id, 'completed')}
                          title="Mark Completed"
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-[11px] border border-emerald-200"
                        >
                          Complete
                        </button>
                      )}

                      {item.status === 'waiting' && (
                        <button
                          onClick={() => handleStatusChange(item.id, 'no_show')}
                          title="Mark No-Show"
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-semibold text-[11px]"
                        >
                          No-Show
                        </button>
                      )}

                      {(item.status === 'no_show' || item.status === 'cancelled') && (
                        <button
                          onClick={() => handleStatusChange(item.id, 'waiting')}
                          title="Return to Waiting"
                          className="px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold text-[11px] border border-amber-200 inline-flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Re-wait</span>
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

    </div>
  );
}
