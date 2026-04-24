import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { signOut } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { LogOut, Trophy, Calendar, Zap, GraduationCap, Star } from 'lucide-react';

const GlassCard = ({ children, className = "" }) => (
  <div className={`bg-[#111111]/80 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-10 shadow-2xl ${className}`}>
    {children}
  </div>
);

export default function StudentCabinet({ user }) {
  const [studentData, setStudentData] = useState(null);

  useEffect(() => {
    // Поиск данных ученика по email
    const q = query(
      collection(db, "students"), 
      where("email", "==", user.email.toLowerCase())
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setStudentData(snapshot.docs[0].data());
      }
    }, (error) => {
      console.error("Ошибка получения данных:", error);
    });

    return () => unsub();
  }, [user]);

  return (
    <div className="max-w-6xl mx-auto p-8 lg:p-20 animate-in fade-in duration-700">
      <header className="flex justify-between items-center mb-16">
        <div>
          <h1 className="text-5xl font-black italic uppercase tracking-tighter">
            Student <span className="text-[#2ecc71]">Terminal</span>
          </h1>
          <p className="text-gray-600 font-black text-[9px] uppercase tracking-[0.4em] mt-2">
            ID: {user.email}
          </p>
        </div>
        <button 
          onClick={() => signOut(auth)} 
          className="p-5 bg-white/5 rounded-3xl text-gray-500 hover:text-white transition-all"
        >
          <LogOut size={20}/>
        </button>
      </header>

      {studentData ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Блок баланса */}
          <GlassCard className="lg:col-span-1 border-[#2ecc71]/20 bg-[#2ecc71]/5 relative overflow-hidden">
            <Trophy className="absolute -right-6 -bottom-6 text-[#2ecc71]/10" size={180} />
            <p className="text-[10px] font-black uppercase text-gray-500 mb-10 tracking-widest">Lessons Balance</p>
            <div className="flex items-end gap-4 mb-8">
              <span className="text-9xl font-black italic text-[#2ecc71] leading-none">
                {studentData.lessonsLeft}
              </span>
              <span className="text-xl font-black uppercase mb-4 italic opacity-30">Units</span>
            </div>
            <div className="flex items-center gap-2 text-[#2ecc71]">
              <Star size={14} fill="currentColor"/>
              <span className="text-[10px] font-black uppercase tracking-widest">Active Plan: {studentData.subject}</span>
            </div>
          </GlassCard>

          {/* Блок расписания */}
          <div className="lg:col-span-2 space-y-10">
            <GlassCard>
              <div className="flex items-center gap-4 mb-8">
                <Calendar className="text-[#2ecc71]" size={20}/>
                <h3 className="text-xl font-black italic uppercase">Schedule</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                  <div key={day} className={`p-5 rounded-3xl border ${studentData.schedule?.[day] ? 'border-[#2ecc71]/40 bg-[#2ecc71]/10' : 'border-white/5 opacity-20'}`}>
                    <p className="text-[10px] font-black text-gray-500 mb-2">{day}</p>
                    <p className="font-mono text-sm text-[#2ecc71]">{studentData.schedule?.[day] || '--:--'}</p>
                  </div>
                ))}
              </div>
            </GlassCard>

            <div className="bg-[#2ecc71] p-8 rounded-[2.5rem] text-black flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black uppercase opacity-60">System Status</p>
                <p className="text-xl font-black italic uppercase">Everything is Nominal</p>
              </div>
              <Zap size={32} fill="currentColor" />
            </div>
          </div>
        </div>
      ) : (
        <div className="py-32 bg-[#111] border border-dashed border-white/10 rounded-[4rem] text-center">
          <GraduationCap size={64} className="mx-auto text-gray-800 mb-6" />
          <h2 className="text-2xl font-black italic uppercase text-gray-600">Waiting for Sync</h2>
          <p className="text-[10px] font-bold text-gray-700 uppercase mt-4 tracking-widest max-w-xs mx-auto">
            Ваш профиль еще не активирован учителем.
          </p>
        </div>
      )}
    </div>
  );
}