import React, { useState, useEffect } from 'react';
import { Sun, Moon, CheckCircle, User, CalendarDays, ChevronRight, ArrowLeft, Award, Sparkles, Leaf, ThumbsUp, Pencil, X, Trash2, AlertTriangle } from 'lucide-react';

import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCp9jco2n-T7woV_WBEVzD4chdOMlI-OjM",
  authDomain: "diamond-app-3a7e5.firebaseapp.com",
  projectId: "diamond-app-3a7e5",
  storageBucket: "diamond-app-3a7e5.firebasestorage.app",
  messagingSenderId: "1017580229377",
  appId: "1:1017580229377:web:ba156412c54d9b439d0100"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'diamond-app-3a7e5';

// ✅ 新增「玟晴」、截止日改為 2026.04.20
const USERS = ['淨蓉', '威佃', '邦邦', '左小宇', 'soso', '玟晴'];
const END_DATE = new Date('2026-04-20T23:59:59');

const PRODUCTS = [
  { id: 1, name: "珍鑽潔顏洗卸凝露", short: "洗卸凝露", type: "both" },
  { id: 2, name: "珍鑽矽晶微導霜", short: "微導霜", type: "both" },
  { id: 3, name: "珍鑽時光煥彩亮顏C粉", short: "亮顏C粉", type: "both" },
  { id: 4, name: "珍鑽美肌抗皺修復霜", short: "修復霜", type: "both" },
  { id: 5, name: "珍鑽隔離防曬乳", short: "防曬乳", type: "morning" },
  { id: 6, name: "肌泌潤澤修護面膜(嫩膜)", short: "嫩膜", type: "both" }
];

const globalStyles = `
  @keyframes confetti-burst {
    0% { transform: translate(0, 0) scale(0.5) rotate(0deg); opacity: 1; }
    70% { opacity: 1; }
    100% { transform: translate(var(--tx), var(--ty)) scale(1) rotate(var(--rot)); opacity: 0; }
  }
  .confetti-piece { animation: confetti-burst 1.5s ease-out forwards; }
  @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .animate-slide-up { animation: slide-up 0.4s ease-out forwards; }
`;

const Confetti = () => {
  const pieces = Array.from({ length: 60 }).map((_, i) => {
    const angle = Math.random() * 360;
    const distance = 80 + Math.random() * 250;
    const tx = `${Math.cos(angle * Math.PI / 180) * distance}px`;
    const ty = `${Math.sin(angle * Math.PI / 180) * distance}px`;
    const rot = `${Math.random() * 720 - 360}deg`;
    const colors = ['#34D399', '#FBBF24', '#F472B6', '#60A5FA', '#A78BFA', '#fb923c'];
    const size = 6 + Math.random() * 8;
    return (
      <div key={i} className="absolute top-1/2 left-1/2 confetti-piece z-[110] rounded-full"
        style={{ '--tx': tx, '--ty': ty, '--rot': rot, backgroundColor: colors[i % colors.length], width: `${size}px`, height: `${size}px`, marginLeft: `-${size/2}px`, marginTop: `-${size}px` }}
      />
    );
  });
  return <div className="absolute inset-0 overflow-hidden pointer-events-none">{pieces}</div>;
};

