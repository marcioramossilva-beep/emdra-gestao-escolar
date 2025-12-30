
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Calendar as CalendarIcon, 
  CheckSquare, 
  DollarSign, 
  FileSearch, 
  LogOut, 
  Menu, 
  X,
  Plus,
  Trash2,
  Printer,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  AlertCircle,
  Clock,
  Briefcase,
  Search,
  BookOpen,
  UserCog,
  ShieldCheck,
  MessagesSquare,
  Target,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Activity,
  TrendingUp,
  UserCheck,
  PieChart as PieChartIcon,
  Zap,
  GraduationCap,
  HardHat,
  Stethoscope,
  CookingPot,
  Wrench,
  Library,
  DoorOpen,
  Keyboard,
  Brush,
  User as UserIcon,
  ArrowUpCircle,
  ArrowDownCircle,
  Download,
  Info,
  CalendarDays,
  FileBadge
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { 
  User, 
  UserRole, 
  Occurrence, 
  AttendanceRecord, 
  Demand, 
  Goal,
  SchoolEvent, 
  FinanceRecord, 
  Document,
  OccurrenceType,
  OccurrenceNature,
  ParentMeeting,
  StaffMember
} from './types.ts';
import { 
  OCCURRENCE_REASONS, 
  IMMEDIATE_ACTIONS,
  MANAGEMENT_DECISIONS,
  SHIFTS, 
  ATTENDANCE_TYPES, 
  DOCUMENT_CATEGORIES, 
  EVENT_COLORS,
  STAFF_ROLES
} from './constants.tsx';
import { getGeminiInsights } from './services/geminiService.ts';

// --- Reusable Components ---

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; maxWidth?: string }> = ({ isOpen, onClose, title, children, maxWidth = "max-w-2xl" }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 no-print backdrop-blur-sm">
      <div className={`bg-white rounded-3xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto transform transition-all border border-slate-200`}>
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
};

const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-6 right-6 px-8 py-4 rounded-2xl shadow-2xl text-white z-[100] transition-all transform animate-in slide-in-from-right fade-in duration-300 flex items-center gap-4 ${type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
      {type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
      <span className="font-bold text-sm tracking-wide">{message}</span>
    </div>
  );
};

