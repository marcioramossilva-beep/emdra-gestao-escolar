
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
  // Fix: Import User as UserIcon to avoid conflict with User type from ./types
  User as UserIcon
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
} from './types';
import { 
  OCCURRENCE_REASONS, 
  IMMEDIATE_ACTIONS,
  MANAGEMENT_DECISIONS,
  SHIFTS, 
  ATTENDANCE_TYPES, 
  DOCUMENT_CATEGORIES, 
  EVENT_COLORS,
  STAFF_ROLES
} from './constants';
import { getGeminiInsights } from './services/geminiService';

// --- Components ---

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 no-print backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
          <h3 className="text-xl font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="p-6">{children}</div>
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
    <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-xl shadow-2xl text-white z-[100] transition-all transform animate-in slide-in-from-right fade-in duration-300 flex items-center gap-3 ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
      {type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
      <span className="font-semibold">{message}</span>
    </div>
  );
};

// --- Main App Logic ---

const App: React.FC = () => {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('emdra_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  // Dynamic User List (Admin Management)
  const [appUsers, setAppUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('emdra_app_users');
    if (saved) return JSON.parse(saved);
    return [{
      id: 'admin-marcio',
      name: 'Márcio',
      pin: '1500',
      role: UserRole.ADMIN
    }];
  });

  const [loginForm, setLoginForm] = useState({ name: '', pin: '' });
  
  // App Data State
  const [occurrences, setOccurrences] = useState<Occurrence[]>(() => JSON.parse(localStorage.getItem('emdra_occurrences') || '[]'));
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => JSON.parse(localStorage.getItem('emdra_attendance') || '[]'));
  const [demands, setDemands] = useState<Demand[]>(() => JSON.parse(localStorage.getItem('emdra_demands') || '[]'));
  const [goals, setGoals] = useState<Goal[]>(() => JSON.parse(localStorage.getItem('emdra_goals') || '[]'));
  const [events, setEvents] = useState<SchoolEvent[]>(() => JSON.parse(localStorage.getItem('emdra_events') || '[]'));
  const [finances, setFinances] = useState<FinanceRecord[]>(() => JSON.parse(localStorage.getItem('emdra_finances') || '[]'));
  const [documents, setDocuments] = useState<Document[]>(() => JSON.parse(localStorage.getItem('emdra_documents') || '[]'));
  const [students, setStudents] = useState<string[]>(() => JSON.parse(localStorage.getItem('emdra_students') || '["João Silva", "Maria Oliveira", "Pedro Santos"]'));
  
  // Separated Staff State
  const [teachers, setTeachers] = useState<string[]>(() => JSON.parse(localStorage.getItem('emdra_teachers') || '["Prof. Roberto", "Prof. Marcelo", "Profª. Eliane"]'));
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(() => JSON.parse(localStorage.getItem('emdra_staff_members') || '[{"id":"1","name":"Dona Maria","role":"Cozinha","isTeacher":false},{"id":"2","name":"Seu José","role":"Portaria","isTeacher":false}]'));
  // Fix: Define missing meetings state
  const [meetings, setMeetings] = useState<ParentMeeting[]>(() => JSON.parse(localStorage.getItem('emdra_meetings') || '[]'));

  // UI State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [aiInsight, setAiInsight] = useState<string>('Analisando tendências escolares...');
  const [selectedOccurrence, setSelectedOccurrence] = useState<Occurrence | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<ParentMeeting | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isMeetingPrintModalOpen, setIsMeetingPrintModalOpen] = useState(false);
  const [absenceModalConfig, setAbsenceModalConfig] = useState<{ type: 'employees' | 'teachers', period: 'day' | 'week' | 'month' } | null>(null);
  const [productivityModalType, setProductivityModalType] = useState<'today' | 'week' | 'month' | null>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('emdra_app_users', JSON.stringify(appUsers));
    localStorage.setItem('emdra_occurrences', JSON.stringify(occurrences));
    localStorage.setItem('emdra_attendance', JSON.stringify(attendance));
    localStorage.setItem('emdra_demands', JSON.stringify(demands));
    localStorage.setItem('emdra_goals', JSON.stringify(goals));
    localStorage.setItem('emdra_events', JSON.stringify(events));
    localStorage.setItem('emdra_finances', JSON.stringify(finances));
    localStorage.setItem('emdra_documents', JSON.stringify(documents));
    localStorage.setItem('emdra_students', JSON.stringify(students));
    localStorage.setItem('emdra_teachers', JSON.stringify(teachers));
    localStorage.setItem('emdra_staff_members', JSON.stringify(staffMembers));
    localStorage.setItem('emdra_meetings', JSON.stringify(meetings));
  }, [appUsers, occurrences, attendance, demands, goals, events, finances, documents, students, teachers, staffMembers, meetings]);

  useEffect(() => {
    if (currentUser && activeTab === 'dashboard') {
      getGeminiInsights(occurrences).then(setAiInsight);
    }
  }, [occurrences, currentUser, activeTab]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.name || !loginForm.pin) return;
    
    const foundUser = appUsers.find(
      u => u.name.toLowerCase() === loginForm.name.toLowerCase() && u.pin === loginForm.pin
    );

    if (foundUser) {
      setCurrentUser(foundUser);
      localStorage.setItem('emdra_user', JSON.stringify(foundUser));
      showToast(`Bem-vindo, ${foundUser.name}!`, 'success');
    } else {
      showToast('Nome de usuário ou PIN incorretos.', 'error');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('emdra_user');
    setActiveTab('dashboard');
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  // --- Dashboard Logic ---
  const isAdmin = currentUser?.role === UserRole.ADMIN;
  const isManagement = currentUser?.role === UserRole.MANAGEMENT || isAdmin;
  const todayStr = new Date().toISOString().split('T')[0];

  const dashboardStats = useMemo(() => {
    const getRangeStats = (period: 'day' | 'week' | 'month', isTeacher: boolean) => {
      const now = new Date();
      const records = attendance.filter(a => {
        if (a.isTeacher !== isTeacher) return false;
        const aDate = new Date(a.date + 'T12:00:00');
        if (period === 'day') return a.date === todayStr;
        if (period === 'week') {
          const diff = (now.getTime() - aDate.getTime()) / (1000 * 3600 * 24);
          return diff >= 0 && diff < 7;
        }
        return aDate.getMonth() === now.getMonth() && aDate.getFullYear() === now.getFullYear();
      });

      const totalPossible = isTeacher ? teachers.length : staffMembers.length; 
      const count = records.length;
      const percentage = totalPossible === 0 ? 0 : Math.min(100, Math.round((count / totalPossible) * 100));
      return { count, percentage };
    };

    const getDemandStats = (period: 'today' | 'week' | 'month') => {
      const now = new Date();
      const filtered = demands.filter(d => {
        const dDate = new Date(d.date + 'T12:00:00');
        if (period === 'today') return d.date === todayStr;
        if (period === 'week') {
          const diff = (now.getTime() - dDate.getTime()) / (1000 * 3600 * 24);
          return diff >= 0 && diff < 7;
        }
        return dDate.getMonth() === now.getMonth() && dDate.getFullYear() === now.getFullYear();
      });
      const total = filtered.length;
      const completed = filtered.filter(f => f.completed).length;
      const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
      return { total, completed, percentage };
    };

    const occurrencesByType = [
      { name: 'Pedagógica', value: occurrences.filter(o => o.type === OccurrenceType.PEDAGOGICAL).length },
      { name: 'Comportamental', value: occurrences.filter(o => o.type === OccurrenceType.BEHAVIORAL).length },
      { name: 'Grave', value: occurrences.filter(o => o.type === OccurrenceType.SERIOUS).length },
    ];

    const occurrencesByNature = [
      { name: 'Registro', value: occurrences.filter(o => o.nature === OccurrenceNature.RECORD).length },
      { name: 'Advertência', value: occurrences.filter(o => o.nature === OccurrenceNature.WARNING).length },
    ];

    return { 
      occurrencesByType,
      occurrencesByNature,
      staff: {
        day: getRangeStats('day', false),
        week: getRangeStats('week', false),
        month: getRangeStats('month', false)
      },
      teachers: {
        day: getRangeStats('day', true),
        week: getRangeStats('week', true),
        month: getRangeStats('month', true)
      },
      demands: {
        today: getDemandStats('today'),
        week: getDemandStats('week'),
        month: getDemandStats('month')
      }
    };
  }, [demands, occurrences, attendance, todayStr, teachers, staffMembers]);

  const recentFeed = useMemo(() => {
    const combined = [
      ...occurrences.map(o => ({ type: 'occ', date: o.createdAt, text: `Nova ocorrência: ${o.student}`, sub: o.reason })),
      ...meetings.map(m => ({ type: 'meet', date: m.createdAt, text: `Reunião com pais: ${m.student}`, sub: m.reason })),
      ...demands.map(d => ({ type: 'dem', date: d.createdAt, text: `Nova demanda: ${d.title}`, sub: d.completed ? 'Concluída' : 'Pendente' })),
    ].sort((a, b) => b.date - a.date).slice(0, 5);
    return combined;
  }, [occurrences, meetings, demands]);

  // Shared Return component
  const ReturnToDashboard = () => (
    <div className="mt-12 pt-8 border-t border-slate-200 flex justify-center no-print">
      <button 
        onClick={() => {
          setActiveTab('dashboard');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="flex items-center space-x-2 text-slate-400 hover:text-emerald-600 transition-colors group px-6 py-2 rounded-full hover:bg-emerald-50"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-bold uppercase tracking-wider text-xs">Voltar ao Início</span>
      </button>
    </div>
  );

  // --- Views ---

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md transform transition-all hover:scale-[1.02]">
          <div className="flex flex-col items-center mb-10">
            <div className="bg-emerald-500 p-5 rounded-2xl mb-6 shadow-xl shadow-emerald-500/20">
              <BookOpen className="text-white w-12 h-12" />
            </div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tighter">EMDRA</h1>
            <p className="text-slate-400 font-medium uppercase tracking-[0.2em] text-[10px] mt-2">Sistema de Gestão Escolar</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">Nome do Usuário</label>
              <input 
                type="text" 
                required
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-slate-700 bg-slate-50"
                placeholder="Ex: Márcio"
                value={loginForm.name}
                onChange={(e) => setLoginForm({...loginForm, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-2 ml-1">PIN de Acesso</label>
              <input 
                type="password" 
                required
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-slate-700 bg-slate-50"
                placeholder="****"
                value={loginForm.pin}
                onChange={(e) => setLoginForm({...loginForm, pin: e.target.value})}
              />
            </div>
            <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98]">
              Entrar no Sistema
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className={`no-print transition-all duration-300 bg-slate-900 text-white flex flex-col fixed inset-y-0 left-0 z-40 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <BookOpen size={18} />
              </div>
              <span className="font-black text-xl tracking-tighter text-white">EMDRA</span>
            </div>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            {isSidebarOpen ? <X size={20} /> : <Menu size={24} />}
          </button>
        </div>
        
        <nav className="flex-1 mt-6 px-4 space-y-1.5 overflow-y-auto">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} isOpen={isSidebarOpen} />
          
          <div className="pt-4 pb-2">
             <p className={`text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 mb-2 transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>Módulos</p>
             <SidebarItem icon={AlertCircle} label="Ocorrências" active={activeTab === 'occurrences'} onClick={() => setActiveTab('occurrences')} isOpen={isSidebarOpen} />
             <SidebarItem icon={CalendarIcon} label="Calendário" active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} isOpen={isSidebarOpen} />
             {isManagement && <SidebarItem icon={MessagesSquare} label="Reuniões Pais" active={activeTab === 'meetings'} onClick={() => setActiveTab('meetings')} isOpen={isSidebarOpen} />}
          </div>

          {isAdmin && (
            <div className="pt-4 border-t border-slate-800/50">
              <p className={`text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 mb-2 transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>Administrativo</p>
              <SidebarItem icon={Clock} label="Frequência" active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} isOpen={isSidebarOpen} />
              <SidebarItem icon={CheckSquare} label="Demandas" active={activeTab === 'demands'} onClick={() => setActiveTab('demands')} isOpen={isSidebarOpen} />
              <SidebarItem icon={Target} label="Metas" active={activeTab === 'goals'} onClick={() => setActiveTab('goals')} isOpen={isSidebarOpen} />
              <SidebarItem icon={DollarSign} label="Financeiro" active={activeTab === 'finance'} onClick={() => setActiveTab('finance')} isOpen={isSidebarOpen} />
              <SidebarItem icon={FileSearch} label="Documentos" active={activeTab === 'docs'} onClick={() => setActiveTab('docs')} isOpen={isSidebarOpen} />
              <SidebarItem icon={Users} label="Quadro Pessoal" active={activeTab === 'people'} onClick={() => setActiveTab('people')} isOpen={isSidebarOpen} />
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full p-3 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors group"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="font-bold text-sm">Sair do Sistema</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'} p-8`}>
        {/* Header */}
        <header className="mb-10 flex justify-between items-end no-print">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Olá, {currentUser.name}</h2>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isAdmin ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                {currentUser.role}
              </span>
            </div>
            <p className="text-slate-500 font-medium">Painel estratégico para monitoramento integral.</p>
          </div>
          <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
             <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-emerald-500">
                <CalendarIcon size={20} />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hoje é</p>
                <p className="text-slate-700 font-bold leading-tight capitalize">
                  {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
             </div>
          </div>
        </header>

        {/* Dashboard Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-12 animate-in fade-in duration-500 no-print">
            {isAdmin ? (
              <>
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                   {/* Left Column: Absences */}
                   <div className="space-y-6">
                      <div className="flex items-center justify-between border-l-4 border-blue-500 pl-4">
                         <div>
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Frequência da Equipe</h4>
                            <p className="text-[10px] text-slate-400 font-bold">Funcionários & Professores</p>
                         </div>
                         <Activity size={20} className="text-slate-200" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <DashboardCard title="Faltas Hoje" value={dashboardStats.staff.day.count + dashboardStats.teachers.day.count} percentage={Math.round((dashboardStats.staff.day.percentage + dashboardStats.teachers.day.percentage)/2)} color="blue" onClick={() => setAbsenceModalConfig({ type: 'employees', period: 'day' })} icon={Zap}/>
                        <DashboardCard title="Semana" value={dashboardStats.staff.week.count + dashboardStats.teachers.week.count} percentage={Math.round((dashboardStats.staff.week.percentage + dashboardStats.teachers.week.percentage)/2)} color="blue" onClick={() => setAbsenceModalConfig({ type: 'employees', period: 'week' })} icon={TrendingUp}/>
                        <DashboardCard title="Histórico" value={dashboardStats.staff.month.count + dashboardStats.teachers.month.count} percentage={Math.round((dashboardStats.staff.month.percentage + dashboardStats.teachers.month.percentage)/2)} color="blue" onClick={() => setAbsenceModalConfig({ type: 'employees', period: 'month' })} icon={Activity}/>
                      </div>
                   </div>

                   {/* Right Column: Productivity */}
                   <div className="space-y-6">
                      <div className="flex items-center justify-between border-l-4 border-emerald-500 pl-4">
                         <div>
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Entrega de Demandas</h4>
                            <p className="text-[10px] text-slate-400 font-bold">Indicadores de Produtividade</p>
                         </div>
                         <CheckCircle2 size={20} className="text-slate-200" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <ProgressCard title="Hoje" stats={dashboardStats.demands.today} onClick={() => setProductivityModalType('today')} />
                        <ProgressCard title="Semana" stats={dashboardStats.demands.week} onClick={() => setProductivityModalType('week')} />
                        <ProgressCard title="Mês" stats={dashboardStats.demands.month} onClick={() => setProductivityModalType('month')} />
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                   <div className="xl:col-span-2 bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 group">
                      <div className="flex items-center justify-between mb-12">
                        <div>
                          <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <PieChartIcon size={20} className="text-blue-500" />
                            Distribuição Disciplinar
                          </h4>
                          <p className="text-xs text-slate-400 font-medium">Volume de registros por categoria e gravidade</p>
                        </div>
                      </div>
                      <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dashboardStats.occurrencesByType} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dy={15} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} />
                            <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                            <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={50}>
                              {dashboardStats.occurrencesByType.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={['#10b981', '#f59e0b', '#ef4444'][index]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                   </div>

                   <div className="space-y-8">
                      <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                         <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Natureza do Conflito</h4>
                         <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                               <PieChart>
                                  <Pie data={dashboardStats.occurrencesByNature} innerRadius={60} outerRadius={80} paddingAngle={10} dataKey="value">
                                     <Cell fill="#94a3b8" />
                                     <Cell fill="#f43f5e" />
                                  </Pie>
                                  <Tooltip contentStyle={{borderRadius: '16px'}} />
                                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase'}} />
                               </PieChart>
                            </ResponsiveContainer>
                         </div>
                      </div>

                      <div className="bg-slate-900 p-8 rounded-[32px] shadow-2xl text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                          <Activity size={120} />
                        </div>
                        <div className="flex items-center space-x-3 mb-6 relative z-10">
                          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <BookOpen size={20} />
                          </div>
                          <h4 className="font-bold text-lg">Insights Pedagógicos</h4>
                        </div>
                        <p className="text-slate-300 leading-relaxed font-medium italic text-sm relative z-10 mb-8">
                          "{aiInsight}"
                        </p>
                      </div>
                   </div>
                </div>
              </>
            ) : (
              <div className="space-y-12">
                <div className="bg-slate-900 p-16 rounded-[50px] shadow-2xl text-center relative overflow-hidden">
                  <h3 className="text-5xl font-black text-white mb-6 tracking-tighter relative z-10">Painel Operacional</h3>
                  <p className="text-slate-400 font-medium max-w-lg mx-auto relative z-10 text-lg">Acesso rápido às funcionalidades permitidas para o seu perfil institucional.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  <QuickAction icon={AlertCircle} label="Gerenciar Ocorrências" color="emerald" onClick={() => setActiveTab('occurrences')} />
                  <QuickAction icon={CalendarIcon} label="Calendário Letivo" color="purple" onClick={() => setActiveTab('calendar')} />
                  {isManagement && <QuickAction icon={MessagesSquare} label="Reuniões com Pais" color="blue" onClick={() => setActiveTab('meetings')} />}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Personnel Module Upgrade */}
        {activeTab === 'people' && isAdmin && (
          <><PeopleModule 
            students={students} 
            setStudents={setStudents} 
            teachers={teachers} 
            setTeachers={setTeachers} 
            staffMembers={staffMembers}
            setStaffMembers={setStaffMembers}
            appUsers={appUsers} 
            setAppUsers={setAppUsers} 
            isAdmin={isAdmin} 
            showToast={showToast} 
          /><ReturnToDashboard /></>
        )}

        {/* Other Tab Logic */}
        {activeTab === 'occurrences' && (
          <><OccurrenceModule occurrences={occurrences} setOccurrences={setOccurrences} students={students} isAdmin={isAdmin} showToast={showToast} setSelectedOccurrence={setSelectedOccurrence} setIsPrintModalOpen={setIsPrintModalOpen} setIsHistoryModalOpen={setIsHistoryModalOpen}/><ReturnToDashboard /></>
        )}
        {activeTab === 'meetings' && isManagement && (
          <><ParentMeetingsModule meetings={meetings} setMeetings={setMeetings} students={students} isAdmin={isAdmin} showToast={showToast} setSelectedMeeting={setSelectedMeeting} setIsMeetingPrintModalOpen={setIsMeetingPrintModalOpen}/><ReturnToDashboard /></>
        )}
        {isAdmin && activeTab === 'attendance' && (
          <><AttendanceModule attendance={attendance} setAttendance={setAttendance} teachers={teachers} staffMembers={staffMembers} isAdmin={isAdmin} showToast={showToast}/><ReturnToDashboard /></>
        )}
        {isAdmin && activeTab === 'demands' && (
          <><DemandsModule demands={demands} setDemands={setDemands} showToast={showToast}/><ReturnToDashboard /></>
        )}
        {isAdmin && activeTab === 'goals' && (
          <><GoalsModule goals={goals} setGoals={setGoals} showToast={showToast}/><ReturnToDashboard /></>
        )}
        {activeTab === 'calendar' && (
          <><CalendarModule events={events} setEvents={setEvents} isAdmin={isAdmin} showToast={showToast} /><ReturnToDashboard /></>
        )}
        {isAdmin && activeTab === 'finance' && (
          <><FinanceModule finances={finances} setFinances={setFinances} isAdmin={isAdmin} showToast={showToast} /><ReturnToDashboard /></>
        )}
        {isAdmin && activeTab === 'docs' && (
          <><DocumentsModule documents={documents} setDocuments={setDocuments} isAdmin={isAdmin} showToast={showToast} /><ReturnToDashboard /></>
        )}
      </main>

      {/* Shared Modals */}
      <Modal isOpen={!!absenceModalConfig} onClose={() => setAbsenceModalConfig(null)} 
             title={`${absenceModalConfig?.type === 'employees' ? 'Funcionários' : 'Professores'} Ausentes`}>
        <div className="space-y-4">
          {attendance
            .filter(a => {
              if (absenceModalConfig?.type === 'employees' && a.isTeacher) return false;
              if (absenceModalConfig?.type === 'teachers' && !a.isTeacher) return false;
              if (absenceModalConfig?.period === 'day') return a.date === todayStr;
              return true;
            })
            .map(a => (
              <div key={a.id} className="p-5 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-sm ${a.isTeacher ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                    {a.personName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{a.personName}</p>
                    <p className="text-xs text-slate-500 font-medium">{a.roleOrSubject}</p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </Modal>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
};

// --- Helper UI Components ---

const SidebarItem: React.FC<{ icon: any; label: string; active: boolean; onClick: () => void; isOpen: boolean }> = ({ icon: Icon, label, active, onClick, isOpen }) => (
  <button 
    onClick={onClick}
    className={`flex items-center space-x-3 w-full p-3.5 rounded-2xl transition-all duration-300 ${active ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 active:scale-95' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
  >
    <Icon size={20} className={`${active ? 'scale-110 transition-transform' : ''}`} />
    {isOpen && <span className="font-bold text-sm tracking-tight whitespace-nowrap">{label}</span>}
  </button>
);

const DashboardCard: React.FC<{ title: string; value: number | string; percentage: number; color: 'blue' | 'purple'; onClick: () => void; icon: any }> = ({ title, value, percentage, onClick, icon: Icon }) => (
  <div onClick={onClick} className="p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer bg-white group active:scale-95 relative overflow-hidden">
    <div className="absolute -right-4 -bottom-4 text-slate-50 group-hover:text-blue-50 transition-colors pointer-events-none">
       <Icon size={80} />
    </div>
    <div className="flex justify-between items-start mb-6">
      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</h4>
      <div className="p-2 rounded-xl bg-slate-50 group-hover:bg-blue-50 transition-colors">
        <Icon size={16} className="text-blue-500" />
      </div>
    </div>
    <div className="flex items-end gap-3 mb-4 relative z-10">
      <div className="text-4xl font-black text-slate-800 tracking-tighter">{value}</div>
      <div className="text-[10px] font-black px-2 py-1 rounded-lg bg-blue-50 text-blue-600">
        {percentage}%
      </div>
    </div>
    <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden relative z-10">
      <div className="bg-blue-500 h-full transition-all duration-700" style={{ width: `${percentage}%` }}></div>
    </div>
  </div>
);

const ProgressCard: React.FC<{ title: string; stats: {total: number, completed: number, percentage: number}; onClick: () => void }> = ({ title, stats, onClick }) => (
  <div onClick={onClick} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group active:scale-95">
    <div className="flex justify-between items-start mb-6">
      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</h4>
      <CheckCircle2 size={18} className="text-emerald-500" />
    </div>
    <div className="flex items-end justify-between mb-4">
       <div>
          <span className="text-3xl font-black text-slate-800 tracking-tighter">{stats.completed}</span>
          <span className="text-slate-300 font-bold text-lg ml-1">/ {stats.total}</span>
       </div>
       <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">{stats.percentage}%</span>
    </div>
    <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
      <div className="bg-emerald-500 h-full transition-all duration-700" style={{ width: `${stats.percentage}%` }}></div>
    </div>
  </div>
);

const QuickAction: React.FC<{ icon: any; label: string; color: string; onClick: () => void }> = ({ icon: Icon, label, color, onClick }) => {
  const colors: any = {
    emerald: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white',
    blue: 'bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white',
    purple: 'bg-purple-50 text-purple-600 hover:bg-purple-500 hover:text-white'
  };
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center p-12 rounded-[50px] transition-all border border-transparent shadow-sm active:scale-95 group ${colors[color]}`}>
      <div className="p-6 rounded-[24px] bg-white shadow-sm mb-6 group-hover:scale-110 transition-transform">
        <Icon size={40} />
      </div>
      <span className="font-black text-sm uppercase tracking-widest">{label}</span>
    </button>
  );
};

// --- Updated People Module ---

const PeopleModule: React.FC<any> = ({ students, setStudents, teachers, setTeachers, staffMembers, setStaffMembers, appUsers, setAppUsers, isAdmin, showToast }) => {
  const [activeSub, setActiveSub] = useState<'students' | 'teachers' | 'staff' | 'accounts'>('students');
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isSingleAddModalOpen, setIsSingleAddModalOpen] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [singleName, setSingleName] = useState('');
  const [singleRole, setSingleRole] = useState(STAFF_ROLES[0]);

  const handleBulkImport = () => {
    const names = bulkInput.split('\n').map(n => n.trim()).filter(n => n);
    if (activeSub === 'students') setStudents([...new Set([...students, ...names])]);
    else if (activeSub === 'teachers') setTeachers([...new Set([...teachers, ...names])]);
    else {
        const newStaff = names.map(n => ({ id: Math.random().toString(36).substr(2, 9), name: n, role: 'Apoio', isTeacher: false }));
        setStaffMembers([...staffMembers, ...newStaff]);
    }
    setBulkInput(''); setIsBulkModalOpen(false); showToast('Carga de dados finalizada.', 'success');
  };

  const handleSingleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleName) return;
    if (activeSub === 'students') setStudents([...new Set([...students, singleName])]);
    else if (activeSub === 'teachers') setTeachers([...new Set([...teachers, singleName])]);
    else {
        const newStaff: StaffMember = { id: Math.random().toString(36).substr(2, 9), name: singleName, role: singleRole, isTeacher: false };
        setStaffMembers([...staffMembers, newStaff]);
    }
    setSingleName(''); setIsSingleAddModalOpen(false); showToast('Adicionado com sucesso.', 'success');
  };

  const getRoleIcon = (role: string) => {
    switch(role) {
        case 'Cozinha': return <CookingPot size={24}/>;
        case 'Portaria': return <DoorOpen size={24}/>;
        case 'Secretária': return <Keyboard size={24}/>;
        case 'Limpeza': return <Brush size={24}/>;
        case 'Biblioteca': return <Library size={24}/>;
        case 'Artífice': return <Wrench size={24}/>;
        case 'Mecanografia': return <FileText size={24}/>;
        case 'Apoio': return <Users size={24}/>;
        case 'Integrada': return <CheckSquare size={24}/>;
        // Fix: Use UserIcon here to avoid conflict with User type
        default: return <UserIcon size={24}/>;
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col xl:flex-row justify-between items-center gap-6 bg-white p-6 rounded-[40px] shadow-sm border border-slate-100">
        <div className="flex flex-wrap p-1.5 bg-slate-200 rounded-[30px] justify-center">
          {(['students', 'teachers', 'staff', 'accounts'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveSub(tab)} className={`px-8 py-3 rounded-[24px] font-black text-[10px] uppercase tracking-widest transition-all ${activeSub === tab ? 'bg-white text-emerald-600 shadow-lg' : 'text-slate-500'}`}>
              {tab === 'students' ? 'Estudantes' : tab === 'teachers' ? 'Professores' : tab === 'staff' ? 'Funcionários' : 'Acessos'}
            </button>
          ))}
        </div>
        <div className="flex gap-4">
            <button onClick={() => setIsBulkModalOpen(true)} className="bg-slate-100 text-slate-600 px-8 py-3 rounded-[24px] font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 flex items-center gap-3">Importar Lista</button>
            <button onClick={() => setIsSingleAddModalOpen(true)} className="bg-emerald-600 text-white px-8 py-3 rounded-[24px] font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 shadow-xl active:scale-95 flex items-center gap-3"><Plus size={16}/> Novo Registro</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {activeSub === 'students' && students.map((name: string) => (
          <div key={name} className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 group">
             <div className="w-16 h-16 rounded-[24px] bg-emerald-50 flex items-center justify-center font-black text-2xl text-emerald-500 mb-6 group-hover:scale-110 transition-transform">
                <GraduationCap size={32}/>
             </div>
             <span className="font-black text-slate-700 tracking-tight block truncate">{name}</span>
             <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">Estudante Matriculado</p>
          </div>
        ))}

        {activeSub === 'teachers' && teachers.map((name: string) => (
          <div key={name} className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 group border-l-8 border-l-purple-500">
             <div className="w-16 h-16 rounded-[24px] bg-purple-50 flex items-center justify-center font-black text-2xl text-purple-500 mb-6 group-hover:rotate-12 transition-transform">
                <BookOpen size={32}/>
             </div>
             <span className="font-black text-slate-800 tracking-tight block truncate">{name}</span>
             <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mt-1">Corpo Docente</p>
          </div>
        ))}

        {activeSub === 'staff' && staffMembers.map((m: StaffMember) => (
          <div key={m.id} className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 group border-l-8 border-l-blue-500 hover:border-blue-200 transition-all">
             <div className="w-16 h-16 rounded-[24px] bg-blue-50 flex items-center justify-center text-blue-500 mb-6 group-hover:scale-105 transition-all">
                {getRoleIcon(m.role)}
             </div>
             <span className="font-black text-slate-800 tracking-tight block truncate">{m.name}</span>
             <div className="flex items-center gap-2 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"/>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{m.role}</p>
             </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} title="Carga em Lote">
        <textarea className="w-full h-80 p-8 rounded-[40px] bg-slate-50 border-2 border-slate-100 outline-none focus:bg-white focus:border-emerald-500 font-bold text-slate-700 transition-all resize-none shadow-inner" placeholder="Cole os nomes, um por linha..." value={bulkInput} onChange={(e) => setBulkInput(e.target.value)}/>
        <button onClick={handleBulkImport} className="w-full bg-emerald-600 text-white py-6 rounded-[30px] font-black uppercase tracking-widest text-[11px] mt-8">Salvar Dados</button>
      </Modal>

      <Modal isOpen={isSingleAddModalOpen} onClose={() => setIsSingleAddModalOpen(false)} title="Cadastro Individual">
         <form onSubmit={handleSingleAdd} className="space-y-6">
            <input className="w-full p-6 rounded-3xl bg-slate-50 border border-slate-100 font-bold text-lg" placeholder="Nome completo" required value={singleName} onChange={(e) => setSingleName(e.target.value)}/>
            {activeSub === 'staff' && (
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Atribuição Funcional</label>
                   <select className="w-full p-6 rounded-3xl bg-slate-50 border border-slate-100 font-bold" value={singleRole} onChange={(e: any) => setSingleRole(e.target.value)}>
                     {STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                   </select>
                </div>
            )}
            <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-[30px] font-black uppercase tracking-widest text-xs">Efetivar Cadastro</button>
         </form>
      </Modal>
    </div>
  );
};

const AttendanceModule: React.FC<any> = ({ attendance, setAttendance, teachers, staffMembers, isAdmin, showToast }) => {
  const [activeTab, setActiveTab] = useState<'staff' | 'teachers'>('staff');
  const [formData, setFormData] = useState<Partial<AttendanceRecord>>({ type: 'Falta', date: new Date().toISOString().split('T')[0], minutes: 0, isTeacher: false });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.personName) return;
    const newRecord: AttendanceRecord = { ...(formData as any), id: Math.random().toString(36).substr(2, 9), isTeacher: activeTab === 'teachers' };
    setAttendance([newRecord, ...attendance]);
    setFormData({ type: 'Falta', date: new Date().toISOString().split('T')[0], minutes: 0, isTeacher: activeTab === 'teachers' });
    showToast('Ausência arquivada.', 'success');
  };
  const filtered = attendance.filter((a: any) => activeTab === 'teachers' ? a.isTeacher : !a.isTeacher);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex p-2 bg-slate-200 rounded-[30px] w-fit mx-auto shadow-inner">
        <button onClick={() => setActiveTab('staff')} className={`px-12 py-4 rounded-[24px] font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'staff' ? 'bg-white text-emerald-600 shadow-xl' : 'text-slate-500'}`}>Monitoramento Staff</button>
        <button onClick={() => setActiveTab('teachers')} className={`px-12 py-4 rounded-[24px] font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'teachers' ? 'bg-white text-emerald-600 shadow-xl' : 'text-slate-500'}`}>Monitoramento Docente</button>
      </div>
      <section className="bg-white p-12 rounded-[50px] shadow-sm border border-slate-100">
         <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome</label>
               <input list="staff-list" className="w-full px-6 py-5 rounded-[24px] border border-slate-200 outline-none bg-slate-50 font-bold" value={formData.personName || ''} onChange={(e) => setFormData({...formData, personName: e.target.value})}/>
               <datalist id="staff-list">
                 {activeTab === 'teachers' ? teachers.map((n: string) => <option key={n} value={n}/>) : staffMembers.map((m: any) => <option key={m.id} value={m.name}/>)}
               </datalist>
            </div>
            <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Modalidade Falta</label>
               <select className="w-full px-6 py-5 rounded-[24px] border border-slate-200 outline-none bg-slate-50 font-bold" value={formData.type} onChange={(e: any) => setFormData({...formData, type: e.target.value})}>
                 {ATTENDANCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
               </select>
            </div>
            <div className="lg:col-span-2 flex items-end">
               <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black uppercase tracking-[0.3em] text-[10px] hover:bg-slate-800 shadow-xl active:scale-95 transition-all">Lançar Ausência no Sistema</button>
            </div>
         </form>
      </section>
    </div>
  );
};

// --- Rest of modules follow the previous logic with updated styling ---
const OccurrenceModule: React.FC<any> = ({ occurrences, setOccurrences, students, isAdmin, showToast, setSelectedOccurrence, setIsPrintModalOpen, setIsHistoryModalOpen }) => {
  const [formData, setFormData] = useState<Partial<Occurrence>>({ nature: OccurrenceNature.RECORD, type: OccurrenceType.PEDAGOGICAL, date: new Date().toISOString().split('T')[0], shift: 'Manhã', immediateAction: '', managementDecision: '' });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student || !formData.reason) return;
    const newOccurrence: Occurrence = { ...(formData as any), id: Math.random().toString(36).substr(2, 9), createdAt: Date.now() };
    setOccurrences([newOccurrence, ...occurrences]);
    setFormData({ nature: OccurrenceNature.RECORD, type: OccurrenceType.PEDAGOGICAL, date: new Date().toISOString().split('T')[0], shift: 'Manhã', immediateAction: '', managementDecision: '' });
    showToast('Registro processado com sucesso.', 'success');
  };
  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <section className="bg-white p-12 rounded-[50px] shadow-sm border border-slate-100 no-print">
         <h3 className="text-3xl font-black text-slate-800 mb-12 tracking-tight">Canal Disciplinar</h3>
         <form onSubmit={handleSubmit} className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estudante</label>
                  <input list="student-list" className="w-full px-6 py-5 rounded-[24px] border border-slate-200 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 bg-slate-50 font-bold" value={formData.student || ''} onChange={(e) => setFormData({...formData, student: e.target.value})}/>
                  <datalist id="student-list">{students.map((s: string) => <option key={s} value={s}/>)}</datalist>
               </div>
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Turma/Ano</label>
                  <input className="w-full px-6 py-5 rounded-[24px] border border-slate-200 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 bg-slate-50 font-bold" value={formData.className || ''} onChange={(e) => setFormData({...formData, className: e.target.value})}/>
               </div>
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Ocorrência</label>
                  <input type="date" className="w-full px-6 py-5 rounded-[24px] border border-slate-200 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 bg-slate-50 font-bold" value={formData.date || ''} onChange={(e) => setFormData({...formData, date: e.target.value})}/>
               </div>
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Turno Letivo</label>
                  <select className="w-full px-6 py-5 rounded-[24px] border border-slate-200 outline-none bg-slate-50 font-bold" value={formData.shift} onChange={(e: any) => setFormData({...formData, shift: e.target.value})}>
                    {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
               </div>
            </div>
            <div className="border-t pt-10">
               <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                  <div className="space-y-6">
                     <label className="text-xs font-black text-slate-800 uppercase tracking-widest">Protocolo de Registro</label>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className="flex items-center gap-4 cursor-pointer p-8 rounded-[32px] border-2 border-slate-50 bg-slate-50 hover:bg-white hover:border-emerald-200 transition-all group">
                           <input type="radio" name="nature" value={OccurrenceNature.RECORD} checked={formData.nature === OccurrenceNature.RECORD} onChange={(e: any) => setFormData({...formData, nature: e.target.value})} className="w-5 h-5 text-emerald-500"/>
                           <span className="font-black text-[10px] uppercase tracking-widest text-slate-700">Registro Simples</span>
                        </label>
                        <label className="flex items-center gap-4 cursor-pointer p-8 rounded-[32px] border-2 border-red-50 bg-red-50 hover:bg-white hover:border-red-200 transition-all group">
                           <input type="radio" name="nature" value={OccurrenceNature.WARNING} checked={formData.nature === OccurrenceNature.WARNING} onChange={(e: any) => setFormData({...formData, nature: e.target.value})} className="w-5 h-5 text-red-500"/>
                           <span className="font-black text-[10px] uppercase tracking-widest text-red-700 underline">Advertência</span>
                        </label>
                     </div>
                  </div>
                  <div className="space-y-6">
                     <label className="text-xs font-black text-slate-800 uppercase tracking-widest">Severidade & Tipificação</label>
                     <div className="grid grid-cols-3 gap-3">
                        <ClassificationBtn type={OccurrenceType.PEDAGOGICAL} current={formData.type} onClick={(t: any) => setFormData({...formData, type: t, reason: ''})} color="emerald" />
                        <ClassificationBtn type={OccurrenceType.BEHAVIORAL} current={formData.type} onClick={(t: any) => setFormData({...formData, type: t, reason: ''})} color="amber" />
                        <ClassificationBtn type={OccurrenceType.SERIOUS} current={formData.type} onClick={(t: any) => setFormData({...formData, type: t, reason: ''})} color="red" />
                     </div>
                     <select className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 bg-white font-bold text-slate-700 shadow-lg shadow-slate-100" value={formData.reason || ''} onChange={(e) => setFormData({...formData, reason: e.target.value})}>
                        <option value="">Selecione o motivo específico...</option>
                        {OCCURRENCE_REASONS[formData.type as OccurrenceType].map(r => <option key={r} value={r}>{r}</option>)}
                     </select>
                  </div>
               </div>
            </div>
            <button type="submit" className="w-full bg-emerald-600 text-white py-6 rounded-[32px] font-black uppercase tracking-[0.4em] text-[10px] hover:bg-emerald-700 shadow-2xl shadow-emerald-500/20 active:scale-[0.99] transition-all">Finalizar Relatório Disciplinar</button>
         </form>
      </section>
      <section className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b">
          <h3 className="text-xl font-bold text-slate-800 tracking-tight">Livro de Ocorrências</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estudante</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Natureza</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Documentação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {occurrences.map((o: Occurrence) => (
                <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="font-bold text-slate-800 text-lg leading-tight">{o.student}</div>
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-tighter">{o.className}</div>
                  </td>
                  <td className="px-8 py-6"><div className="text-slate-600 font-bold">{o.date}</div></td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${o.nature === OccurrenceNature.WARNING ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                      {o.nature === OccurrenceNature.WARNING ? 'Advertência' : 'Registro'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right flex justify-end gap-3">
                    <button onClick={() => { setSelectedOccurrence(o); setIsPrintModalOpen(true); }} className="p-3 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all shadow-sm border border-emerald-100"><Printer size={18} /></button>
                    <button onClick={() => { setSelectedOccurrence(o); setIsHistoryModalOpen(true); }} className="p-3 text-blue-500 hover:bg-blue-50 rounded-xl transition-all shadow-sm border border-blue-100"><ClipboardList size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

const DemandsModule: React.FC<any> = ({ demands, setDemands, showToast }) => {
  const [newDemand, setNewDemand] = useState('');
  const [refDate, setRefDate] = useState(new Date().toISOString().split('T')[0]);
  const [filter, setFilter] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const addDemand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDemand) return;
    const item: Demand = { id: Math.random().toString(36).substr(2, 9), title: newDemand, date: refDate, completed: false, createdAt: Date.now() };
    setDemands([item, ...demands]);
    setNewDemand('');
    showToast('Demanda operacional inserida.', 'success');
  };
  const toggleDemand = (id: string) => setDemands(demands.map((d: any) => d.id === id ? { ...d, completed: !d.completed } : d));
  const filteredDemands = demands.filter((d: Demand) => filter === 'daily' ? d.date === refDate : true);

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
         <h3 className="text-4xl font-black text-slate-800 tracking-tighter">Agenda Estratégica</h3>
         <div className="flex p-1.5 bg-slate-100 rounded-[25px] w-fit border border-slate-200/50">
           {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((f) => (
             <button key={f} onClick={() => setFilter(f)} className={`px-8 py-3 rounded-[20px] font-black text-[10px] uppercase tracking-widest transition-all ${filter === f ? 'bg-white text-blue-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>
               {f === 'daily' ? 'Diário' : f === 'weekly' ? 'Semanal' : f === 'monthly' ? 'Mensal' : 'Anual'}
             </button>
           ))}
         </div>
      </div>
      <section className="bg-white p-12 rounded-[50px] shadow-sm border border-slate-100">
         <form onSubmit={addDemand} className="space-y-8">
            <textarea className="w-full px-10 py-8 rounded-[40px] border-2 border-slate-50 outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 bg-slate-50 text-slate-700 font-bold text-xl resize-none shadow-inner" rows={3} placeholder="Descreva a meta operacional do dia..." value={newDemand} onChange={(e) => setNewDemand(e.target.value)}/>
            <button type="submit" className="w-full bg-[#5D5FEF] text-white py-6 rounded-[30px] font-black uppercase tracking-[0.5em] text-[10px] hover:bg-[#4E50E0] shadow-2xl active:scale-[0.99] transition-all">Ativar Demanda na Grade</button>
         </form>
      </section>
      <div className="space-y-6">
        {filteredDemands.map((d: Demand) => (
          <div key={d.id} className={`flex items-center group p-8 rounded-[40px] transition-all border-2 ${d.completed ? 'bg-emerald-50/20 border-emerald-100/50' : 'bg-white border-slate-50 hover:border-slate-200 shadow-sm'}`}>
            <button onClick={() => toggleDemand(d.id)} className={`p-2 rounded-full transition-all ${d.completed ? 'text-emerald-500 scale-125' : 'text-slate-100 hover:text-blue-500'}`}>
              {d.completed ? <CheckCircle2 size={40} /> : <Circle size={40} />}
            </button>
            <div className="flex-1 ml-10">
              <p className={`font-black text-2xl tracking-tighter transition-all ${d.completed ? 'line-through text-slate-300 italic opacity-50' : 'text-slate-800'}`}>{d.title}</p>
              <div className="flex items-center gap-4 mt-2"><span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">{d.date}</span></div>
            </div>
            <button onClick={() => setDemands(demands.filter((item: any) => item.id !== d.id))} className="p-4 text-slate-50 group-hover:text-red-300 transition-all hover:bg-red-50 rounded-3xl"><Trash2 size={24}/></button>
          </div>
        ))}
      </div>
    </div>
  );
};

const GoalsModule: React.FC<any> = ({ goals, setGoals, showToast }) => {
  const [newGoal, setNewGoal] = useState('');
  const addGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal) return;
    const item: Goal = { id: Math.random().toString(36).substr(2, 9), text: newGoal, completed: false, createdAt: Date.now() };
    setGoals([item, ...goals]);
    setNewGoal('');
    showToast('Meta estratégica adicionada.', 'success');
  };
  const toggleGoal = (id: string) => setGoals(goals.map((g: any) => g.id === id ? { ...g, completed: !g.completed } : g));
  const deleteGoal = (id: string) => { setGoals(goals.filter((g: any) => g.id !== id)); showToast('Meta removida.', 'error'); };
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
      <section className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
        <h3 className="text-3xl font-black text-slate-800 mb-10 tracking-tight">Foco & Estratégia</h3>
        <form onSubmit={addGoal} className="flex gap-4 mb-12">
          <input className="flex-1 px-8 py-5 rounded-3xl border border-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-slate-50 font-bold" placeholder="Digite uma nova meta institucional..." value={newGoal} onChange={(e) => setNewGoal(e.target.value)}/>
          <button type="submit" className="bg-slate-900 text-white px-10 rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 shadow-xl transition-all active:scale-95">Adicionar</button>
        </form>
        <div className="space-y-4">
          {goals.map((g: Goal) => (
            <div key={g.id} className="flex items-center group bg-slate-50/50 p-6 rounded-[32px] border-2 border-transparent hover:border-blue-100 hover:bg-white transition-all shadow-sm">
              <div onClick={() => toggleGoal(g.id)} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${g.completed ? 'bg-blue-600 border-blue-600' : 'border-slate-200 hover:border-blue-400 bg-white'}`}>
                {g.completed && <CheckCircle2 size={18} className="text-white" />}
              </div>
              <p className={`flex-1 ml-6 font-black text-lg transition-all ${g.completed ? 'line-through text-slate-300 italic' : 'text-slate-700'}`}>{g.text}</p>
              <button onClick={() => deleteGoal(g.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-200 hover:text-red-500 transition-all"><Trash2 size={20}/></button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const ParentMeetingsModule: React.FC<any> = ({ meetings, setMeetings, students, isAdmin, showToast, setSelectedMeeting, setIsMeetingPrintModalOpen }) => {
  const [formData, setFormData] = useState<Partial<ParentMeeting>>({ date: new Date().toISOString().split('T')[0], time: '' });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student || !formData.reason) return;
    const newMeeting: ParentMeeting = { ...(formData as any), id: Math.random().toString(36).substr(2, 9), createdAt: Date.now() };
    setMeetings([newMeeting, ...meetings]);
    setFormData({ date: new Date().toISOString().split('T')[0], time: '', student: '', guardian: '', scheduledBy: '', attendedBy: '', reason: '', notes: '' });
    showToast('Atendimento registrado.', 'success');
  };
  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <section className="bg-white p-10 rounded-[32px] shadow-sm border border-slate-100 no-print">
        <h3 className="text-2xl font-black text-slate-800 mb-8 tracking-tight">Atendimentos e Reuniões</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <input list="student-list" className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50 font-bold" placeholder="Aluno" value={formData.student || ''} onChange={(e) => setFormData({...formData, student: e.target.value})}/>
             <input className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50 font-bold" placeholder="Responsável" value={formData.guardian || ''} onChange={(e) => setFormData({...formData, guardian: e.target.value})}/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <input className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50 font-bold" placeholder="Solicitado por" value={formData.scheduledBy || ''} onChange={(e) => setFormData({...formData, scheduledBy: e.target.value})}/>
             <input type="date" className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50 font-bold" value={formData.date || ''} onChange={(e) => setFormData({...formData, date: e.target.value})}/>
             <input type="time" className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50 font-bold" value={formData.time || ''} onChange={(e) => setFormData({...formData, time: e.target.value})}/>
          </div>
          <input className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50 font-bold" placeholder="Motivo" value={formData.reason || ''} onChange={(e) => setFormData({...formData, reason: e.target.value})}/>
          <textarea className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none bg-slate-50 font-bold h-40 resize-none" placeholder="Síntese e Combinados" value={formData.notes || ''} onChange={(e) => setFormData({...formData, notes: e.target.value})}></textarea>
          <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs">Registrar Atendimento</button>
        </form>
      </section>
    </div>
  );
};

// --- Generic Helpers ---
const ClassificationBtn: React.FC<{ type: OccurrenceType; current: any; onClick: any; color: string }> = ({ type, current, onClick, color }) => {
  const active = current === type;
  const colors: any = {
    emerald: active ? 'bg-emerald-600 text-white shadow-emerald-500/30' : 'bg-white text-emerald-600 border-emerald-200',
    amber: active ? 'bg-amber-500 text-white shadow-amber-500/30' : 'bg-white text-amber-600 border-amber-200',
    red: active ? 'bg-red-600 text-white shadow-red-500/30' : 'bg-white text-red-600 border-red-200'
  };
  return (
    <button type="button" onClick={() => onClick(type)} className={`py-4 rounded-2xl border font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 ${colors[color]}`}>
      {type}
    </button>
  );
};

const CalendarModule: React.FC<any> = () => (
  <div className="bg-white p-12 rounded-[60px] shadow-sm border border-slate-100 text-center py-48 relative overflow-hidden">
    <CalendarIcon size={100} className="mx-auto text-emerald-100 mb-10" />
    <h3 className="text-5xl font-black text-slate-800 mb-6 tracking-tighter">Cronograma Institucional</h3>
    <p className="text-slate-400 font-medium italic text-lg">Consolidando o calendário letivo anual...</p>
  </div>
);

const FinanceModule: React.FC<any> = () => (
  <div className="bg-white p-12 rounded-[60px] shadow-sm border border-slate-100 text-center py-48 relative overflow-hidden">
    <DollarSign size={100} className="mx-auto text-blue-100 mb-10" />
    <h3 className="text-5xl font-black text-slate-800 mb-6 tracking-tighter">Balanço Financeiro</h3>
    <p className="text-slate-400 font-medium italic text-lg">Processando fluxo de caixa e fundo de obras...</p>
  </div>
);

const DocumentsModule: React.FC<any> = () => (
  <div className="bg-white p-12 rounded-[60px] shadow-sm border border-slate-100 text-center py-48 relative overflow-hidden">
    <FileText size={100} className="mx-auto text-slate-100 mb-10" />
    <h3 className="text-5xl font-black text-slate-800 mb-6 tracking-tighter">Repositório Normativo</h3>
    <p className="text-slate-400 font-medium italic text-lg">Organizando leis, decretos e portarias ministeriais...</p>
  </div>
);

const PrintOfficialForm: React.FC<{ occurrence: Occurrence; onClose: () => void }> = ({ occurrence }) => (
  <div className="bg-white border-8 border-slate-900 p-16 text-slate-900 font-serif">
    <div className="text-center border-b-8 border-slate-900 pb-12 mb-12">
      <h2 className="text-5xl font-black uppercase tracking-tighter">Escola Municipal EMDRA</h2>
      <p className="text-xs font-black tracking-[0.6em] mt-4 opacity-50 underline">SISTEMA DISCIPLINAR UNIFICADO</p>
    </div>
    <div className="flex justify-between mb-16 font-black text-lg uppercase"><p>Ref: #SD{occurrence.id.toUpperCase()}</p><p>Data: {occurrence.date}</p></div>
    <div className="mb-16 p-10 bg-slate-50 border-4 border-slate-100 rounded-[40px]"><p className="italic text-lg font-medium">"{occurrence.immediateAction}"</p></div>
    <button onClick={() => window.print()} className="bg-slate-900 text-white px-16 py-6 rounded-[30px] font-black uppercase no-print">Imprimir</button>
  </div>
);

const PrintMeetingAta: React.FC<{ meeting: ParentMeeting; onClose: () => void }> = ({ meeting }) => (
  <div className="bg-white border-8 border-slate-900 p-16 text-slate-900 font-serif">
    <h2 className="text-5xl font-black uppercase text-center mb-12">Ata EMDRA</h2>
    <p className="text-xl leading-loose italic">{meeting.notes}</p>
    <button onClick={() => window.print()} className="bg-slate-900 text-white px-16 py-6 rounded-[30px] font-black uppercase no-print mt-12">Imprimir</button>
  </div>
);

const StudentHistory: React.FC<{ student: string; allOccurrences: Occurrence[]; onClose: () => void }> = ({ student, allOccurrences }) => {
  const filtered = allOccurrences.filter(o => o.student === student);
  return (
    <div className="space-y-12">
       <div className="grid grid-cols-3 gap-8 text-center">
          <div className="bg-emerald-50 p-8 rounded-[40px]"><p className="text-[10px] font-black uppercase mb-2">Registros</p><p className="text-5xl font-black">{filtered.length}</p></div>
       </div>
    </div>
  );
};

export default App;
