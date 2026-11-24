import React, { useState, useEffect } from 'react';
import { 
  Pill, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Copy, 
  CheckCircle, 
  Filter, 
  X,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { storageService } from '../services/storageService';

export default function MedicinesLibrary() {
  const [presets, setPresets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingPreset, setEditingPreset] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [notification, setNotification] = useState(null);

  const [form, setForm] = useState({
    name: '',
    potency: '30C',
    category: 'Constitutional',
    dosage: '4 globules',
    frequency: 'BD (Twice daily)',
    duration: '7 days',
    instructions: 'Dissolve in clean dry mouth 15 mins before meals'
  });

  useEffect(() => {
    setPresets(storageService.getMedicinePresets());
    const unsub = storageService.subscribe(({ collection }) => {
      if (collection === 'medicine_presets' || collection === 'all') {
        setPresets(storageService.getMedicinePresets());
      }
    });
    return unsub;
  }, []);

  const categories = ['all', 'Acute / Trauma', 'Digestive / Constitutional', 'Respiratory / Musculoskeletal', 'Musculoskeletal', 'Hepatic / Digestive', 'Constitutional', 'Acute / Febrile', 'Sycotic / Skin'];

  const filtered = presets.filter(item => {
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.potency.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenAdd = () => {
    setEditingPreset(null);
    setForm({
      name: '',
      potency: '30C',
      category: 'Constitutional',
      dosage: '4 globules',
      frequency: 'BD (Twice daily)',
      duration: '7 days',
      instructions: 'Dissolve in clean dry mouth 15 mins before meals'
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (preset) => {
    setEditingPreset(preset);
    setForm({ ...preset });
    setShowAddModal(true);
  };

  const handleDuplicate = (preset) => {
    const duplicated = {
      ...preset,
      id: null,
      name: `${preset.name} (Copy)`
    };
    const updated = storageService.saveMedicinePreset(duplicated);
    setPresets(updated);
    showNotice(`Duplicated preset '${preset.name}'`);
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to remove preset '${name}'? Existing finalized prescriptions will not be affected.`)) {
      const updated = storageService.deleteMedicinePreset(id);
      setPresets(updated);
      showNotice(`Removed preset '${name}'`);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert('Medicine name is required.');

    const updated = storageService.saveMedicinePreset(form);
    setPresets(updated);
    setShowAddModal(false);
    showNotice(editingPreset ? 'Preset updated successfully' : 'New preset created successfully');
  };

  const showNotice = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-teal-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Pill className="w-4 h-4" /> Section Three • Medicines & Presets
          </div>
          <h1 className="text-xl font-bold text-slate-900">Homoeopathy Medicine Library</h1>
          <p className="text-xs text-slate-500 mt-1">
            Reusable remedies, potencies, dosages, and instructions for 1-click insertion into prescriptions.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white text-xs font-bold shadow-md shadow-teal-700/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Preset</span>
        </button>
      </div>

      {notification && (
        <div className="p-3 bg-teal-50 border border-teal-200 text-teal-900 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs animate-fade-in">
          <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-500 shrink-0">Category:</span>
          {['all', 'Constitutional', 'Acute / Trauma', 'Hepatic / Digestive'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                selectedCategory === cat 
                  ? 'bg-teal-600 text-white font-semibold' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'All Presets' : cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search remedy, potency, category..."
            className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Presets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((preset) => (
          <div 
            key={preset.id} 
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-teal-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{preset.name}</h3>
                  <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full inline-block mt-1">
                    {preset.category}
                  </span>
                </div>
                <span className="font-mono font-bold text-teal-800 text-xs px-2.5 py-1 rounded-lg bg-teal-100/70">
                  {preset.potency}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-400">Dosage:</span>
                  <span className="font-medium text-slate-800">{preset.dosage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Frequency:</span>
                  <span className="font-medium text-slate-800">{preset.frequency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Duration:</span>
                  <span className="font-medium text-slate-800">{preset.duration}</span>
                </div>
                {preset.instructions && (
                  <p className="text-[11px] text-slate-500 italic mt-2 bg-slate-50 p-2 rounded-lg leading-snug">
                    "{preset.instructions}"
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-1 mt-4 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleDuplicate(preset)}
                title="Duplicate Preset"
                className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleOpenEdit(preset)}
                title="Edit Preset"
                className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(preset.id, preset.name)}
                title="Delete Preset"
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
                <Pill className="w-5 h-5 text-teal-600" />
                <span>{editingPreset ? 'Edit Medicine Preset' : 'Create New Medicine Preset'}</span>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Remedy Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Arnica Montana"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Default Potency</label>
                  <select
                    value={form.potency}
                    onChange={(e) => setForm({ ...form, potency: e.target.value })}
                    className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="6C">6C</option>
                    <option value="30C">30C</option>
                    <option value="200C">200C</option>
                    <option value="1M">1M</option>
                    <option value="10M">10M</option>
                    <option value="Q">Q (Mother Tincture)</option>
                    <option value="6X">6X (Biochemic)</option>
                    <option value="12X">12X (Biochemic)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="e.g. Constitutional"
                    className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Default Dosage</label>
                  <input
                    type="text"
                    value={form.dosage}
                    onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                    placeholder="e.g. 4 globules"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Frequency</label>
                  <input
                    type="text"
                    value={form.frequency}
                    onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                    placeholder="e.g. TDS (3 times daily)"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Duration</label>
                <input
                  type="text"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  placeholder="e.g. 7 days"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Patient Instructions</label>
                <textarea
                  rows="2"
                  value={form.instructions}
                  onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                  placeholder="e.g. Dissolve under tongue, avoid mint"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm"
                >
                  Save Preset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
