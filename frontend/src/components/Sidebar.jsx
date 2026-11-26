import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  Stethoscope, 
  Pill, 
  FlaskConical, 
  MessageSquare, 
  Settings, 
  UserPlus,
  ShieldAlert
} from 'lucide-react';

export default function Sidebar({ activeTab, onTabChange, userRole = 'doctor', waitingCount = 0 }) {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Clinical Dashboard',
      shortLabel: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['doctor', 'admin', 'staff']
    },
    {
      id: 'queue',
      label: 'Live Patient Queue',
      shortLabel: 'Queue',
      icon: ClipboardList,
      badge: waitingCount > 0 ? waitingCount : null,
      roles: ['doctor', 'staff', 'admin']
    },
    {
      id: 'intake',
      label: 'Patient Intake',
      shortLabel: 'Intake',
      icon: UserPlus,
      roles: ['staff', 'doctor', 'admin']
    },
    {
      id: 'workspace',
      label: 'Doctor Workspace',
      shortLabel: 'Consult',
      icon: Stethoscope,
      roles: ['doctor', 'admin'] // Protected from staff-only
    },
    {
      id: 'medicines',
      label: 'Medicines & Presets',
      shortLabel: 'Medicines',
      icon: Pill,
      roles: ['doctor', 'staff', 'admin']
    },
    {
      id: 'tests',
      label: 'Tests & Lab Reports',
      shortLabel: 'Tests',
      icon: FlaskConical,
      roles: ['doctor', 'staff', 'admin']
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp & Reminders',
      shortLabel: 'WhatsApp',
      icon: MessageSquare,
      roles: ['doctor', 'staff', 'admin']
    },
    {
      id: 'settings',
      label: 'Settings & Security',
      shortLabel: 'Settings',
      icon: Settings,
      roles: ['doctor', 'admin']
    }
  ];

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shrink-0 min-h-[calc(100vh-4rem)] p-3">
        <div className="text-[10px] uppercase font-bold text-slate-600 px-3 py-2 tracking-wider">
          Clinical Navigation
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isPermitted = item.roles.includes(userRole);
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            if (!isPermitted) {
              return null;
            }

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-sm shadow-teal-700/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white text-teal-700' : 'bg-teal-100 text-teal-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Doctor clinical badge bottom with Official Company Logo */}
        <div className="mt-auto pt-4 border-t border-slate-100 px-3">
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600">
            <div className="font-bold text-slate-800 flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-md bg-white border border-slate-200 p-0.5 shadow-2xs shrink-0 flex items-center justify-center">
                <img src="/logo.png" alt="VEAYOS Logo" className="w-full h-full object-contain" />
              </div>
              <span className="truncate">VEAYOS Homoeopathy</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-snug">
              Kentian Repertory AI & Letterpad Prescription Engine
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {navItems
          .filter(i => i.roles.includes(userRole))
          .slice(0, 5)
          .map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors relative ${
                  isActive ? 'text-teal-700 font-bold' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                <span className="mt-0.5">{item.shortLabel}</span>
                {item.badge && (
                  <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-teal-600"></span>
                )}
              </button>
            );
          })}
      </nav>
    </>
  );
}
