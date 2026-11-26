import React, { useState } from 'react';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  Calendar, 
  FlaskConical, 
  TrendingUp, 
  Activity, 
  PieChart as PieIcon, 
  BarChart3,
  CalendarDays,
  ArrowUpRight,
  AlertCircle
} from 'lucide-react';

export default function DashboardAnalytics({ 
  patients = [], 
  queue = [], 
  tests = [], 
  prescriptions = [] 
}) {
  const [dateRange, setDateRange] = useState('7d'); // 'today' | '7d' | '30d' | 'all'

  const todayDate = new Date();
  const todayStr = todayDate.toISOString().split('T')[0];

  // Helper: check if a date falls in selected range
  const isDateInRange = (dateStr, range) => {
    if (!dateStr) return false;
    const itemDate = dateStr.split('T')[0];
    if (range === 'all') return true;
    if (range === 'today') return itemDate === todayStr;

    const itemTime = new Date(itemDate).getTime();
    const nowTime = new Date(todayStr).getTime();
    const diffDays = Math.round((nowTime - itemTime) / (1000 * 60 * 60 * 24));

    if (range === '7d') return diffDays >= 0 && diffDays < 7;
    if (range === '30d') return diffDays >= 0 && diffDays < 30;
    return true;
  };

  // 1. Gather all real visit events across prescriptions, patient history and today's queue
  const allVisits = [];
  const seenVisits = new Set();

  prescriptions.forEach(rx => {
    const rxDate = rx.date ? rx.date.split('T')[0] : (rx.createdAt ? rx.createdAt.split('T')[0] : todayStr);
    const key = rx.id || `${rx.patientId}_${rxDate}`;
    seenVisits.add(key);
    allVisits.push({ date: rxDate, patientId: rx.patientId, source: 'prescription' });
  });

  patients.forEach(p => {
    (p.history || []).forEach(h => {
      const hDate = h.date ? h.date.split('T')[0] : (p.createdAt ? p.createdAt.split('T')[0] : todayStr);
      const key = h.visitId || `${p.id}_${hDate}`;
      if (!seenVisits.has(key)) {
        seenVisits.add(key);
        allVisits.push({ date: hDate, patientId: p.id, source: 'history' });
      }
    });
  });

  queue.forEach(q => {
    if (q.status !== 'cancelled' && q.status !== 'no_show') {
      if (!allVisits.some(v => v.patientId === q.patientId && v.date === todayStr)) {
        allVisits.push({ date: todayStr, patientId: q.patientId, source: 'queue' });
      }
    }
  });

  // 2. Compute dynamic Footfall Chart Bars based on dateRange
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  let chartBars = [];

  if (dateRange === 'today' || dateRange === '7d') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const count = allVisits.filter(v => v.date === dStr).length;
      const isTodayBar = i === 0;
      chartBars.push({
        label: isTodayBar ? 'Today' : dayNames[d.getDay()],
        sublabel: dStr.slice(5),
        count,
        isHighlight: isTodayBar
      });
    }
  } else if (dateRange === '30d') {
    for (let p = 4; p >= 0; p--) {
      const endDaysAgo = p * 6;
      const startDaysAgo = endDaysAgo + 5;
      const dStart = new Date();
      dStart.setDate(dStart.getDate() - startDaysAgo);
      const dEnd = new Date();
      dEnd.setDate(dEnd.getDate() - endDaysAgo);
      const startStr = dStart.toISOString().split('T')[0];
      const endStr = dEnd.toISOString().split('T')[0];
      const count = allVisits.filter(v => v.date >= startStr && v.date <= endStr).length;
      chartBars.push({
        label: p === 0 ? 'This Wk' : `-${p * 6}d`,
        sublabel: `${startStr.slice(5)} - ${endStr.slice(5)}`,
        count,
        isHighlight: p === 0
      });
    }
  } else {
    // 'all': group by months
    const monthsMap = {};
    allVisits.forEach(v => {
      const mStr = v.date.slice(0, 7);
      monthsMap[mStr] = (monthsMap[mStr] || 0) + 1;
    });
    const months = Object.keys(monthsMap).sort();
    if (months.length > 0) {
      chartBars = months.slice(-7).map(m => {
        const d = new Date(m + '-01');
        const monthName = d.toLocaleString('en-US', { month: 'short' });
        return {
          label: monthName,
          sublabel: m,
          count: monthsMap[m],
          isHighlight: m === todayStr.slice(0, 7)
        };
      });
    }
    if (chartBars.length < 2) {
      chartBars = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        const count = allVisits.filter(v => v.date === dStr).length;
        chartBars.push({
          label: i === 0 ? 'Today' : dayNames[d.getDay()],
          sublabel: dStr.slice(5),
          count,
          isHighlight: i === 0
        });
      }
    }
  }

  const maxBarCount = Math.max(...chartBars.map(b => b.count), 1);
  const totalPeriodVisits = chartBars.reduce((acc, b) => acc + b.count, 0);
  const peakBar = [...chartBars].sort((a, b) => b.count - a.count)[0];

  // 3. Filter KPI metrics based on active dateRange
  const activePatientsInPeriod = patients.filter(p => {
    if (dateRange === 'all') return true;
    if (isDateInRange(p.createdAt, dateRange)) return true;
    if ((p.history || []).some(h => isDateInRange(h.date, dateRange))) return true;
    if (prescriptions.some(rx => rx.patientId === p.id && isDateInRange(rx.date || rx.createdAt, dateRange))) return true;
    if (dateRange === 'today' && queue.some(q => q.patientId === p.id)) return true;
    return false;
  });

  const totalPatients = dateRange === 'all' ? patients.length : activePatientsInPeriod.length;

  const waitingCount = queue.filter(q => q.status === 'waiting').length;
  const inConsultCount = queue.filter(q => q.status === 'in_consultation' || q.status === 'called').length;
  const completedTodayCount = allVisits.filter(v => v.date === todayStr).length;
  const completedInPeriodCount = allVisits.filter(v => isDateInRange(v.date, dateRange)).length;

  const testsInPeriod = tests.filter(t => isDateInRange(t.prescribedDate || t.createdAt, dateRange));
  const totalTests = dateRange === 'all' ? tests.length : testsInPeriod.length;
  const pendingReportsCount = (dateRange === 'all' ? tests : testsInPeriod)
    .filter(t => t.status !== 'report_attached' && t.status !== 'completed').length;

  // New vs Returning patients in period
  const targetPatientsForRatio = dateRange === 'all' ? patients : (activePatientsInPeriod.length > 0 ? activePatientsInPeriod : patients);
  const returningPatientsCount = targetPatientsForRatio.filter(p => p.history && p.history.length > 0).length;
  const newPatientsCount = Math.max(0, targetPatientsForRatio.length - returningPatientsCount);
  const returningPct = Math.round((returningPatientsCount / Math.max(targetPatientsForRatio.length, 1)) * 100);
  const newPct = 100 - returningPct;

  // 4. Follow-ups: Classify into Overdue (< today) and Upcoming (>= today)
  // Deduplicate per patient to track the active latest follow-up date
  const patientFollowUpMap = new Map();

  patients.forEach(p => {
    (p.history || []).forEach(h => {
      if (h.followUpDate) {
        const item = {
          patientId: p.id,
          patientName: p.name,
          phone: p.phone,
          followUpDate: h.followUpDate,
          isOverdue: h.followUpDate < todayStr,
          isToday: h.followUpDate === todayStr,
          isUpcoming: h.followUpDate >= todayStr
        };
        const prev = patientFollowUpMap.get(p.id);
        if (!prev || item.followUpDate > prev.followUpDate) {
          patientFollowUpMap.set(p.id, item);
        }
      }
    });
  });

  prescriptions.forEach(rx => {
    if (rx.followUpDate) {
      const item = {
        patientId: rx.patientId,
        patientName: rx.patientName,
        phone: rx.patientPhone || patients.find(p => p.id === rx.patientId)?.phone || '—',
        followUpDate: rx.followUpDate,
        isOverdue: rx.followUpDate < todayStr,
        isToday: rx.followUpDate === todayStr,
        isUpcoming: rx.followUpDate >= todayStr
      };
      const prev = patientFollowUpMap.get(rx.patientId);
      if (!prev || item.followUpDate > prev.followUpDate) {
        patientFollowUpMap.set(rx.patientId, item);
      }
    }
  });

  const allFollowUps = Array.from(patientFollowUpMap.values());

  const filteredFollowUps = allFollowUps.filter(f => {
    if (dateRange === 'all') return true;
    if (dateRange === 'today') return f.isToday || f.isOverdue;
    const fTime = new Date(f.followUpDate).getTime();
    const nowTime = new Date(todayStr).getTime();
    const diffDaysAhead = Math.round((fTime - nowTime) / (1000 * 60 * 60 * 24));
    const diffDaysBehind = -diffDaysAhead;
    if (dateRange === '7d') {
      return (f.isUpcoming && diffDaysAhead <= 7) || (f.isOverdue && diffDaysBehind <= 7);
    }
    if (dateRange === '30d') {
      return (f.isUpcoming && diffDaysAhead <= 30) || (f.isOverdue && diffDaysBehind <= 30);
    }
    return true;
  });

  // Sort: Overdue first (ascending), then Upcoming (ascending)
  filteredFollowUps.sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    return a.followUpDate.localeCompare(b.followUpDate);
  });

  const overdueCount = filteredFollowUps.filter(f => f.isOverdue).length;
  const upcomingCount = filteredFollowUps.filter(f => f.isUpcoming).length;

  return (
    <div className="space-y-6">

      {/* Top Banner with Date Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-teal-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4" /> Section Seven • Clinical Analytics & Footfall
          </div>
          <h1 className="text-xl font-bold text-slate-900">Practice Overview & Metrics</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time KPIs for clinic intake, consultation throughput, follow-up adherence, and diagnostic tests.
          </p>
        </div>

        {/* Date Filter Buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
          {[
            { id: 'today', label: 'Today' },
            { id: '7d', label: 'Last 7 Days' },
            { id: '30d', label: 'Last 30 Days' },
            { id: 'all', label: 'All Records' }
          ].map(d => (
            <button
              key={d.id}
              onClick={() => setDateRange(d.id)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateRange === d.id ? 'bg-white text-teal-800 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {dateRange === 'all' ? 'Total Patients' : 'Active Patients'}
            </span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalPatients}</div>
          <div className="flex items-center gap-1 text-[11px] text-teal-700 font-semibold mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{dateRange === 'all' ? 'Registered directory' : `In ${dateRange} window`}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Live Queue</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{waitingCount + inConsultCount}</div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">
            {waitingCount} waiting • {inConsultCount} consulting
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed Visits</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {dateRange === 'today' ? completedTodayCount : completedInPeriodCount}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            {dateRange === 'today' ? 'Prescriptions issued today' : `Visits in ${dateRange}`}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Prescribed Tests</span>
            <FlaskConical className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalTests}</div>
          <div className="text-[11px] text-purple-700 font-medium mt-1">
            {pendingReportsCount} reports pending
          </div>
        </div>

      </div>

      {/* Grid of Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Chart 1: Dynamic Footfall Over Time */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              <h2 className="text-sm font-bold text-slate-900">Clinic Footfall (Real Patient Visits)</h2>
            </div>
            <span className="text-[11px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
              {dateRange.toUpperCase()}
            </span>
          </div>

          {/* SVG Bar Chart with Dynamic Data */}
          <div className="h-52 w-full pt-4">
            <svg viewBox="0 0 320 140" className="w-full h-full">
              {/* Grid Lines */}
              <line x1="20" y1="25" x2="310" y2="25" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="20" y1="55" x2="310" y2="55" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="20" y1="85" x2="310" y2="85" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="20" y1="115" x2="310" y2="115" stroke="#e2e8f0" />
              
              {/* Dynamic Footfall Bars from Real Records */}
              {chartBars.map((b, i) => {
                const totalBars = chartBars.length;
                const step = 280 / totalBars;
                const barWidth = Math.min(Math.round(step * 0.55), 26);
                const x = 25 + i * step + (step - barWidth) / 2;
                const barH = b.count > 0 ? Math.max(Math.round((b.count / maxBarCount) * 80), 12) : 4;
                const y = 115 - barH;
                return (
                  <g key={`${b.label}-${i}`} className="cursor-pointer group">
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barH}
                      rx="4"
                      className={`${
                        b.isHighlight 
                          ? 'fill-teal-700 hover:fill-teal-800' 
                          : b.count > 0 ? 'fill-teal-500 hover:fill-teal-600' : 'fill-slate-200'
                      } transition-colors`}
                    />
                    <text 
                      x={x + barWidth / 2} 
                      y={y - 4} 
                      textAnchor="middle" 
                      className="text-[10px] font-bold fill-slate-700 font-mono"
                    >
                      {b.count}
                    </text>
                    <text 
                      x={x + barWidth / 2} 
                      y="130" 
                      textAnchor="middle" 
                      className={`text-[10px] ${b.isHighlight ? 'fill-teal-800 font-bold' : 'fill-slate-500 font-medium'}`}
                    >
                      {b.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="text-[11px] text-slate-500 text-center font-medium">
            Peak footfall: <strong className="text-slate-800">{peakBar?.label || '—'}</strong> ({peakBar?.count || 0} visits). Total in range: <strong className="text-slate-800">{totalPeriodVisits}</strong> visits.
          </div>
        </div>

        {/* Chart 2: Queue Status Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-teal-600" />
              <h2 className="text-sm font-bold text-slate-900">Queue Status Breakdown</h2>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Current session</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-2">
            {/* Donut representation */}
            <div className="relative w-36 h-36">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                <circle 
                  cx="18" cy="18" r="15.915" fill="none" stroke="#f59e0b" strokeWidth="4"
                  strokeDasharray={`${(waitingCount / Math.max(queue.length, 1)) * 100} 100`}
                  strokeDashoffset="0"
                />
                <circle 
                  cx="18" cy="18" r="15.915" fill="none" stroke="#0d9488" strokeWidth="4"
                  strokeDasharray={`${(inConsultCount / Math.max(queue.length, 1)) * 100} 100`}
                  strokeDashoffset={`-${(waitingCount / Math.max(queue.length, 1)) * 100}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-slate-900">{queue.length}</span>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">In Queue</span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0"></span>
                <span className="text-slate-600">Waiting in Lobby:</span>
                <strong className="text-slate-900 font-mono">{waitingCount}</strong>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-teal-600 shrink-0"></span>
                <span className="text-slate-600">In Consultation:</span>
                <strong className="text-slate-900 font-mono">{inConsultCount}</strong>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></span>
                <span className="text-slate-600">Completed Today:</span>
                <strong className="text-slate-900 font-mono">{completedTodayCount}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Chart 3: New vs Returning Patients */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-600" />
              <h2 className="text-sm font-bold text-slate-900">New vs Returning Patient Ratio</h2>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Retention</span>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">Returning Patients (Follow-ups)</span>
                <span className="font-mono text-teal-700">{returningPatientsCount} ({returningPct}%)</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-teal-600 rounded-full"
                  style={{ width: `${returningPct}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">First-Time Registrations</span>
                <span className="font-mono text-emerald-700">{newPatientsCount} ({newPct}%)</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${newPct}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-teal-50 rounded-xl text-[11px] text-teal-900 leading-snug">
            Strong follow-up rate reflecting consistent chronic constitutional care and homoeopathy regimen compliance.
          </div>
        </div>

        {/* Chart 4: Follow-ups Due & Overdue (PDF Section 7 Mandate) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-teal-600" />
              <h2 className="text-sm font-bold text-slate-900">Follow-ups Due & Scheduled Reminders</h2>
            </div>
            <div className="flex items-center gap-1.5">
              {overdueCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                  {overdueCount} Overdue
                </span>
              )}
              <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
                {upcomingCount} Upcoming
              </span>
            </div>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {filteredFollowUps.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">
                No follow-ups recorded in this date range.
              </div>
            ) : (
              filteredFollowUps.map((item, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center justify-between p-2.5 rounded-xl text-xs border ${
                    item.isOverdue 
                      ? 'bg-red-50/60 border-red-200 text-red-950' 
                      : 'bg-slate-50 border-slate-200/70 text-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{item.patientName}</span>
                      {item.isOverdue && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.2 rounded">
                          <AlertCircle className="w-3 h-3 text-red-600" /> Overdue
                        </span>
                      )}
                    </div>
                    <span className="text-slate-500 block text-[10px] font-mono mt-0.5">{item.phone}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono font-bold px-2 py-0.5 rounded border text-[11px] ${
                      item.isOverdue 
                        ? 'bg-red-100/80 border-red-300 text-red-800' 
                        : 'bg-teal-50 border-teal-200 text-teal-800'
                    }`}>
                      {item.followUpDate}
                    </span>
                    <span className="text-[10px] text-emerald-600 block mt-0.5 font-medium">WhatsApp active</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
