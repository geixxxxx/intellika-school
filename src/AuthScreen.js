import React, { useState } from 'react';
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Layers, User, GraduationCap } from 'lucide-react';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('student'); // По умолчанию 'student'
  const [error, setError] = useState("");

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    const email = e.target.email.value;
    const pass = e.target.password.value;

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, pass);
      } else {
        const res = await createUserWithEmailAndPassword(auth, email, pass);
        // Сразу записываем роль в базу при создании аккаунта
        await setDoc(doc(db, "users", res.user.uid), {
          email: email.toLowerCase(),
          role: role,
          createdAt: new Date()
        });
      }
    } catch (err) {
      setError("Ошибка: проверьте почту и пароль");
    }
  };

  return (
    <div className="h-screen bg-[#050505] flex items-center justify-center p-6">
      <div className="w-full max-w-[400px] bg-[#0d0d0d] border border-white/5 rounded-[4rem] p-12 shadow-2xl">
        <div className="bg-[#2ecc71] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-10">
          <Layers className="text-black" size={32}/>
        </div>
        
        <h1 className="text-4xl font-black italic uppercase text-center mb-8 tracking-tighter text-white">
          Intellika <span className="text-[#2ecc71]">OS</span>
        </h1>

        {/* Переключатель роли (только при регистрации) */}
        {!isLogin && (
          <div className="flex bg-[#151515] p-1 rounded-2xl mb-6">
            <button 
              onClick={() => setRole('student')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${role === 'student' ? 'bg-[#2ecc71] text-black' : 'text-gray-500'}`}
            >
              <User size={14}/> Ученик
            </button>
            <button 
              onClick={() => setRole('teacher')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${role === 'teacher' ? 'bg-[#2ecc71] text-black' : 'text-gray-500'}`}
            >
              <GraduationCap size={14}/> Учитель
            </button>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <input name="email" type="email" placeholder="EMAIL" required className="w-full bg-[#151515] border border-white/5 p-6 rounded-[2rem] outline-none focus:border-[#2ecc71] font-black text-[10px] uppercase text-white text-center" />
          <input name="password" type="password" placeholder="PASSWORD" required className="w-full bg-[#151515] border border-white/5 p-6 rounded-[2rem] outline-none focus:border-[#2ecc71] font-black text-[10px] uppercase text-white text-center" />
          
          {error && <p className="text-red-500 text-[9px] font-black uppercase text-center">{error}</p>}
          
          <button type="submit" className="w-full bg-[#2ecc71] text-black py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-widest hover:shadow-[0_0_30px_rgba(46,204,113,0.3)] transition-all">
            {isLogin ? 'Войти в систему' : 'Зарегистрироваться'}
          </button>
        </form>

        <button 
          onClick={() => setIsLogin(!isLogin)} 
          className="w-full mt-8 text-[9px] font-black text-gray-600 hover:text-white uppercase tracking-widest transition-all"
        >
          {isLogin ? 'Создать новый аккаунт' : 'Уже есть профиль? Войти'}
        </button>
      </div>
    </div>
  );
}