export default function App() {
  const getLocalYYYYMMDD = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };

  const [activeTab, setActiveTab] = useState('report');
  const [selectedUser, setSelectedUser] = useState('');
  const [routine, setRoutine] = useState('morning');
  const [reportDate, setReportDate] = useState(getLocalYYYYMMDD());
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [records, setRecords] = useState([]);
  const [viewingUser, setViewingUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [daysLeft, setDaysLeft] = useState(0);
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        signInAnonymously(auth).catch(console.error);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const diff = END_DATE - new Date();
    setDaysLeft(Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24))));

    const recordsRef = collection(db, 'artifacts', appId, 'public', 'data', 'records');
    const unsubscribe = onSnapshot(recordsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecords(data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
      setIsLoading(false);
    }, (error) => {
      console.error(error);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    setSelectedUser(record.userName);
    setRoutine(record.routine);
    setReportDate(record.date);
    setSelectedProducts(record.products);
    setActiveTab('report');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setSelectedProducts([]);
    setReportDate(getLocalYYYYMMDD());
    setActiveTab('records');
  };

  const handleDelete = async () => {
    if (!deleteConfirmId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'records', deleteConfirmId));
      showToast('🗑️ 紀錄已刪除！', 'success');
    } catch (e) {
      showToast('刪除失敗', 'error');
    } finally {
      setDeleteConfirmId(null);
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return showToast('請選擇打卡人員！', 'error');
    if (selectedProducts.length === 0) return showToast('請選擇品項！', 'error');
    if (isSubmitting) return;

    setIsSubmitting(true);
    const lastUser = selectedUser;

    try {
      const data = {
        userName: selectedUser,
        date: reportDate,
        routine,
        products: selectedProducts,
        createdAt: new Date().getTime()
      };

      if (editingId) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'records', editingId), data);
        showToast('🌿 修改成功！', 'success');
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'records'), data);
        setShowSuccessAnim(true);
        await new Promise(r => setTimeout(r, 2000));
        setShowSuccessAnim(false);
      }

      setSelectedUser('');
      setSelectedProducts([]);
      setReportDate(getLocalYYYYMMDD());
      setViewingUser(lastUser);
      setActiveTab('records');
    } catch (e) {
      showToast('傳送失敗', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F9F5] font-sans text-gray-800">
      <style>{globalStyles}</style>

      {showSuccessAnim && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/85 backdrop-blur-sm animate-in fade-in duration-200">
          <Confetti />
          <div className="flex flex-col items-center animate-in zoom-in duration-300 relative z-50 text-center">
            <div className="w-40 h-40 bg-emerald-500 rounded-full flex items-center justify-center shadow-xl mb-6 animate-bounce">
              <ThumbsUp size={80} className="text-white transform -rotate-12" fill="currentColor" />
            </div>
            <h2 className="text-4xl font-black text-emerald-600 mb-3">超棒的！</h2>
            <p className="text-lg text-emerald-700 font-bold bg-emerald-100 px-5 py-2 rounded-full">紀錄已同步至雲端 ✨</p>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={32}/></div>
            <h3 className="text-xl font-bold mb-2 text-gray-800">確定刪除嗎？</h3>
            <p className="text-gray-500 mb-8 font-bold text-sm">此動作無法復原喔！</p>
            <div className="flex gap-4">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-4 bg-gray-100 rounded-2xl font-bold">先不要</button>
              <button onClick={handleDelete} className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold shadow-lg">確認刪除</button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-emerald-600 text-white pt-10 pb-6 px-4 sticky top-0 z-20 shadow-md rounded-b-[2.5rem]">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-black text-center mb-4 flex items-center justify-center gap-2"><Leaf size={24} /> 珍鑽保養挑戰賽 <Leaf size={24} className="transform scale-x-[-1]" /></h1>
          <div className="bg-white/20 rounded-xl p-3 flex items-center justify-between border border-white/30">
            <span className="font-bold flex items-center gap-2"><CalendarDays size={18} /> 完賽倒數</span>
            <div className="text-right font-black"><span className="text-3xl">{daysLeft}</span><span className="text-sm ml-1">天</span></div>
          </div>
        </div>
      </header>

      {toast && (
        <div className="fixed top-32 left-1/2 transform -translate-x-1/2 z-50 w-11/12 max-w-sm animate-slide-up">
          <div className={`p-4 rounded-2xl shadow-xl text-white font-bold text-center ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-600'}`}>{toast.message}</div>
        </div>
      )}

      <main className="max-w-md mx-auto p-4 pb-24">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-emerald-300">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mb-4"></div>
            <p className="font-bold">連線中...</p>
          </div>
        ) : activeTab === 'report' ? (
          <div className="animate-slide-up">
            {editingId && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-2xl mb-5 flex items-center justify-between font-bold shadow-sm">
                <span>正在修改紀錄</span><button onClick={cancelEdit}><X size={24}/></button>
              </div>
            )}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800"><User size={20} className="text-emerald-500" /> 我是...</h2>
              <div className="flex flex-wrap gap-3">
                {USERS.map(u => (
                  <button key={u} onClick={() => setSelectedUser(u)} className={`px-4 py-2.5 rounded-full font-bold transition-all ${selectedUser === u ? 'bg-emerald-500 text-white shadow-md scale-105' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>{u}</button>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
              <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2"><Sun size={20} className="text-emerald-500" /> 保養時段</h2>
              <div className="flex gap-3">
                {['morning', 'night'].map(type => (
                  <button key={type} onClick={() => { setRoutine(type); setSelectedProducts([]); }} className={`flex-1 flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-all ${routine === type ? 'border-amber-400 bg-amber-50 text-amber-600' : 'border-gray-100 text-gray-400'}`}>
                    {type === 'morning' ? <Sun size={28} className="mb-2" /> : <Moon size={28} className="mb-2" />}
                    <span className="font-bold">{type === 'morning' ? '早間' : '夜間'}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
              <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2"><CalendarDays size={20} className="text-emerald-500" /> 打卡日期</h2>
              <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
              <h2 className="text-lg font-bold mb-4 text-gray-800">使用品項</h2>
              <div className="space-y-3">
                {PRODUCTS.map(product => {
                  if (routine === 'night' && product.type === 'morning') return null;
                  const isSelected = selectedProducts.includes(product.id);
                  return (
                    <div key={product.id} onClick={() => setSelectedProducts(prev => prev.includes(product.id) ? prev.filter(p => p !== product.id) : [...prev, product.id])} className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-gray-100'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${isSelected ? 'bg-emerald-500 text-white' : 'border-2 border-gray-200'}`}>{isSelected && <CheckCircle size={16} />}</div>
                      <span className={`font-bold ${isSelected ? 'text-emerald-800' : 'text-gray-500'}`}>{product.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <button onClick={handleSubmit} disabled={isSubmitting || isLoading} className={`w-full text-white font-black text-xl py-5 rounded-2xl shadow-lg transition-all ${isSubmitting || isLoading ? 'bg-gray-300' : 'bg-emerald-500 active:scale-95 shadow-emerald-200'}`}>
              {isSubmitting ? '同步中...' : (editingId ? '確認修改' : '送出打卡')}
            </button>
          </div>
        ) : (
          <div className="animate-slide-up">
            {viewingUser ? (
              <div className="animate-in fade-in slide-in-from-right-4">
                <div className="flex items-center mb-6 bg-white p-5 rounded-2xl shadow-sm border border-emerald-100 sticky top-40 z-10">
                  <button onClick={() => setViewingUser(null)} className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 mr-3"><ArrowLeft size={24} /></button>
                  <div><h2 className="text-xl font-bold text-gray-800">{viewingUser} 的打卡</h2><p className="text-emerald-500 font-bold text-sm">已累計打卡 {records.filter(r => r.userName === viewingUser).length} 次</p></div>
                </div>
                <div className="space-y-4">
                  {records.filter(r => r.userName === viewingUser).map(record => (
                    <div key={record.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${record.routine === 'morning' ? 'bg-amber-400' : 'bg-indigo-500'}`} />
                      <div className="flex justify-between items-start mb-3">
                        <div className="font-bold text-gray-700 flex items-center gap-2"><CalendarDays size={16} className="text-emerald-400"/>{record.date}</div>
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(record)} className="p-2 bg-gray-50 rounded-lg text-gray-400"><Pencil size={16}/></button>
                          <button onClick={() => setDeleteConfirmId(record.id)} className="p-2 bg-gray-50 rounded-lg text-gray-400"><Trash2 size={16}/></button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {record.products.map(pid => (
                          <span key={pid} className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg font-bold border border-emerald-100">{PRODUCTS.find(p => p.id === pid)?.short || '未知'}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-bold mb-5 flex items-center gap-2 text-gray-700"><Award className="text-emerald-500"/> 成員打卡排行榜</h2>
                <div className="grid grid-cols-1 gap-4">
                  {USERS.map(u => (
                    <div key={u} onClick={() => setViewingUser(u)} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between active:scale-95 cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-black text-xl shadow-lg">{u.charAt(0)}</div>
                        <div><div className="font-black text-gray-800 text-lg">{u}</div><div className="text-sm font-bold text-emerald-600">打卡紀錄 {records.filter(r => r.userName === u).length} 次</div></div>
                      </div>
                      <ChevronRight size={24} className="text-gray-300" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 z-30 shadow-lg">
        <div className="max-w-md mx-auto flex h-[70px] px-8">
          <button onClick={() => { cancelEdit(); setActiveTab('report'); setViewingUser(null); }} className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all ${activeTab === 'report' ? 'text-emerald-600 scale-110' : 'text-gray-300'}`}>
            <CheckCircle size={28} /><span className="text-[11px] font-black uppercase tracking-widest">打卡</span>
          </button>
          <button onClick={() => { setActiveTab('records'); }} className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all ${activeTab === 'records' ? 'text-emerald-600 scale-110' : 'text-gray-300'}`}>
            <CalendarDays size={28} /><span className="text-[11px] font-black uppercase tracking-widest">紀錄</span>
          </button>
        </div>
      </nav>
    </div>
  );
}