// --- Main Application ---

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('emdra_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  
  const [appUsers, setAppUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('emdra_app_users');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [{ id: 'admin-01', name: 'Direção', pin: '1500', role: UserRole.ADMIN }];
  });

  const [loginForm, setLoginForm] = useState({ name: '', pin: '' });
  
  const [occurrences, setOccurrences] = useState<Occurrence[]>(() => {
    try { return JSON.parse(localStorage.getItem('emdra_occurrences') || '[]'); } catch { return []; }
  });
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    try { return JSON.parse(localStorage.getItem('emdra_attendance') || '[]'); } catch { return []; }
  });
  const [demands, setDemands] = useState<Demand[]>(() => {
    try { return JSON.parse(localStorage.getItem('emdra_demands') || '[]'); } catch { return []; }
  });
  const [goals, setGoals] = useState<Goal[]>(() => {
    try { return JSON.parse(localStorage.getItem('emdra_goals') || '[]'); } catch { return []; }
  });
  const [events, setEvents] = useState<SchoolEvent[]>(() => {
    try { return JSON.parse(localStorage.getItem('emdra_events') || '[]'); } catch { return []; }
  });
  const [finances, setFinances] = useState<FinanceRecord[]>(() => {
    try { return JSON.parse(localStorage.getItem('emdra_finances') || '[]'); } catch { return []; }
  });
  const [documents, setDocuments] = useState<Document[]>(() => {
    try { return JSON.parse(localStorage.getItem('emdra_documents') || '[]'); } catch { return []; }
  });
  const [students, setStudents] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('emdra_students') || '["Ana Silva", "Bruno Santos", "Carla Oliveira"]'); } catch { return ["Ana Silva"]; }
  });
  const [teachers, setTeachers] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('emdra_teachers') || '["Prof. Renato", "Profª. Márcia"]'); } catch { return ["Prof. Renato"]; }
  });
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(() => {
    try { return JSON.parse(localStorage.getItem('emdra_staff_members') || '[]'); } catch { return []; }
  });
  const [meetings, setMeetings] = useState<ParentMeeting[]>(() => {
    try { return JSON.parse(localStorage.getItem('emdra_meetings') || '[]'); } catch { return []; }
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [aiInsight, setAiInsight] = useState<string>('O EMDRA está analisando o clima escolar...');
  
  const [selectedOccurrence, setSelectedOccurrence] = useState<Occurrence | null>(null);
  const [selectedHistoryStudent, setSelectedHistoryStudent] = useState<string | null>(null);

  useEffect(() => {
    const data = { 
      emdra_app_users: appUsers, emdra_occurrences: occurrences, emdra_attendance: attendance, 
      emdra_demands: demands, emdra_goals: goals, emdra_events: events, emdra_finances: finances, 
      emdra_documents: documents, emdra_students: students, emdra_teachers: teachers, 
      emdra_staff_members: staffMembers, emdra_meetings: meetings 
    };
    Object.entries(data).forEach(([key, val]) => localStorage.setItem(key, JSON.stringify(val)));
  }, [appUsers, occurrences, attendance, demands, goals, events, finances, documents, students, teachers, staffMembers, meetings]);

  useEffect(() => {
    if (currentUser && activeTab === 'dashboard' && occurrences.length > 0) {
      getGeminiInsights(occurrences).then(setAiInsight).catch(() => setAiInsight('Não foi possível gerar insights agora.'));
    }
  }, [occurrences, currentUser, activeTab]);

  const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = appUsers.find(u => u.name.toLowerCase() === loginForm.name.toLowerCase() && u.pin === loginForm.pin);
    if (found) {
      setCurrentUser(found);
      localStorage.setItem('emdra_user', JSON.stringify(found));
      showToast(`Bem-vindo, ${found.name}!`, 'success');
    } else {
      showToast('Usuário ou PIN incorretos.', 'error');
    }
  };

  const isAdmin = currentUser?.role === UserRole.ADMIN;
  const isManagement = currentUser?.role === UserRole.MANAGEMENT || isAdmin;

  const stats = useMemo(() => {
    const totalDemands = demands.length;
    const completedDemands = demands.filter(d => d.completed).length;
    const demandProgress = totalDemands ? Math.round((completedDemands / totalDemands) * 100) : 0;

    const occurrencesData = [
      { name: 'Pedagógica', count: occurrences.filter(o => o.type === OccurrenceType.PEDAGOGICAL).length },
      { name: 'Comportamental', count: occurrences.filter(o => o.type === OccurrenceType.BEHAVIORAL).length },
      { name: 'Grave', count: occurrences.filter(o => o.type === OccurrenceType.SERIOUS).length },
    ];

    return { demandProgress, occurrencesData, totalDemands, completedDemands };
  }, [demands, occurrences]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white p-12 rounded-[40px] shadow-2xl w-full max-w-md border border-slate-100">
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20">
              <BookOpen className="text-white w-10 h-10" />
            </div>
            <h1 className="text-5xl font-black text-slate-800 tracking-tighter">EMDRA</h1>
            <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] mt-2">Plataforma de Gestão</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Usuário</label>
              <input type="text" required className="w-full px-6 py-5 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-bold" placeholder="Digite seu nome" value={loginForm.name} onChange={e => setLoginForm({...loginForm, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">PIN</label>
              <input type="password" required className="w-full px-6 py-5 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-bold" placeholder="****" value={loginForm.pin} onChange={e => setLoginForm({...loginForm, pin: e.target.value})} />
            </div>
            <button className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95">Acessar Painel</button>
          </form>
        </div>
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className={`no-print fixed inset-y-0 left-0 z-50 transition-all duration-300 bg-slate-900 text-white flex flex-col ${isSidebarOpen ? 'w-72' : 'w-24'}`}>
        <div className="p-8 flex items-center justify-between">
          {isSidebarOpen && <span className="font-black text-2xl tracking-tighter italic">EMDRA.</span>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
            {isSidebarOpen ? <X size={20}/> : <Menu size={24}/>}
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-8 overflow-y-auto">
          <NavBtn icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} isOpen={isSidebarOpen} />
          <NavBtn icon={AlertCircle} label="Ocorrências" active={activeTab === 'occurrences'} onClick={() => setActiveTab('occurrences')} isOpen={isSidebarOpen} />
          <NavBtn icon={CalendarIcon} label="Calendário" active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} isOpen={isSidebarOpen} />
          {isManagement && (
            <>
              <div className={`pt-6 pb-2 px-4 transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Administração</p>
              </div>
              <NavBtn icon={Clock} label="Frequência" active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} isOpen={isSidebarOpen} />
              <NavBtn icon={CheckSquare} label="Demandas" active={activeTab === 'demands'} onClick={() => setActiveTab('demands')} isOpen={isSidebarOpen} />
              <NavBtn icon={DollarSign} label="Financeiro" active={activeTab === 'finance'} onClick={() => setActiveTab('finance')} isOpen={isSidebarOpen} />
              <NavBtn icon={FileSearch} label="Documentos" active={activeTab === 'docs'} onClick={() => setActiveTab('docs')} isOpen={isSidebarOpen} />
              <NavBtn icon={Users} label="Quadro Pessoal" active={activeTab === 'people'} onClick={() => setActiveTab('people')} isOpen={isSidebarOpen} />
            </>
          )}
        </nav>
        <div className="p-6 border-t border-slate-800">
          <button onClick={() => { setCurrentUser(null); localStorage.removeItem('emdra_user'); }} className="flex items-center gap-4 w-full p-4 rounded-2xl hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-all group">
            <LogOut size={20} />
            {isSidebarOpen && <span className="font-black text-xs uppercase tracking-widest">Encerrar Sessão</span>}
          </button>
        </div>
      </aside>

      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-72' : 'ml-24'} p-12`}>
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end no-print gap-6">
          <div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tighter">Olá, {currentUser.name}</h2>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Acesso Nível: {currentUser.role}</p>
          </div>
          <div className="bg-white px-8 py-4 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Data do Sistema</p>
              <p className="font-bold text-slate-700 capitalize">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
            <CalendarIcon className="text-emerald-500" size={24} />
          </div>
        </header>

        {activeTab === 'dashboard' && <DashboardView stats={stats} insight={aiInsight} recentOccurrences={occurrences.slice(0, 5)} />}
        {activeTab === 'occurrences' && <OccurrencesView occurrences={occurrences} setOccurrences={setOccurrences} students={students} showToast={showToast} setSelectedOccurrence={setSelectedOccurrence} setSelectedHistoryStudent={setSelectedHistoryStudent} isAdmin={isAdmin} />}
        {activeTab === 'demands' && <DemandsView demands={demands} setDemands={setDemands} showToast={showToast} />}
        {activeTab === 'attendance' && <AttendanceView attendance={attendance} setAttendance={setAttendance} staff={staffMembers} teachers={teachers} showToast={showToast} />}
        {activeTab === 'finance' && <FinanceView finances={finances} setFinances={setFinances} showToast={showToast} />}
        {activeTab === 'docs' && <DocumentsView docs={documents} setDocuments={setDocuments} showToast={showToast} />}
        {activeTab === 'people' && <PeopleView students={students} setStudents={setStudents} teachers={teachers} setTeachers={setTeachers} staff={staffMembers} setStaff={setStaffMembers} users={appUsers} setUsers={setAppUsers} showToast={showToast} />}
        {activeTab === 'calendar' && <CalendarPlaceholder />}
      </main>

      {selectedOccurrence && <Modal isOpen={!!selectedOccurrence} onClose={() => setSelectedOccurrence(null)} title="Guia de Impressão Oficial" maxWidth="max-w-4xl"><PrintForm occurrence={selectedOccurrence} /></Modal>}
      {selectedHistoryStudent && <Modal isOpen={!!selectedHistoryStudent} onClose={() => setSelectedHistoryStudent(null)} title={`Histórico Disciplinar: ${selectedHistoryStudent}`} maxWidth="max-w-5xl"><StudentHistoryView student={selectedHistoryStudent} occurrences={occurrences} /></Modal>}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
};

// --- View Modules ---

const DashboardView: React.FC<any> = ({ stats, insight, recentOccurrences }) => (
  <div className="space-y-12 animate-in fade-in duration-700">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      <StatCard title="Produtividade" value={`${stats.demandProgress}%`} sub="Metas Concluídas" icon={TrendingUp} color="emerald" />
      <StatCard title="Ocorrências" value={recentOccurrences.length} sub="Registros Recentes" icon={AlertCircle} color="rose" />
      <StatCard title="Assiduidade" value="94%" sub="Média Semanal" icon={UserCheck} color="blue" />
      <StatCard title="Demandas" value={stats.totalDemands} sub="Pendências Totais" icon={CheckSquare} color="amber" />
    </div>
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 items-start">
      <div className="xl:col-span-2 bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
        <h3 className="text-xl font-black text-slate-800 mb-10 flex items-center gap-3"><PieChartIcon size={24} className="text-emerald-500" />Análise Disciplinar por Natureza</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.occurrencesData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
              <Bar dataKey="count" radius={[10, 10, 0, 0]} barSize={60}>
                {stats.occurrencesData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={['#10b981', '#f59e0b', '#f43f5e'][index]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="space-y-8">
        <div className="bg-slate-900 p-10 rounded-[40px] shadow-2xl text-white relative overflow-hidden">
          <Zap size={140} className="absolute -right-10 -bottom-10 opacity-5" />
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-3 bg-emerald-500 rounded-2xl"><BookOpen size={24} /></div>
            <h4 className="font-black text-lg">AI Insights</h4>
          </div>
          <p className="text-slate-300 italic leading-relaxed text-sm relative z-10">"{insight}"</p>
        </div>
      </div>
    </div>
  </div>
);

const OccurrencesView: React.FC<any> = ({ occurrences, setOccurrences, students, showToast, setSelectedOccurrence, setSelectedHistoryStudent, isAdmin }) => {
  const [formData, setFormData] = useState({ student: '', className: '', shift: 'Manhã', nature: OccurrenceNature.RECORD, type: OccurrenceType.PEDAGOGICAL, reason: '', immediateAction: '', managementDecision: '' });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(!formData.student || !formData.reason) return;
    const newOccurrence: Occurrence = { id: Math.random().toString(36).substr(2, 9), ...formData, date: new Date().toISOString().split('T')[0], reporter: 'Usuário logado', createdAt: Date.now(), shift: formData.shift as any };
    setOccurrences([newOccurrence, ...occurrences]);
    setFormData({ student: '', className: '', shift: 'Manhã', nature: OccurrenceNature.RECORD, type: OccurrenceType.PEDAGOGICAL, reason: '', immediateAction: '', managementDecision: '' });
    showToast('Ocorrência registrada com sucesso!', 'success');
  };
  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
        <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3"><Plus className="text-emerald-500" /> Novo Registro</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estudante</label>
            <select required className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold" value={formData.student} onChange={e => setFormData({...formData, student: e.target.value})}>
              <option value="">Selecione...</option>
              {students.map((s: string) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Natureza</label>
            <select required className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold" value={formData.nature} onChange={e => setFormData({...formData, nature: e.target.value as any})}>
              {Object.values(OccurrenceNature).map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo</label>
            <select required className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
              {Object.values(OccurrenceType).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="lg:col-span-3 space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Motivo / Descrição</label>
            <textarea required className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold min-h-[120px]" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
          </div>
          <button className="md:col-span-2 lg:col-span-3 bg-emerald-500 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg active:scale-95">Salvar Registro</button>
        </form>
      </div>
      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Estudante</th>
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {occurrences.map((o: Occurrence) => (
                <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6 font-bold text-slate-600 text-sm">{new Date(o.date).toLocaleDateString('pt-BR')}</td>
                  <td className="px-8 py-6"><button onClick={() => setSelectedHistoryStudent(o.student)} className="font-black text-slate-800 hover:text-emerald-500 underline decoration-slate-200">{o.student}</button></td>
                  <td className="px-8 py-6"><span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${o.type === 'Grave' ? 'bg-rose-100 text-rose-600' : o.type === 'Comportamental' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>{o.type}</span></td>
                  <td className="px-8 py-6 text-right space-x-4">
                    <button onClick={() => setSelectedOccurrence(o)} className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all"><Printer size={18} /></button>
                    {isAdmin && <button onClick={() => setOccurrences(occurrences.filter((item: Occurrence) => item.id !== o.id))} className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={18} /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const DemandsView: React.FC<any> = ({ demands, setDemands, showToast }) => {
  const [newDemand, setNewDemand] = useState('');
  const addDemand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDemand.trim()) return;
    const item: Demand = { id: Math.random().toString(36).substr(2, 9), title: newDemand, date: new Date().toISOString(), completed: false, createdAt: Date.now() };
    setDemands([item, ...demands]);
    setNewDemand('');
    showToast('Demanda adicionada.', 'success');
  };
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <form onSubmit={addDemand} className="flex gap-4">
        <input type="text" className="flex-1 px-8 py-5 rounded-3xl bg-white border border-slate-200 shadow-sm outline-none focus:ring-4 focus:ring-emerald-500/10 font-bold" placeholder="O que precisa ser feito?" value={newDemand} onChange={e => setNewDemand(e.target.value)} />
        <button className="bg-slate-900 text-white px-10 rounded-3xl font-black uppercase tracking-widest hover:bg-slate-800 shadow-lg active:scale-95 transition-all"><Plus /></button>
      </form>
      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-100">
        {demands.length === 0 && <div className="p-12 text-center text-slate-300 font-bold">Nenhuma pendência registrada.</div>}
        {demands.map((d: Demand) => (
          <div key={d.id} className="p-8 flex items-center justify-between group">
            <div className="flex items-center gap-6">
              <button onClick={() => setDemands(demands.map((item: Demand) => item.id === d.id ? {...item, completed: !item.completed} : item))} className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${d.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 text-transparent'}`}><CheckCircle2 size={20} /></button>
              <div>
                <p className={`font-bold text-lg transition-all ${d.completed ? 'text-slate-300 line-through' : 'text-slate-800'}`}>{d.title}</p>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">{new Date(d.date).toLocaleDateString()}</p>
              </div>
            </div>
            <button onClick={() => setDemands(demands.filter((item: Demand) => item.id !== d.id))} className="p-3 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={20} /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

const AttendanceView: React.FC<any> = ({ attendance, setAttendance, staff, teachers, showToast }) => {
  const [formData, setFormData] = useState({ personName: '', roleOrSubject: '', type: 'Falta', date: new Date().toISOString().split('T')[0], isTeacher: true });
  const addRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if(!formData.personName) return;
    const record: AttendanceRecord = { id: Math.random().toString(36).substr(2, 9), ...formData, type: formData.type as any, description: '' };
    setAttendance([record, ...attendance]);
    showToast('Frequência registrada.', 'success');
  };
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
        <h3 className="text-2xl font-black text-slate-800 mb-8">Registrar Ausência / Atraso</h3>
        <form onSubmit={addRecord} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pessoa</label>
            <input list="names" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold" value={formData.personName} onChange={e => setFormData({...formData, personName: e.target.value})} />
            <datalist id="names">
              {teachers.map((t: string) => <option key={t} value={t} />)}
              {staff.map((s: any) => <option key={s.id} value={s.name} />)}
            </datalist>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Falta</label>
            <select className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
              {ATTENDANCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data</label>
            <input type="date" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
          </div>
          <button className="bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg self-end h-[60px]">Gravar</button>
        </form>
      </div>
      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Pessoa</th>
              <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
              <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Ocorrência</th>
              <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {attendance.map((a: AttendanceRecord) => (
              <tr key={a.id}>
                <td className="px-8 py-6 font-black text-slate-800">{a.personName}</td>
                <td className="px-8 py-6 text-slate-500 font-bold">{new Date(a.date).toLocaleDateString()}</td>
                <td className="px-8 py-6"><span className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest">{a.type}</span></td>
                <td className="px-8 py-6 text-right"><button onClick={() => setAttendance(attendance.filter((item: AttendanceRecord) => item.id !== a.id))} className="text-rose-500 p-2 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={18}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const FinanceView: React.FC<any> = ({ finances, setFinances, showToast }) => {
  const [formData, setFormData] = useState({ description: '', amount: 0, type: 'Inflow', category: 'Geral', date: new Date().toISOString().split('T')[0] });
  const addRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if(!formData.description || formData.amount <= 0) return;
    const record: FinanceRecord = { id: Math.random().toString(36).substr(2, 9), ...formData, amount: Number(formData.amount), type: formData.type as any, category: formData.category as any };
    setFinances([record, ...finances]);
    setFormData({ description: '', amount: 0, type: 'Inflow', category: 'Geral', date: new Date().toISOString().split('T')[0] });
    showToast('Registro financeiro salvo.', 'success');
  };
  const balance = finances.reduce((acc: number, curr: FinanceRecord) => curr.type === 'Inflow' ? acc + curr.amount : acc - curr.amount, 0);
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Saldo Atual</p>
          <h4 className={`text-3xl font-black tracking-tighter ${balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>R$ {balance.toFixed(2)}</h4>
        </div>
      </div>
      <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
        <h3 className="text-2xl font-black text-slate-800 mb-8">Novo Lançamento</h3>
        <form onSubmit={addRecord} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição</label>
            <input required className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor</label>
            <input type="number" step="0.01" required className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo</label>
            <select className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
              <option value="Inflow">Entrada</option>
              <option value="Outflow">Saída</option>
            </select>
          </div>
          <button className="bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 h-[60px] self-end">Lançar</button>
        </form>
      </div>
    </div>
  );
};

const DocumentsView: React.FC<any> = ({ docs, setDocuments, showToast }) => {
  const [formData, setFormData] = useState({ name: '', category: 'Lei', linkOrBase64: '', type: 'Link' });
  const addDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if(!formData.name || !formData.linkOrBase64) return;
    const doc: Document = { id: Math.random().toString(36).substr(2, 9), ...formData, category: formData.category as any, type: formData.type as any };
    setDocuments([doc, ...docs]);
    setFormData({ name: '', category: 'Lei', linkOrBase64: '', type: 'Link' });
    showToast('Documento registrado.', 'success');
  };
  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
        <h3 className="text-2xl font-black text-slate-800 mb-8">Repositório de Documentos</h3>
        <form onSubmit={addDoc} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <input placeholder="Título do Documento" required className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          <select className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})}>
            {DOCUMENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input placeholder="Link ou URL" required className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 font-bold" value={formData.linkOrBase64} onChange={e => setFormData({...formData, linkOrBase64: e.target.value})} />
          <button className="lg:col-span-3 bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 shadow-xl">Adicionar à Base</button>
        </form>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {docs.map((d: Document) => (
          <div key={d.id} className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-emerald-500/50 transition-all">
            <div className="flex items-start justify-between mb-6">
              <div className="p-3 bg-slate-50 rounded-2xl text-slate-400 group-hover:text-emerald-500 transition-colors"><FileSearch size={24} /></div>
              <span className="px-3 py-1 bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 rounded-full">{d.category}</span>
            </div>
            <h5 className="text-xl font-black text-slate-800 mb-4 line-clamp-2">{d.name}</h5>
            <div className="flex gap-4">
              <a href={d.linkOrBase64} target="_blank" rel="noopener noreferrer" className="flex-1 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-600 py-4 rounded-2xl text-center font-black uppercase text-xs tracking-widest transition-all">Ver Link</a>
              <button onClick={() => setDocuments(docs.filter((item: Document) => item.id !== d.id))} className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={20} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PeopleView: React.FC<any> = ({ students, setStudents, teachers, setTeachers, staff, setStaff, users, setUsers, showToast }) => {
  const [activeSub, setActiveSub] = useState<'students' | 'teachers' | 'staff' | 'users'>('students');
  const [newItem, setNewItem] = useState('');
  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    if (activeSub === 'students') setStudents([...students, newItem]);
    if (activeSub === 'teachers') setTeachers([...teachers, newItem]);
    if (activeSub === 'staff') setStaff([...staff, { id: Date.now().toString(), name: newItem, role: 'Apoio', isTeacher: false }]);
    setNewItem('');
    showToast('Adicionado com sucesso.', 'success');
  };
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex gap-4 mb-8">
        {['students', 'teachers', 'staff', 'users'].map((s: any) => (
          <button key={s} onClick={() => setActiveSub(s)} className={`px-8 py-3 rounded-full font-black uppercase text-[10px] tracking-widest transition-all ${activeSub === s ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'}`}>{s === 'students' ? 'Estudantes' : s === 'teachers' ? 'Professores' : s === 'staff' ? 'Equipe' : 'Sistema'}</button>
        ))}
      </div>
      <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
        <form onSubmit={addItem} className="flex gap-4 mb-10">
          <input className="flex-1 px-8 py-5 rounded-2xl bg-slate-50 border border-slate-200 font-bold" placeholder={`Nome do novo ${activeSub}...`} value={newItem} onChange={e => setNewItem(e.target.value)} />
          <button className="bg-emerald-500 text-white px-10 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-600 shadow-lg active:scale-95 transition-all"><Plus /></button>
        </form>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeSub === 'students' && students.map((s: string) => <div key={s} className="p-6 bg-slate-50 rounded-3xl flex items-center justify-between group"><span className="font-bold text-slate-700">{s}</span><button onClick={() => setStudents(students.filter((item: string) => item !== s))} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={18}/></button></div>)}
          {activeSub === 'teachers' && teachers.map((t: string) => <div key={t} className="p-6 bg-slate-50 rounded-3xl flex items-center justify-between group"><span className="font-bold text-slate-700">{t}</span><button onClick={() => setTeachers(teachers.filter((item: string) => item !== t))} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={18}/></button></div>)}
        </div>
      </div>
    </div>
  );
};

const CalendarPlaceholder: React.FC = () => (
  <div className="bg-white p-20 rounded-[40px] shadow-sm border border-slate-100 text-center animate-in fade-in duration-700">
    <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-10"><CalendarDays className="text-emerald-500 w-12 h-12" /></div>
    <h3 className="text-4xl font-black text-slate-800 tracking-tighter mb-4">Calendário Integrado</h3>
    <p className="text-slate-400 font-bold max-w-md mx-auto leading-relaxed">O calendário letivo e de reuniões está sendo sincronizado. Em breve você poderá visualizar todos os eventos aqui.</p>
  </div>
);

const PrintForm: React.FC<{ occurrence: Occurrence }> = ({ occurrence }) => (
  <div className="space-y-12 p-10 bg-white border-2 border-slate-100 rounded-3xl print:border-none print:p-0">
    <div className="flex justify-between items-center border-b-4 border-slate-900 pb-10">
      <div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">Guia Oficial de Ocorrência</h2>
        <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.4em] mt-2">Documento de Registro Escolar Disciplinar</p>
      </div>
      <div className="text-right">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ID do Protocolo</p>
        <p className="font-black text-slate-900 font-mono text-xl">#{occurrence.id.toUpperCase()}</p>
      </div>
    </div>
    <div className="grid grid-cols-3 gap-12">
      <div className="col-span-2 space-y-10">
        <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Estudante</label><p className="text-3xl font-black text-slate-800">{occurrence.student}</p></div>
        <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Motivo do Registro</label><p className="text-lg font-bold text-slate-700 leading-relaxed bg-slate-50 p-8 rounded-3xl border border-slate-100">{occurrence.reason}</p></div>
      </div>
      <div className="space-y-10 border-l border-slate-100 pl-12">
        <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Data</label><p className="font-black text-slate-800">{new Date(occurrence.date).toLocaleDateString('pt-BR')}</p></div>
        <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Natureza</label><p className="font-black text-slate-800">{occurrence.nature}</p></div>
        <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Responsável</label><p className="font-black text-slate-800">{occurrence.reporter}</p></div>
      </div>
    </div>
    <div className="mt-20 pt-20 border-t-2 border-dashed border-slate-200 grid grid-cols-2 gap-20">
      <div className="text-center"><div className="border-b-2 border-slate-900 mb-4 h-12"></div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assinatura do Responsável Legal</p></div>
      <div className="text-center"><div className="border-b-2 border-slate-900 mb-4 h-12"></div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assinatura da Coordenação/Direção</p></div>
    </div>
    <div className="no-print mt-12 flex justify-center"><button onClick={() => window.print()} className="bg-slate-900 text-white px-12 py-6 rounded-3xl font-black uppercase tracking-widest flex items-center gap-4 hover:bg-slate-800 shadow-2xl transition-all"><Printer size={24} /> Imprimir Agora</button></div>
  </div>
);

const StudentHistoryView: React.FC<{ student: string; occurrences: Occurrence[] }> = ({ student, occurrences }) => {
  const filtered = occurrences.filter(o => o.student === student);
  return (
    <div className="space-y-8">
      {filtered.length === 0 && <p className="text-center text-slate-400 py-12 font-bold">Nenhum registro encontrado para este estudante.</p>}
      {filtered.map(o => (
        <div key={o.id} className="bg-slate-50 p-8 rounded-[40px] border border-slate-200">
          <div className="flex justify-between items-start mb-6"><span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${o.type === 'Grave' ? 'bg-rose-500 text-white' : 'bg-slate-900 text-white'}`}>{o.type}</span><p className="font-black text-slate-400 text-[10px] uppercase tracking-widest">{new Date(o.date).toLocaleDateString()}</p></div>
          <p className="font-bold text-slate-800 text-lg leading-relaxed mb-6">{o.reason}</p>
          <div className="flex items-center gap-3 text-emerald-600"><FileBadge size={16} /><p className="text-[10px] font-black uppercase tracking-widest">{o.nature}</p></div>
        </div>
      ))}
    </div>
  );
};

const NavBtn: React.FC<{ icon: any; label: string; active: boolean; onClick: () => void; isOpen: boolean }> = ({ icon: Icon, label, active, onClick, isOpen }) => (
  <button onClick={onClick} className={`flex items-center gap-4 w-full p-4 rounded-2xl transition-all duration-300 ${active ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 active:scale-95 scale-[1.02]' : 'text-slate-500 hover:bg-slate-800 hover:text-white'}`}>
    <Icon size={20} className={active ? 'scale-110' : ''} />
    {isOpen && <span className="font-black text-xs uppercase tracking-widest whitespace-nowrap">{label}</span>}
  </button>
);

const StatCard: React.FC<{ title: string; value: any; sub: string; icon: any; color: 'emerald' | 'rose' | 'blue' | 'amber' }> = ({ title, value, sub, icon: Icon, color }) => {
  const colors = { emerald: 'text-emerald-500 bg-emerald-50', rose: 'text-rose-500 bg-rose-50', blue: 'text-blue-500 bg-blue-50', amber: 'text-amber-500 bg-amber-50' };
  return (
    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 hover:shadow-xl transition-all group active:scale-95">
      <div className="flex justify-between items-start mb-6">
        <div className={`p-3 rounded-2xl ${colors[color]}`}><Icon size={20} /></div>
        <TrendingUp size={16} className="text-slate-100 group-hover:text-slate-300" />
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{title}</p>
      <h4 className="text-3xl font-black text-slate-800 mb-1">{value}</h4>
      <p className="text-[10px] font-bold text-slate-300">{sub}</p>
    </div>
  );
};

export default App;
