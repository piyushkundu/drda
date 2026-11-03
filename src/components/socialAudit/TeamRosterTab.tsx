'use client';

import React, { useState, useMemo } from 'react';
import { useSocialAuditStore } from '@/stores/socialAuditStore';
import { VRPMember, AuditBlock } from '@/types/socialAudit';
import { exportVRPRosterExcel } from '@/lib/exportVRPExcel';
import { matchesBRP } from '@/lib/brpHelper';
import { 
  Users, Phone, PhoneCall, Copy, Check, Plus, Trash2, Edit3, 
  UserCheck, Search, Filter, Download, Shield, CheckCircle2, 
  AlertCircle, RefreshCw, X, ChevronLeft, ChevronRight, Sparkles,
  UserPlus, MapPin, Building2, UserX
} from 'lucide-react';

export default function TeamRosterTab() {
  const { 
    records, 
    asOfDate, 
    openEditModal, 
    openGPProfile, 
    isEditMode, 
    selectedBRP, 
    selectedBlock,
    vrpMembers,
    assignVRPMember,
    unassignVRPMember,
    addVRPMember,
    updateVRPMember,
    deleteVRPMember,
    resetVRPMembersToBaseline
  } = useSocialAuditStore();

  // Tab View state
  const [activeSubTab, setActiveSubTab] = useState<'active_teams' | 'master_roster' | 'brp_supervisors'>('active_teams');

  // Copy feedback state
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Modal states
  const [assignModalBlock, setAssignModalBlock] = useState<AuditBlock | null>(null);
  const [assignSearch, setAssignSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<VRPMember | null>(null);

  // New VRP Form state
  const [newVrpData, setNewVrpData] = useState<Partial<VRPMember>>({
    empCode: '',
    name: '',
    nameHindi: '',
    mobileNo: '',
    gender: 'Male',
    qualification: 'Secondary(upto 10th std)',
    assignedBlock: null,
    aadharStatus: 'Verified',
    employeeStatus: 'Working'
  });

  // Master Roster filters & pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [blockFilter, setBlockFilter] = useState<'all' | 'Baghpat' | 'Baraut' | 'unassigned'>('all');
  const [genderFilter, setGenderFilter] = useState<'all' | 'Male' | 'Female'>('all');
  const [aadharFilter, setAadharFilter] = useState<'all' | 'Verified' | 'Not Verified'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Copy to clipboard helper
  const handleCopyPhone = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  // KPI Calculations
  const totalVRPs = vrpMembers.length;
  const baghpatActiveMembers = useMemo(() => {
    return vrpMembers.filter((m) => m.assignedBlock === 'Baghpat');
  }, [vrpMembers]);

  const barautActiveMembers = useMemo(() => {
    return vrpMembers.filter((m) => m.assignedBlock === 'Baraut');
  }, [vrpMembers]);

  const unassignedMembers = useMemo(() => {
    return vrpMembers.filter((m) => !m.assignedBlock);
  }, [vrpMembers]);

  const femaleCount = useMemo(() => {
    return vrpMembers.filter((m) => m.gender === 'Female').length;
  }, [vrpMembers]);

  const aadharVerifiedCount = useMemo(() => {
    return vrpMembers.filter((m) => m.aadharStatus === 'Verified').length;
  }, [vrpMembers]);

  // Master Roster Filtered List
  const filteredMasterRoster = useMemo(() => {
    return vrpMembers.filter((m) => {
      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = m.name.toLowerCase().includes(q) || (m.nameHindi && m.nameHindi.toLowerCase().includes(q));
        const matchPhone = m.mobileNo.includes(q);
        const matchCode = m.empCode.toLowerCase().includes(q);
        const matchQual = m.qualification.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchCode && !matchQual) return false;
      }

      // Block filter
      if (blockFilter === 'Baghpat' && m.assignedBlock !== 'Baghpat') return false;
      if (blockFilter === 'Baraut' && m.assignedBlock !== 'Baraut') return false;
      if (blockFilter === 'unassigned' && m.assignedBlock !== null) return false;

      // Gender filter
      if (genderFilter !== 'all' && m.gender !== genderFilter) return false;

      // Aadhar filter
      if (aadharFilter !== 'all' && m.aadharStatus !== aadharFilter) return false;

      return true;
    });
  }, [vrpMembers, searchQuery, blockFilter, genderFilter, aadharFilter]);

  // Paginated master roster
  const totalPages = Math.ceil(filteredMasterRoster.length / itemsPerPage) || 1;
  const paginatedMasterRoster = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMasterRoster.slice(start, start + itemsPerPage);
  }, [filteredMasterRoster, currentPage]);

  // Filter pool for assignment modal
  const availablePoolForAssign = useMemo(() => {
    return unassignedMembers.filter((m) => {
      if (!assignSearch.trim()) return true;
      const q = assignSearch.toLowerCase().trim();
      return (
        m.name.toLowerCase().includes(q) ||
        (m.nameHindi && m.nameHindi.toLowerCase().includes(q)) ||
        m.mobileNo.includes(q) ||
        m.empCode.toLowerCase().includes(q) ||
        m.qualification.toLowerCase().includes(q)
      );
    });
  }, [unassignedMembers, assignSearch]);

  // Handle Add New VRP Submission
  const handleAddNewVRP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVrpData.name || !newVrpData.mobileNo) {
      alert('कृपया कार्मिक का नाम एवं मोबाइल नंबर अवश्य भरें।');
      return;
    }

    addVRPMember({
      empCode: newVrpData.empCode || `UP-VRP-${Math.floor(10000 + Math.random() * 90000)}`,
      name: newVrpData.name.trim(),
      nameHindi: newVrpData.nameHindi?.trim() || newVrpData.name.trim(),
      gender: newVrpData.gender || 'Male',
      qualification: newVrpData.qualification || 'Secondary(upto 10th std)',
      districtName: 'BAGHPAT',
      mobileNo: newVrpData.mobileNo.trim(),
      employeeStatus: newVrpData.employeeStatus || 'Working',
      aadharStatus: newVrpData.aadharStatus || 'Verified',
      assignedBlock: newVrpData.assignedBlock || null,
      assignedRole: newVrpData.assignedBlock ? 'सक्रिय VRP सदस्य' : undefined
    });

    setIsAddModalOpen(false);
    setNewVrpData({
      empCode: '',
      name: '',
      nameHindi: '',
      mobileNo: '',
      gender: 'Male',
      qualification: 'Secondary(upto 10th std)',
      assignedBlock: null,
      aadharStatus: 'Verified',
      employeeStatus: 'Working'
    });
  };

  // Handle Edit Member Submission
  const handleSaveEditMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    updateVRPMember(editingMember.id, {
      name: editingMember.name,
      nameHindi: editingMember.nameHindi,
      mobileNo: editingMember.mobileNo,
      qualification: editingMember.qualification,
      gender: editingMember.gender,
      assignedBlock: editingMember.assignedBlock,
      aadharStatus: editingMember.aadharStatus,
      employeeStatus: editingMember.employeeStatus
    });

    setEditingMember(null);
  };

  // ==========================================================================
  // Section 3: BRP & Supervisor Data (Preserved)
  // ==========================================================================
  const effectiveRecords = useMemo(() => {
    return records.filter((r) => {
      if (!matchesBRP(r, selectedBRP)) return false;
      if (selectedBlock !== 'all' && r.block !== selectedBlock) return false;
      return true;
    });
  }, [records, selectedBRP, selectedBlock]);

  const brpDirectory = useMemo(() => {
    const map = new Map<string, {
      name: string;
      phone: string;
      isExBRP?: boolean;
      allGPs: typeof records;
      upcomingGPs: typeof records;
      completedGPs: typeof records;
    }>();

    const knownBRPs = [
      { name: 'तेजपाल', phone: '9997202522' },
      { name: 'सुदेश पाल सिंह', phone: '9117323927' },
      { name: 'राजकुमार', phone: '9760732189' },
      { name: 'ईश्वरचन्द', phone: '9759612544' },
      { name: 'हरिकिशन (पूर्व बी०आर०पी०)', phone: '8859660315', isExBRP: true }
    ];

    knownBRPs.forEach((b) => {
      map.set(b.phone, {
        name: b.name,
        phone: b.phone,
        isExBRP: b.isExBRP,
        allGPs: [],
        upcomingGPs: [],
        completedGPs: []
      });
    });

    effectiveRecords.forEach((r) => {
      const phone = r.brpPhone || '';
      if (!map.has(phone) && r.brpName) {
        map.set(phone, {
          name: r.brpName,
          phone,
          allGPs: [],
          upcomingGPs: [],
          completedGPs: []
        });
      }
      const item = map.get(phone);
      if (item) {
        item.allGPs.push(r);
        if (r.meetingDate >= asOfDate && r.status !== 'completed') {
          item.upcomingGPs.push(r);
        } else {
          item.completedGPs.push(r);
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => b.allGPs.length - a.allGPs.length);
  }, [effectiveRecords, asOfDate]);

  const filteredBrpDirectory = useMemo(() => {
    if (!selectedBRP || selectedBRP === 'all') return brpDirectory;
    return brpDirectory.filter((b) => {
      if (b.phone && selectedBRP.includes(b.phone)) return true;
      if (b.name && selectedBRP.includes(b.name)) return true;
      if (b.allGPs.some((r) => matchesBRP(r, selectedBRP))) return true;
      return false;
    });
  }, [brpDirectory, selectedBRP]);

  const supervisorDirectory = useMemo(() => {
    const map = new Map<string, typeof effectiveRecords>();
    effectiveRecords.forEach((r) => {
      const s = r.supervisorOfficerUnicode.trim();
      if (!s) return;
      if (!map.has(s)) map.set(s, []);
      map.get(s)!.push(r);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [effectiveRecords]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-5 md:p-6 shadow-md border border-slate-700/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/30">
                <Users className="w-6 h-6" />
              </span>
              <div>
                <h2 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>सोशल ऑडिट कार्मिक एवं टीम रोस्टर</span>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-semibold">
                    SAU बागपत 2026-27
                  </span>
                </h2>
                <p className="text-xs md:text-sm text-slate-300 mt-1">
                  विकास खंड बागपत एवं बड़ौत की सक्रिय सोशल ऑडिट टीमें, VRP कार्मिक पूल (135 सदस्य) एवं BRP पर्यवेक्षण
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ नया VRP जोड़ें</span>
            </button>

            <button
              onClick={() => exportVRPRosterExcel(vrpMembers)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 text-xs font-bold rounded-xl transition shadow-sm border border-slate-600 cursor-pointer"
              title="समस्त 135 VRP रोस्टर को एक्सेल फाइल में डाउनलोड करें"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>एक्सेल (.xlsx) डाउनलोड</span>
            </button>

            <button
              onClick={() => {
                if (confirm('क्या आप VRP रोस्टर को मूल स्थिति (135 रिकॉर्ड) पर रीसेट करना चाहते हैं?')) {
                  resetVRPMembersToBaseline();
                }
              }}
              className="p-2 text-slate-400 hover:text-rose-300 hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title="मूल डेटा रीसेट करें"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Executive KPI Metric Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-slate-700/80">
          <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl">
            <div className="text-[11px] text-slate-400 font-medium">कुल VRP कार्मिक</div>
            <div className="text-xl md:text-2xl font-black text-white mt-0.5">{totalVRPs}</div>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
              <span>SAU मास्टर रोस्टर</span>
            </div>
          </div>

          <div className="bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-xl">
            <div className="text-[11px] text-emerald-300 font-medium flex items-center justify-between">
              <span>बागपत सक्रिय</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="text-xl md:text-2xl font-black text-emerald-200 mt-0.5">
              {baghpatActiveMembers.length} <span className="text-xs font-normal text-emerald-400/80">सदस्य</span>
            </div>
            <div className="text-[10px] text-emerald-400/90 mt-1">44 ग्राम पंचायतें</div>
          </div>

          <div className="bg-indigo-950/40 border border-indigo-500/30 p-3 rounded-xl">
            <div className="text-[11px] text-indigo-300 font-medium flex items-center justify-between">
              <span>बड़ौत सक्रिय</span>
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
            </div>
            <div className="text-xl md:text-2xl font-black text-indigo-200 mt-0.5">
              {barautActiveMembers.length} <span className="text-xs font-normal text-indigo-400/80">सदस्य</span>
            </div>
            <div className="text-[10px] text-indigo-400/90 mt-1">44 ग्राम पंचायतें</div>
          </div>

          <div className="bg-amber-950/40 border border-amber-500/30 p-3 rounded-xl">
            <div className="text-[11px] text-amber-300 font-medium">रिज़र्व पूल (उपलब्ध)</div>
            <div className="text-xl md:text-2xl font-black text-amber-200 mt-0.5">
              {unassignedMembers.length} <span className="text-xs font-normal text-amber-400/80">कार्मिक</span>
            </div>
            <div className="text-[10px] text-amber-400/80 mt-1">टीम आवंटन हेतु तैयार</div>
          </div>

          <div className="bg-purple-950/40 border border-purple-500/30 p-3 rounded-xl">
            <div className="text-[11px] text-purple-300 font-medium">महिला VRPs</div>
            <div className="text-xl md:text-2xl font-black text-purple-200 mt-0.5">
              {femaleCount} <span className="text-xs font-normal text-purple-400/80">({Math.round((femaleCount / totalVRPs) * 100)}%)</span>
            </div>
            <div className="text-[10px] text-purple-400/80 mt-1">महिला सहभागिता</div>
          </div>

          <div className="bg-teal-950/40 border border-teal-500/30 p-3 rounded-xl">
            <div className="text-[11px] text-teal-300 font-medium">आधार सत्यापित</div>
            <div className="text-xl md:text-2xl font-black text-teal-200 mt-0.5">
              {aadharVerifiedCount} <span className="text-xs font-normal text-teal-400/80">({Math.round((aadharVerifiedCount / totalVRPs) * 100)}%)</span>
            </div>
            <div className="text-[10px] text-teal-400/80 mt-1">बायोमेट्रिक प्रमाणित</div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1.5 shadow-sm gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('active_teams')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs md:text-sm font-bold transition whitespace-nowrap cursor-pointer ${
            activeSubTab === 'active_teams'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>🟢 ब्लॉक सक्रिय टीमें (Baghpat & Baraut Teams)</span>
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${
            activeSubTab === 'active_teams' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            {baghpatActiveMembers.length + barautActiveMembers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('master_roster')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs md:text-sm font-bold transition whitespace-nowrap cursor-pointer ${
            activeSubTab === 'master_roster'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>📋 समस्त VRP रोस्टर (135 कार्मिक मास्टर सूची)</span>
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${
            activeSubTab === 'master_roster' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            {totalVRPs}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('brp_supervisors')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs md:text-sm font-bold transition whitespace-nowrap cursor-pointer ${
            activeSubTab === 'brp_supervisors'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>👔 बी०आर०पी० एवं पर्यवेक्षक अधिकारी (BRP & Supervisors)</span>
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${
            activeSubTab === 'brp_supervisors' ? 'bg-purple-800 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            {filteredBrpDirectory.length}
          </span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* SUB-TAB 1: ब्लॉक सक्रिय टीमें (Active Teams View) */}
      {/* ===================================================================== */}
      {activeSubTab === 'active_teams' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* 1. Baghpat Block Active Team */}
            <div className="bg-white rounded-2xl border-2 border-emerald-500/40 shadow-sm overflow-hidden flex flex-col">
              {/* Block Header */}
              <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white p-4 sm:p-5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-emerald-600/60 rounded-lg text-white">
                      <Building2 className="w-5 h-5" />
                    </span>
                    <h3 className="text-lg font-black tracking-tight">विकास खण्ड: बागपत</h3>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 bg-white/20 rounded-full text-emerald-100">
                      सक्रिय टीम: {baghpatActiveMembers.length} सदस्य
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100/90 mt-1">
                    44 ग्राम पंचायतों के सोशल ऑडिट संचालन हेतु अधिकृत फील्ड कार्मिक
                  </p>
                </div>

                <button
                  onClick={() => {
                    setAssignModalBlock('Baghpat');
                    setAssignSearch('');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-xs rounded-xl shadow transition cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-emerald-700" />
                  <span>+ सदस्य जोड़ें</span>
                </button>
              </div>

              {/* Members List */}
              <div className="p-4 sm:p-5 space-y-3 flex-1 bg-slate-50/50">
                {baghpatActiveMembers.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 p-6">
                    <UserX className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">बागपत टीम में वर्तमान में कोई सदस्य सक्रिय नहीं है।</p>
                    <p className="text-xs text-slate-500 mt-1">ऊपर दिए गए "+ सदस्य जोड़ें" बटन से रिज़र्व पूल से सदस्यों को शामिल करें।</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {baghpatActiveMembers.map((member, idx) => (
                      <div
                        key={member.id}
                        className="bg-white rounded-xl border border-emerald-100 hover:border-emerald-300 p-3.5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between group relative"
                      >
                        <div>
                          {/* Card Top Row: S.No, Status, Actions */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-mono text-xs font-black flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                {member.empCode}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              {member.aadharStatus === 'Verified' ? (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>आधार</span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                  लंबित
                                </span>
                              )}

                              <button
                                onClick={() => setEditingMember(member)}
                                className="p-1 text-slate-400 hover:text-blue-600 rounded transition cursor-pointer"
                                title="विवरण संशोधित करें"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  if (confirm(`क्या आप ${member.nameHindi || member.name} को बागपत सक्रिय टीम से हटाकर रिज़र्व पूल में वापस भेजना चाहते हैं?`)) {
                                    unassignVRPMember(member.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                title="टीम से हटाएं (रिज़र्व पूल में भेजें)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Member Name */}
                          <div className="mt-1">
                            <h4 className="text-base font-black text-slate-900 leading-tight">
                              {member.nameHindi || member.name}
                            </h4>
                            {member.nameHindi && member.name !== member.nameHindi && (
                              <p className="text-xs text-slate-500 font-medium">{member.name}</p>
                            )}
                          </div>

                          {/* Mobile Number - Prominently Displayed */}
                          <div className="mt-2.5 p-2 bg-emerald-50/70 rounded-lg border border-emerald-100 flex items-center justify-between">
                            <a
                              href={`tel:${member.mobileNo}`}
                              className="flex items-center gap-2 text-emerald-900 hover:text-emerald-700 font-mono font-black text-sm tracking-wide"
                              title="सीधे कॉल करें"
                            >
                              <span className="p-1 bg-emerald-200/80 text-emerald-800 rounded">
                                <PhoneCall className="w-3.5 h-3.5" />
                              </span>
                              <span>{member.mobileNo}</span>
                            </a>

                            <button
                              onClick={(e) => handleCopyPhone(member.mobileNo, e)}
                              className="p-1 text-emerald-700 hover:bg-emerald-200 rounded transition text-xs font-semibold cursor-pointer"
                              title="नंबर कॉपी करें"
                            >
                              {copiedPhone === member.mobileNo ? (
                                <span className="text-[10px] text-emerald-700 font-bold">कॉपी!</span>
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          {/* Details tags */}
                          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {member.gender === 'Female' ? 'महिला' : 'पुरुष'}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 truncate max-w-[190px]" title={member.qualification}>
                              {member.qualification}
                            </span>
                          </div>
                        </div>

                        {/* Card Footer Action */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>बागपत टीम</span>
                          </span>

                          <button
                            onClick={() => {
                              if (confirm(`क्या आप ${member.nameHindi || member.name} को बागपत टीम से हटाना चाहते हैं?`)) {
                                unassignVRPMember(member.id);
                              }
                            }}
                            className="text-[11px] text-rose-600 hover:text-rose-800 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                            <span>टीम से हटाएं</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 2. Baraut Block Active Team */}
            <div className="bg-white rounded-2xl border-2 border-indigo-500/40 shadow-sm overflow-hidden flex flex-col">
              {/* Block Header */}
              <div className="bg-gradient-to-r from-indigo-800 to-blue-900 text-white p-4 sm:p-5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-indigo-700/60 rounded-lg text-white">
                      <Building2 className="w-5 h-5" />
                    </span>
                    <h3 className="text-lg font-black tracking-tight">विकास खण्ड: बड़ौत</h3>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 bg-white/20 rounded-full text-indigo-100">
                      सक्रिय टीम: {barautActiveMembers.length} सदस्य
                    </span>
                  </div>
                  <p className="text-xs text-indigo-100/90 mt-1">
                    44 ग्राम पंचायतों के सोशल ऑडिट संचालन हेतु अधिकृत फील्ड कार्मिक
                  </p>
                </div>

                <button
                  onClick={() => {
                    setAssignModalBlock('Baraut');
                    setAssignSearch('');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs rounded-xl shadow transition cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-indigo-700" />
                  <span>+ सदस्य जोड़ें</span>
                </button>
              </div>

              {/* Members List */}
              <div className="p-4 sm:p-5 space-y-3 flex-1 bg-slate-50/50">
                {barautActiveMembers.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 p-6">
                    <UserX className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">बड़ौत टीम में वर्तमान में कोई सदस्य सक्रिय नहीं है।</p>
                    <p className="text-xs text-slate-500 mt-1">ऊपर दिए गए "+ सदस्य जोड़ें" बटन से रिज़र्व पूल से सदस्यों को शामिल करें।</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {barautActiveMembers.map((member, idx) => (
                      <div
                        key={member.id}
                        className="bg-white rounded-xl border border-indigo-100 hover:border-indigo-300 p-3.5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between group relative"
                      >
                        <div>
                          {/* Card Top Row: S.No, Status, Actions */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 font-mono text-xs font-black flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                {member.empCode}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              {member.aadharStatus === 'Verified' ? (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>आधार</span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                  लंबित
                                </span>
                              )}

                              <button
                                onClick={() => setEditingMember(member)}
                                className="p-1 text-slate-400 hover:text-blue-600 rounded transition cursor-pointer"
                                title="विवरण संशोधित करें"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  if (confirm(`क्या आप ${member.nameHindi || member.name} को बड़ौत सक्रिय टीम से हटाकर रिज़र्व पूल में वापस भेजना चाहते हैं?`)) {
                                    unassignVRPMember(member.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                title="टीम से हटाएं (रिज़र्व पूल में भेजें)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Member Name */}
                          <div className="mt-1">
                            <h4 className="text-base font-black text-slate-900 leading-tight">
                              {member.nameHindi || member.name}
                            </h4>
                            {member.nameHindi && member.name !== member.nameHindi && (
                              <p className="text-xs text-slate-500 font-medium">{member.name}</p>
                            )}
                          </div>

                          {/* Mobile Number - Prominently Displayed */}
                          <div className="mt-2.5 p-2 bg-indigo-50/70 rounded-lg border border-indigo-100 flex items-center justify-between">
                            <a
                              href={`tel:${member.mobileNo}`}
                              className="flex items-center gap-2 text-indigo-950 hover:text-indigo-700 font-mono font-black text-sm tracking-wide"
                              title="सीधे कॉल करें"
                            >
                              <span className="p-1 bg-indigo-200/80 text-indigo-900 rounded">
                                <PhoneCall className="w-3.5 h-3.5" />
                              </span>
                              <span>{member.mobileNo}</span>
                            </a>

                            <button
                              onClick={(e) => handleCopyPhone(member.mobileNo, e)}
                              className="p-1 text-indigo-700 hover:bg-indigo-200 rounded transition text-xs font-semibold cursor-pointer"
                              title="नंबर कॉपी करें"
                            >
                              {copiedPhone === member.mobileNo ? (
                                <span className="text-[10px] text-indigo-700 font-bold">कॉपी!</span>
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          {/* Details tags */}
                          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {member.gender === 'Female' ? 'महिला' : 'पुरुष'}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 truncate max-w-[190px]" title={member.qualification}>
                              {member.qualification}
                            </span>
                          </div>
                        </div>

                        {/* Card Footer Action */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] text-indigo-700 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                            <span>बड़ौत टीम</span>
                          </span>

                          <button
                            onClick={() => {
                              if (confirm(`क्या आप ${member.nameHindi || member.name} को बड़ौत टीम से हटाना चाहते हैं?`)) {
                                unassignVRPMember(member.id);
                              }
                            }}
                            className="text-[11px] text-rose-600 hover:text-rose-800 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                            <span>टीम से हटाएं</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-TAB 2: समस्त VRP रोस्टर (Master Directory - 135 कार्मिक) */}
      {/* ===================================================================== */}
      {activeSubTab === 'master_roster' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-base md:text-lg font-black text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>जनपद बागपत समस्त VRP कार्मिक रजिस्टर</span>
                <span className="text-xs bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded-full font-bold">
                  {filteredMasterRoster.length} / {totalVRPs}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                सोशल ऑडिट यूनिट (SAU) पोर्टल से प्राप्त 135 कार्मिकों का संपूर्ण डाटा, योग्यता, संपर्क व टीम आवंटन स्थिति
              </p>
            </div>

            <button
              onClick={() => exportVRPRosterExcel(filteredMasterRoster, blockFilter === 'all' ? 'समस्त रोस्टर' : blockFilter)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer self-start lg:self-auto"
            >
              <Download className="w-4 h-4" />
              <span>सूची एक्सेल में डाउनलोड करें</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="नाम, मोबाइल नंबर, कार्मिक कोड या योग्यता खोजें..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Block Filter Pills */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-300 text-xs">
              <span className="text-[11px] text-slate-500 font-semibold px-2">आवंटन:</span>
              <button
                onClick={() => { setBlockFilter('all'); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${
                  blockFilter === 'all' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                सभी ({totalVRPs})
              </button>
              <button
                onClick={() => { setBlockFilter('Baghpat'); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${
                  blockFilter === 'Baghpat' ? 'bg-emerald-700 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                बागपत ({baghpatActiveMembers.length})
              </button>
              <button
                onClick={() => { setBlockFilter('Baraut'); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${
                  blockFilter === 'Baraut' ? 'bg-indigo-700 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                बड़ौत ({barautActiveMembers.length})
              </button>
              <button
                onClick={() => { setBlockFilter('unassigned'); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${
                  blockFilter === 'unassigned' ? 'bg-amber-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                रिज़र्व पूल ({unassignedMembers.length})
              </button>
            </div>

            {/* Gender Filter */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-300 text-xs">
              <span className="text-[11px] text-slate-500 font-semibold px-2">लिंग:</span>
              <select
                value={genderFilter}
                onChange={(e) => { setGenderFilter(e.target.value as any); setCurrentPage(1); }}
                className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">सभी</option>
                <option value="Male">पुरुष</option>
                <option value="Female">महिला</option>
              </select>
            </div>

            {/* Aadhar Filter */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-300 text-xs">
              <span className="text-[11px] text-slate-500 font-semibold px-2">आधार:</span>
              <select
                value={aadharFilter}
                onChange={(e) => { setAadharFilter(e.target.value as any); setCurrentPage(1); }}
                className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">सभी</option>
                <option value="Verified">सत्यापित</option>
                <option value="Not Verified">लंबित</option>
              </select>
            </div>
          </div>

          {/* Master Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
            <table className="w-full text-left border-collapse text-xs min-w-[750px]">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">क्र०</th>
                  <th className="py-2.5 px-3 w-32">कार्मिक कोड</th>
                  <th className="py-2.5 px-3">नाम (हिंदी / English)</th>
                  <th className="py-2.5 px-3 w-40">मोबाइल नंबर</th>
                  <th className="py-2.5 px-3 w-20 text-center">लिंग</th>
                  <th className="py-2.5 px-3">योग्यता</th>
                  <th className="py-2.5 px-3 w-28 text-center">आधार स्थिति</th>
                  <th className="py-2.5 px-3 w-36 text-center">सक्रिय टीम आवंटन</th>
                  <th className="py-2.5 px-3 w-28 text-center">क्रिया</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {paginatedMasterRoster.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-slate-500">
                      कोई कार्मिक रिकॉर्ड नहीं मिला। फ़िल्टर बदल कर देखें।
                    </td>
                  </tr>
                ) : (
                  paginatedMasterRoster.map((member, index) => {
                    const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
                    return (
                      <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{rowNumber}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">
                          {member.empCode}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{member.nameHindi || member.name}</div>
                          {member.nameHindi && member.name !== member.nameHindi && (
                            <div className="text-[11px] text-slate-500">{member.name}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5 font-mono">
                            <a
                              href={`tel:${member.mobileNo}`}
                              className="text-blue-700 hover:text-blue-900 hover:underline font-bold"
                            >
                              {member.mobileNo}
                            </a>
                            <button
                              onClick={(e) => handleCopyPhone(member.mobileNo, e)}
                              className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                              title="कॉपी करें"
                            >
                              {copiedPhone === member.mobileNo ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            member.gender === 'Female' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {member.gender === 'Female' ? 'महिला' : 'पुरुष'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate" title={member.qualification}>
                          {member.qualification}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {member.aadharStatus === 'Verified' ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>सत्यापित</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              लंबित
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <select
                            value={member.assignedBlock || 'unassigned'}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'unassigned') {
                                unassignVRPMember(member.id);
                              } else {
                                assignVRPMember(member.id, val as AuditBlock);
                              }
                            }}
                            className={`text-[11px] font-bold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                              member.assignedBlock === 'Baghpat'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : member.assignedBlock === 'Baraut'
                                ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                                : 'bg-slate-50 text-slate-600 border-slate-300'
                            }`}
                          >
                            <option value="unassigned">रिज़र्व पूल</option>
                            <option value="Baghpat">बागपत सक्रिय</option>
                            <option value="Baraut">बड़ौत सक्रिय</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setEditingMember(member)}
                              className="p-1 text-slate-500 hover:text-indigo-600 rounded transition cursor-pointer"
                              title="संशोधित करें"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`क्या आप ${member.nameHindi || member.name} को रोस्टर से हटाना चाहते हैं?`)) {
                                  deleteVRPMember(member.id);
                                }
                              }}
                              className="p-1 text-slate-500 hover:text-rose-600 rounded transition cursor-pointer"
                              title="हटाएं"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
              <div>
                दिखाए जा रहे हैं {(currentPage - 1) * itemsPerPage + 1} से {Math.min(currentPage * itemsPerPage, filteredMasterRoster.length)} कुल {filteredMasterRoster.length} में से
              </div>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>पिछला</span>
                </button>
                <span className="px-3 font-mono font-bold text-slate-800">
                  {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 cursor-pointer flex items-center gap-1"
                >
                  <span>अगला</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-TAB 3: बी०आर०पी० एवं पर्यवेक्षक अधिकारी (Preserved) */}
      {/* ===================================================================== */}
      {activeSubTab === 'brp_supervisors' && (
        <div className="space-y-6">
          {/* Section 1: Block Resource Persons (BRPs) */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base md:text-lg font-black text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-600" />
                  <span>ब्लॉक रिसोर्स पर्सन (BRP) रोस्टर एवं संपर्क विवरण</span>
                </h3>
                <p className="text-xs text-slate-600">
                  सोशल ऑडिट का संचालन करने वाले मुख्य बी०आर०पी० एवं उनकी आवंटित ग्राम पंचायतें
                </p>
              </div>
            </div>

            {filteredBrpDirectory.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 border border-slate-200 rounded-2xl p-6 text-sm text-slate-500">
                चयनित बी०आर०पी० के लिए कोई रिकॉर्ड उपलब्ध नहीं है।
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBrpDirectory.map((brp) => (
                  <div
                    key={brp.phone || brp.name}
                    className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between ${
                      brp.isExBRP
                        ? 'bg-slate-50 border-slate-200 opacity-80'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center font-black text-base">
                          {brp.name.charAt(0)}
                        </div>

                        {brp.isExBRP ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                            कार्यमुक्त / स्थानांतरित
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            सक्रिय BRP
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-bold text-slate-900">{brp.name}</h4>
                      {brp.phone && (
                        <a
                          href={`tel:${brp.phone}`}
                          className="inline-flex items-center gap-1.5 text-xs text-blue-700 hover:underline font-mono mt-1 font-bold"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{brp.phone}</span>
                        </a>
                      )}

                      {/* KPI numbers */}
                      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <div className="text-[10px] text-slate-500 font-medium">कुल सभाएं</div>
                          <div className="text-base font-bold text-slate-900 mt-0.5">{brp.allGPs.length}</div>
                        </div>
                        <div className="bg-blue-50/60 p-2 rounded-xl border border-blue-100">
                          <div className="text-[10px] text-blue-700 font-medium">आगामी</div>
                          <div className="text-base font-bold text-blue-800 mt-0.5">{brp.upcomingGPs.length}</div>
                        </div>
                        <div className="bg-emerald-50/60 p-2 rounded-xl border border-emerald-100">
                          <div className="text-[10px] text-emerald-700 font-medium">सम्पन्न</div>
                          <div className="text-base font-bold text-emerald-800 mt-0.5">{brp.completedGPs.length}</div>
                        </div>
                      </div>

                      {/* Assigned GPs preview */}
                      <div className="mt-3">
                        <div className="text-[11px] font-semibold text-slate-600 mb-1">आवंटित ग्राम पंचायतें:</div>
                        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto scrollbar-none">
                          {brp.allGPs.map((gp) => (
                            <span
                              key={gp.id}
                              onClick={() => (isEditMode ? openEditModal(gp) : openGPProfile(gp))}
                              className={`text-[10px] px-2 py-0.5 rounded cursor-pointer transition-colors border ${
                                gp.isAmended
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                              }`}
                              title={
                                isEditMode 
                                  ? `${gp.gpNameUnicode} (${gp.blockHindi}) - विवरण संपादित करें` 
                                  : `${gp.gpNameUnicode} (${gp.blockHindi}) - प्रोफाइल विवरण देखें`
                              }
                            >
                              {gp.gpNameUnicode}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: District Level Supervisory Officers */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-3">
            <div>
              <h3 className="text-base md:text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                <span>जनपद स्तरीय पर्यवेक्षक अधिकारी सूची (Supervisory Officers)</span>
              </h3>
              <p className="text-xs text-slate-600">
                सोशल ऑडिट बैठकों में जनपद स्तर से नामित नोडल/पर्यवेक्षक अधिकारी
              </p>
            </div>

            {/* Master Supervisory Table */}
            <div className="w-full space-y-2">
              <div className="overflow-x-auto max-h-80 scrollbar-thin rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left border-collapse text-xs min-w-[550px]">
                  <thead className="bg-slate-100 text-slate-700 sticky top-0 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center">क्र०</th>
                      <th className="py-2.5 px-3">पर्यवेक्षक अधिकारी का पदनाम / विभाग</th>
                      <th className="py-2.5 px-3 text-center">आवंटित बैठकें</th>
                      <th className="py-2.5 px-3">ग्राम पंचायतें</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {supervisorDirectory.map(([officer, gps], i) => (
                      <tr key={officer} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{i + 1}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{officer}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-purple-700 font-mono">
                          {gps.length}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-wrap gap-1 max-w-xl">
                            {gps.map((gp) => (
                              <span
                                key={gp.id}
                                className="text-[10px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-700"
                              >
                                {gp.gpNameUnicode} ({gp.meetingDate.slice(5)})
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: Assign Member from Pool to Block Modal */}
      {/* ===================================================================== */}
      {assignModalBlock && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className={`p-5 text-white flex items-center justify-between ${
              assignModalBlock === 'Baghpat' ? 'bg-gradient-to-r from-emerald-700 to-teal-800' : 'bg-gradient-to-r from-indigo-800 to-blue-900'
            }`}>
              <div>
                <h3 className="text-lg font-black flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  <span>
                    विकास खण्ड {assignModalBlock === 'Baghpat' ? 'बागपत' : 'बड़ौत'} की सक्रिय टीम में सदस्य जोड़ें
                  </span>
                </h3>
                <p className="text-xs text-white/80 mt-1">
                  रिज़र्व पूल में उपलब्ध {unassignedMembers.length} कार्मिकों में से चयन करें
                </p>
              </div>

              <button
                onClick={() => setAssignModalBlock(null)}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={assignSearch}
                  onChange={(e) => setAssignSearch(e.target.value)}
                  placeholder="रिज़र्व पूल में नाम, मोबाइल नंबर या कोड खोजें..."
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Available Members List */}
            <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100">
              {availablePoolForAssign.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  {unassignedMembers.length === 0 
                    ? 'रिज़र्व पूल में कोई कार्मिक उपलब्ध नहीं है।' 
                    : 'खोजे गए शब्दों से कोई कार्मिक मेल नहीं खाता।'}
                </div>
              ) : (
                availablePoolForAssign.map((member) => (
                  <div key={member.id} className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50 px-2 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {member.nameHindi || member.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                          {member.empCode}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          member.gender === 'Female' ? 'bg-purple-50 text-purple-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {member.gender === 'Female' ? 'महिला' : 'पुरुष'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-mono">
                        <span className="font-semibold text-slate-700">{member.mobileNo}</span>
                        <span>•</span>
                        <span className="truncate max-w-xs">{member.qualification}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        assignVRPMember(member.id, assignModalBlock);
                      }}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg text-white transition shadow-sm cursor-pointer whitespace-nowrap ${
                        assignModalBlock === 'Baghpat'
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>टीम में शामिल करें</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-between items-center text-xs">
              <span className="text-slate-500">
                वर्तमान में उपलब्ध: <strong className="text-slate-800">{availablePoolForAssign.length}</strong> कार्मिक
              </span>
              <button
                onClick={() => setAssignModalBlock(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition cursor-pointer"
              >
                पूर्ण हुआ / बंद करें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: Add New VRP Modal */}
      {/* ===================================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <h3 className="text-lg font-black flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <span>नया VRP कार्मिक पंजीकृत करें</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewVRP} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">कार्मिक कोड (Emp Code):</label>
                  <input
                    type="text"
                    value={newVrpData.empCode}
                    onChange={(e) => setNewVrpData({ ...newVrpData, empCode: e.target.value })}
                    placeholder="उदा. UP-VRP-26735"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">मोबाइल नंबर * :</label>
                  <input
                    type="tel"
                    required
                    value={newVrpData.mobileNo}
                    onChange={(e) => setNewVrpData({ ...newVrpData, mobileNo: e.target.value })}
                    placeholder="10 अंकों का मोबाइल नं०"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">नाम (English) * :</label>
                  <input
                    type="text"
                    required
                    value={newVrpData.name}
                    onChange={(e) => setNewVrpData({ ...newVrpData, name: e.target.value })}
                    placeholder="उदा. RAMESH KUMAR"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">नाम (हिन्दी):</label>
                  <input
                    type="text"
                    value={newVrpData.nameHindi}
                    onChange={(e) => setNewVrpData({ ...newVrpData, nameHindi: e.target.value })}
                    placeholder="उदा. रमेश कुमार"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">लिंग:</label>
                  <select
                    value={newVrpData.gender}
                    onChange={(e) => setNewVrpData({ ...newVrpData, gender: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Male">पुरुष (Male)</option>
                    <option value="Female">महिला (Female)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">योग्यता (Qualification):</label>
                  <input
                    type="text"
                    value={newVrpData.qualification}
                    onChange={(e) => setNewVrpData({ ...newVrpData, qualification: e.target.value })}
                    placeholder="उदा. Graduate / Secondary"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">सक्रिय टीम आवंटन:</label>
                  <select
                    value={newVrpData.assignedBlock || ''}
                    onChange={(e) => setNewVrpData({ ...newVrpData, assignedBlock: e.target.value ? (e.target.value as AuditBlock) : null })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium"
                  >
                    <option value="">रिज़र्व पूल (आवंटित नहीं)</option>
                    <option value="Baghpat">बागपत सक्रिय टीम</option>
                    <option value="Baraut">बड़ौत सक्रिय टीम</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">आधार सत्यापन स्थिति:</label>
                  <select
                    value={newVrpData.aadharStatus}
                    onChange={(e) => setNewVrpData({ ...newVrpData, aadharStatus: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Verified">सत्यापित (Verified)</option>
                    <option value="Not Verified">लंबित (Not Verified)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition shadow cursor-pointer"
                >
                  सुरक्षित करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: Edit VRP Modal */}
      {/* ===================================================================== */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-indigo-400" />
                  <span>VRP कार्मिक विवरण संशोधन</span>
                </h3>
                <p className="text-xs text-white/70 font-mono mt-0.5">{editingMember.empCode}</p>
              </div>
              <button
                onClick={() => setEditingMember(null)}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditMember} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">नाम (English):</label>
                  <input
                    type="text"
                    required
                    value={editingMember.name}
                    onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">नाम (हिन्दी):</label>
                  <input
                    type="text"
                    value={editingMember.nameHindi || ''}
                    onChange={(e) => setEditingMember({ ...editingMember, nameHindi: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">मोबाइल नंबर:</label>
                  <input
                    type="tel"
                    required
                    value={editingMember.mobileNo}
                    onChange={(e) => setEditingMember({ ...editingMember, mobileNo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">सक्रिय टीम आवंटन:</label>
                  <select
                    value={editingMember.assignedBlock || ''}
                    onChange={(e) => setEditingMember({
                      ...editingMember,
                      assignedBlock: e.target.value ? (e.target.value as AuditBlock) : null
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
                  >
                    <option value="">रिज़र्व पूल (Unassigned)</option>
                    <option value="Baghpat">बागपत सक्रिय टीम</option>
                    <option value="Baraut">बड़ौत सक्रिय टीम</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">लिंग:</label>
                  <select
                    value={editingMember.gender}
                    onChange={(e) => setEditingMember({ ...editingMember, gender: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Male">पुरुष</option>
                    <option value="Female">महिला</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">आधार स्थिति:</label>
                  <select
                    value={editingMember.aadharStatus}
                    onChange={(e) => setEditingMember({ ...editingMember, aadharStatus: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Verified">सत्यापित</option>
                    <option value="Not Verified">लंबित</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">योग्यता (Qualification):</label>
                <input
                  type="text"
                  value={editingMember.qualification}
                  onChange={(e) => setEditingMember({ ...editingMember, qualification: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition shadow cursor-pointer"
                >
                  संशोधन सुरक्षित करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
