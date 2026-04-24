import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { 
  signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  onAuthStateChanged, signOut 
} from "firebase/auth";
import { 
  collection, addDoc, query, where, onSnapshot, 
  doc, updateDoc, increment, serverTimestamp, deleteDoc 
} from "firebase/firestore";
import { 
  LayoutDashboard, Users, Wallet, Plus, X, Layers, LogOut, 
  ChevronRight, ChevronLeft, Star, TrendingUp, Bell, Search, Clock, Trash2, Calendar
} from 'lucide-react';

// --- UI KIT (Стили с анимациями) ---
const GlassCard = ({ children, className = "", onClick }) => (
  <div 
    onClick={onClick} 
    className={`bg-[#111111]/70 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-8 
    hover:border-[#2ecc71]/40 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4),0_0_20px_rgba(46,204,113,0.05)] 
    transition-all duration-500 ease-out cursor-pointer group shadow-2xl ${className}`}
  >
    {children}
  </div>
);

const NeonButton = ({ children, onClick, type = "button", variant = "primary" }) => {
  const base = "px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 active:scale-90 hover:scale-105";
  const styles = {
    primary: "bg-[#2ecc71] text-black shadow-[0_10px_20px_rgba(46,204,113,0.2)] hover:shadow-[0_0_30px_rgba(46,204,113,0.5)]",
    danger: "bg-white/5 text-red-500 border border-white/10 hover:bg-red-500 hover:text-white"
  };
  return <button type={type} onClick={onClick} className={`${base} ${styles[variant]}`}>{children}</button>
};

// --- MAIN APPLICATION ---
export default function Intellika() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dash');
  const [view, setView] = useState('main');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modal, setModal] = useState(null);
  
  const [students, setStudents] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // Auth Observer
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Firestore Sync
  useEffect(() => {
    if (!user) return;
    const qS = query(collection(db, "students"), where("userId", "==", user.uid));
    const unsubS = onSnapshot(qS, (s) => {
      const data = s.docs.map(d => ({ ...d.data(), id: d.id }));
      setStudents(data);
      if (selectedStudent) {
        const updated = data.find(st => st.id === selectedStudent.id);
        if (updated) setSelectedStudent(updated);
      }
    });
    
    const qT = query(collection(db, "transactions"), where("userId", "==", user.uid));
    const unsubT = onSnapshot(qT, (s) => setTransactions(s.docs.map(d => ({ ...d.data(), id: d.id }))));

    return () => { unsubS(); unsubT(); };
  }, [user, selectedStudent?.id]);

  // --- ACTIONS ---
  const addStudent = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await addDoc(collection(db, "students"), {
      name: fd.get('name'),
      subject: fd.get('subject'),
      rate: Number(fd.get('rate')),
      balance: 0,
      lessonsLeft: 0,
      schedule: {},
      userId: user.uid,
      createdAt: serverTimestamp()
    });
    setModal(null);
  };

  const handlePayment = async (amount) => {
    if (!amount || !selectedStudent) return;
    await addDoc(collection(db, "transactions"), {
      studentId: selectedStudent.id,
      amount: Number(amount),
      userId: user.uid,
      date: new Date().toLocaleDateString()
    });
    await updateDoc(doc(db, "students", selectedStudent.id), {
      balance: increment(Number(amount)),
      lessonsLeft: increment(Math.floor(Number(amount) / selectedStudent.rate))
    });
    setModal(null);
  };

  const updateSchedule = async (day, time) => {
    const newSch = { ...(selectedStudent.schedule || {}) };
    if (time === "") delete newSch[day];
    else newSch[day] = time;
    await updateDoc(doc(db, "students", selectedStudent.id), { schedule: newSch });
  };

  const deleteStudent = async (sid) => {
    if (window.confirm("Удалить профиль безвозвратно?")) {
      await deleteDoc(doc(db, "students", sid));
      setView('main');
      setSelectedStudent(null);
    }
  };

  if (loading) return (
    <div className="h-screen bg-[#050505] flex items-center justify-center">
      <div className="text-[#2ecc71] font-black animate-pulse uppercase tracking-[0.5em]">System Loading...</div>
    </div>
  );

  if (!user) return <AuthScreen />;

  return (
    <div className="min-h-screen bg-[#070707] text-white selection:bg-[#2ecc71]/30">
      {/* SIDEBAR */}
      <aside className="fixed left-0 h-full w-24 bg-black/40 backdrop-blur-3xl border-r border-white/5 flex flex-col items-center py-10 z-[60] hidden lg:flex">
        <div className="bg-[#2ecc71] p-4 rounded-2xl mb-12 shadow-[0_0_30px_rgba(46,204,113,0.2)] hover:scale-110 transition-transform">
          <Layers size={24} className="text-black" />
        </div>
        <nav className="flex flex-col gap-10">
          <NavBtn icon={LayoutDashboard} active={activeTab === 'dash'} onClick={() => {setActiveTab('dash'); setView('main');}} />
          <NavBtn icon={Users} active={activeTab === 'students'} onClick={() => {setActiveTab('students'); setView('main');}} />
        </nav>
        <button onClick={() => signOut(auth)} className="mt-auto p-4 text-gray-600 hover:text-red-500 hover:scale-125 transition-all duration-300">
          <LogOut size={22}/>
        </button>
      </aside>

      {/* HEADER */}
      <header className="lg:pl-24 h-24 sticky top-0 z-50 bg-[#070707]/80 backdrop-blur-xl border-b border-white/5 px-12 flex justify-between items-center">
        <h2 className="text-2xl font-black italic tracking-tighter uppercase">Intellika <span className="text-[10px] text-[#2ecc71] ml-2">v3.2</span></h2>
        <div className="flex items-center gap-6">
          <p className="text-xs font-bold text-gray-400 hidden sm:block">{user.email}</p>
          <div className="w-12 h-12 bg-[#111] border border-white/10 rounded-2xl flex items-center justify-center font-black italic">IN</div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="lg:pl-24 p-8 lg:p-16 relative z-10">
        <div className="max-w-7xl mx-auto">
          {view === 'main' ? (
            <div className="animate-in fade-in slide-in-from-bottom-10 duration-700">
              {activeTab === 'dash' && <DashboardView students={students} transactions={transactions} />}
              {activeTab === 'students' && (
                <div className="space-y-12">
                  <div className="flex justify-between items-end">
                    <h3 className="text-4xl font-black italic uppercase tracking-tighter">Студенты</h3>
                    <NeonButton onClick={() => setModal('add-s')}><Plus size={18}/> Добавить</NeonButton>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {students.map((s, i) => (
                      <div key={s.id} className="animate-in fade-in slide-in-from-bottom-5 duration-700" style={{ animationDelay: `${i * 100}ms` }}>
                        <GlassCard onClick={() => {setSelectedStudent(s); setView('profile');}}>
                          <div className="w-14 h-14 bg-[#1a1a1a] border border-white/5 rounded-2xl flex items-center justify-center text-[#2ecc71] text-xl font-black mb-6 group-hover:bg-[#2ecc71] group-hover:text-black transition-all">
                            {s.name[0]}
                          </div>
                          <h4 className="text-2xl font-black italic mb-1">{s.name}</h4>
                          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{s.subject}</p>
                          <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
                             <div className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-full border ${s.lessonsLeft < 2 ? 'border-red-500/20 text-red-500 bg-red-500/5' : 'border-[#2ecc71]/20 text-[#2ecc71] bg-[#2ecc71]/5'}`}>
                              {s.lessonsLeft} уроков
                             </div>
                             <ChevronRight size={20} className="text-gray-700 group-hover:text-[#2ecc71] group-hover:translate-x-2 transition-all" />
                          </div>
                        </GlassCard>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <ProfileView 
              student={selectedStudent} 
              transactions={transactions.filter(t => t.studentId === selectedStudent.id)} 
              onBack={() => setView('main')} 
              onPay={() => setModal('pay')}
              onDelete={deleteStudent}
              onUpdateSchedule={updateSchedule}
            />
          )}
        </div>
      </main>

      {/* MODALS */}
      {modal && (
        <Modal title={modal === 'add-s' ? "Новый ученик" : "Зачислить оплату"} onClose={() => setModal(null)}>
          {modal === 'add-s' ? (
            <form onSubmit={addStudent} className="space-y-6">
              <input name="name" placeholder="ФИО" required className="w-full bg-[#1a1a1a] border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-[#2ecc71] font-bold text-xs uppercase" />
              <div className="grid grid-cols-2 gap-4">
                <input name="subject" placeholder="ПРЕДМЕТ" required className="w-full bg-[#1a1a1a] border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-[#2ecc71] font-bold text-xs uppercase" />
                <input name="rate" type="number" placeholder="СТАВКА ₽" required className="w-full bg-[#1a1a1a] border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-[#2ecc71] font-bold text-xs uppercase" />
              </div>
              <NeonButton type="submit" className="w-full">Создать профиль</NeonButton>
            </form>
          ) : (
            <div className="text-center space-y-10">
              <input id="pAm" type="number" placeholder="0" autoFocus className="bg-transparent text-8xl font-black text-[#2ecc71] text-center w-full outline-none animate-pulse" />
              <NeonButton onClick={() => handlePayment(document.getElementById('pAm').value)} className="w-full">Подтвердить транзакцию</NeonButton>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

// --- COMPONENTS ---

function ProfileView({ student, transactions, onBack, onPay, onDelete, onUpdateSchedule }) {
  const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  return (
    <div className="animate-in fade-in zoom-in-95 duration-700 space-y-12">
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="text-gray-600 hover:text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2 group">
          <ChevronLeft size={16} className="group-hover:-translate-x-2 transition-transform"/> Назад к списку
        </button>
        <button onClick={() => onDelete(student.id)} className="text-red-500/40 hover:text-red-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-colors">
          <Trash2 size={14}/> Удалить профиль
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="space-y-8">
          <GlassCard className="text-center border-[#2ecc71]/20">
            <div className="w-24 h-24 bg-[#2ecc71] rounded-3xl flex items-center justify-center text-black text-4xl font-black mx-auto mb-6 shadow-2xl">{student.name[0]}</div>
            <h3 className="text-3xl font-black italic mb-1">{student.name}</h3>
            <p className="text-[11px] text-[#2ecc71] font-black uppercase tracking-[0.4em] mb-12">{student.subject}</p>
            <NeonButton onClick={onPay} className="w-full">Внести оплату</NeonButton>
          </GlassCard>

          <div className="bg-[#111] border border-white/5 rounded-[3rem] p-8 space-y-6 shadow-xl">
            <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] flex items-center gap-2">
              <Calendar size={14} className="text-[#2ecc71]"/> Расписание занятий
            </h4>
            <div className="space-y-4">
              {days.map(day => (
                <div key={day} className="flex items-center justify-between gap-4">
                  <span className={`text-[10px] font-black uppercase ${student.schedule?.[day] ? 'text-white' : 'text-gray-700'}`}>{day}</span>
                  <input 
                    type="text" 
                    placeholder="--:--" 
                    value={student.schedule?.[day] || ""}
                    onChange={(e) => onUpdateSchedule(day, e.target.value)}
                    className="bg-transparent border-b border-white/5 focus:border-[#2ecc71] text-right text-xs font-mono outline-none w-24 transition-all text-[#2ecc71]"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-2 bg-[#111] border border-white/5 rounded-[3.5rem] p-10 h-fit">
          <h4 className="text-xl font-black italic uppercase mb-10 flex items-center gap-4"><Clock size={20} className="text-[#2ecc71]"/> История платежей</h4>
          <div className="space-y-4">
            {transactions.map((t, i) => (
              <div key={i} className="flex justify-between items-center p-6 bg-white/[0.02] rounded-[2rem] border border-white/5 hover:bg-white/[0.04] transition-all duration-300">
                <span className="text-white font-mono text-sm">{t.date}</span>
                <span className="text-2xl font-black text-[#2ecc71] italic">+{t.amount} ₽</span>
              </div>
            ))}
            {transactions.length === 0 && <p className="text-center py-10 text-gray-800 uppercase font-black text-[10px] tracking-widest">История транзакций пуста</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardView({ students, transactions }) {
  const total = transactions.reduce((a, b) => a + b.amount, 0);
  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-[#111] border border-white/5 rounded-[3rem] p-12 hover:border-[#2ecc71]/20 transition-colors duration-700 group relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#2ecc71]/5 blur-[100px] group-hover:bg-[#2ecc71]/10 transition-all duration-1000"></div>
          <h4 className="text-[10px] font-black uppercase text-gray-600 mb-4 tracking-widest">Revenue Status</h4>
          <p className="text-8xl font-black italic tracking-tighter text-[#2ecc71]">{total.toLocaleString()} ₽</p>
        </div>
        <div className="bg-[#2ecc71] p-12 rounded-[3rem] text-black shadow-2xl flex flex-col justify-center items-center hover:rotate-2 transition-transform duration-500">
          <p className="text-[10px] font-black uppercase opacity-60 mb-1">Students Count</p>
          <p className="text-7xl font-black italic tracking-tighter">{students.length}</p>
        </div>
      </div>
    </div>
  );
}

function NavBtn({ icon: Icon, active, onClick }) {
  return (
    <button onClick={onClick} className={`p-4 rounded-2xl transition-all duration-300 group ${active ? 'bg-[#2ecc71] text-black shadow-xl' : 'text-gray-600 hover:text-white hover:bg-white/5'}`}>
      <Icon size={24} className={active ? 'scale-110' : 'group-hover:scale-125 transition-transform'} />
    </button>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-[#111] border border-white/10 w-full max-w-lg rounded-[3.5rem] p-12 relative animate-in zoom-in-95 duration-500">
        <button onClick={onClose} className="absolute top-10 right-10 text-gray-600 hover:text-white hover:rotate-90 transition-all duration-300"><X size={24}/></button>
        <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-10 text-white">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function AuthScreen() {
  const [mode, setMode] = useState('login');
  const [err, setErr] = useState('');
  const handleAuth = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      if (mode === 'login') await signInWithEmailAndPassword(auth, e.target.email.value, e.target.password.value);
      else await createUserWithEmailAndPassword(auth, e.target.email.value, e.target.password.value);
    } catch (e) { setErr("Access Denied. Check credentials."); }
  };
  return (
    <div className="h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(46,204,113,0.1)_0%,transparent_70%)] pointer-events-none"></div>
      <div className="w-full max-w-[440px] bg-[#0d0d0d] border border-white/[0.05] rounded-[4rem] p-16 shadow-2xl relative z-10 animate-in zoom-in-95 duration-1000">
        <div className="flex flex-col items-center mb-16">
           <div className="bg-[#2ecc71] p-5 rounded-[2rem] mb-6 shadow-2xl"><Layers size={40} className="text-black" /></div>
           <h1 className="text-5xl font-black italic text-white uppercase">Intellika</h1>
        </div>
        <form onSubmit={handleAuth} className="space-y-6">
          <input name="email" type="email" placeholder="EMAIL" required className="w-full bg-[#151515] border border-white/[0.05] p-6 rounded-3xl text-white text-center outline-none focus:border-[#2ecc71]/50 text-xs font-black uppercase tracking-widest" />
          <input name="password" type="password" placeholder="SECURITY CODE" required className="w-full bg-[#151515] border border-white/[0.05] p-6 rounded-3xl text-white text-center outline-none focus:border-[#2ecc71]/50 text-xs font-black uppercase tracking-widest" />
          {err && <p className="text-red-500 text-[9px] font-black uppercase text-center bg-red-500/5 py-4 rounded-2xl border border-red-500/10">{err}</p>}
          <NeonButton type="submit" className="w-full py-6">Authorize</NeonButton>
        </form>
        <button onClick={() => setMode(mode === 'login' ? 'reg' : 'login')} className="w-full mt-12 text-[10px] font-black text-gray-600 hover:text-white transition-all text-center uppercase tracking-[0.2em]">
          {mode === 'login' ? 'Создать терминал доступа' : 'Вернуться к авторизации'}
        </button>
      </div>
    </div>
  );
}