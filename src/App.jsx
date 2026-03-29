import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { Sun, Moon, CheckCircle, User, CalendarDays, ChevronRight, ArrowLeft, Award, Sparkles, Leaf, ThumbsUp, Pencil, X, Loader2, Trash2, AlertCircle, LayoutList } from 'lucide-react';

// --- 系統常數設定 ---
const USERS = ['淨蓉', '威佃', '邦邦', '左小宇', 'soso'];
const END_DATE = new Date('2026-04-28T23:59:59');

const PRODUCTS = [
  { id: 1, name: "珍鑽潔顏洗卸凝露", short: "洗卸凝露", type: "both" },
  { id: 2, name: "珍鑽矽晶微導霜", short: "微導霜", type: "both" },
  { id: 3, name: "珍鑽時光煥彩亮顏C粉", short: "亮顏C粉", type: "both" },
  { id: 4, name: "珍鑽美肌抗皺修復霜", short: "修復霜", type: "both" },
  { id: 5, name: "珍鑽隔離防曬乳", short: "防曬乳", type: "morning" },
  { id: 6, name: "肌泌潤澤修復面膜(嫩膜)", short: "嫩膜", type: "both" }
];

// --- Firebase 配置 ---
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

// --- 彩帶動畫 CSS ---
const globalStyles = `
  @keyframes confetti-burst {
    0% { transform: translate(0, 0) scale(0.5) rotate(0deg); opacity: 1; }
    70% { opacity: 1; }
    100% { transform: translate(var(--tx), var(--ty)) scale(1) rotate(var(--rot)); opacity: 0; }
  }
  .confetti-piece { animation: confetti-burst 1.5s ease-out forwards; }
`;

const Confetti = () => {
  const pieces = Array.from({ length: 60 }).map((_, i) => {
    const angle = Math.random() * 360;
    const distance = 80 + Math.random() * 250;
    const tx = `${Math.cos(angle * Math.PI / 180) * distance}px`;
    const ty = `${Math.sin(angle * Math.PI / 180) * distance}px`;
    const rot = `${Math.random() * 720 - 360}deg`;
    const color = ['#34D399', '#FBBF24', '#F472B6', '#60A5FA', '#A78BFA', '#fb923c'][Math.floor(Math.random() * 6)];
    const size = 6 + Math.random() * 8;
    return (
      <div key={i} className="absolute top-1/2 left-1/2 confetti-piece z-[110] rounded-sm"
        style={{ '--tx': tx, '--ty': ty, '--rot': rot, backgroundColor: color, width: `${size}px`, height: `${size}px`, marginLeft: `-${size/2}px`, marginTop: `-${size}px` }}
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

  const [user, setUser] = useState(null);
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
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [dbError, setDbError] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (isMounted) {
        setUser(u);
        if (u) {
          setAuthLoading(false);
          setAuthError(null);
        } else {
          signInAnonymously(auth).catch((err) => {
            if (isMounted) {
              setAuthError(`驗證失敗：${err.message}`);
              setAuthLoading(false);
            }
          });
        }
      }
    });
    return () => { isMounted = false; unsubscribe(); };
  }, []);

  useEffect(() => {
    const calculateDays = () => {
      const diff = END_DATE - new Date();
      setDaysLeft(Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24))));
    };
    calculateDays();
    if (authLoading || authError || !user) return;
    setDataLoading(true);
    setDbError(null);
    const recordsCol = collection(db, 'artifacts', appId, 'public', 'data', 'records');
    const unsubscribe = onSnapshot(recordsCol, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecords(data);
      setDataLoading(false);
    }, (err) => {
      console.error("Firestore Error:", err);
      setDbError(`資料庫拒絕存取：${err.message}`);
      setDataLoading(false);
    });
    return () => unsubscribe();
  }, [user, authLoading, authError]);

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
    setViewingUser(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'records', id));
      showToast('🗑️ 紀錄已成功刪除', 'success');
      setConfirmDeleteId(null);
    } catch (err) { showToast('刪除失敗，請檢查網路', 'error'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) { showToast('尚未完成驗證，無法打卡', 'error'); return; }
    if (!selectedUser || !reportDate || selectedProducts.length === 0) {
      showToast('請填寫完整資訊！', 'error');
      return;
    }
    try {
      const data = { userName: selectedUser, date: reportDate, routine, products: selectedProducts, updatedAt: Date.now() };
      const recordsCol = collection(db, 'artifacts', appId, 'public', 'data', 'records');
      if (editingId) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'records', editingId), data);
        showToast('🌿 修改成功！', 'success');
        setEditingId(null);
      } else {
        await addDoc(recordsCol, { ...data, createdAt: Date.now(), uid: user.uid });
        setShowSuccessAnim(true);
        setTimeout(() => setShowSuccessAnim(false), 2500);
      }
      setSelectedProducts([]);
      setViewingUser(selectedUser);
      setActiveTab('records');
    } catch (err) {
      console.error("Submit Error:", err);
      showToast('儲存失敗，請檢查資料庫連線', 'error');
    }
  };

  const renderReport = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 max-w-md mx-auto">
      {editingId && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-2xl mb-5 flex justify-between items-center shadow-sm">
          <span className="font-bold flex items-center gap-2"><Pencil size={18}/> 正在編輯打卡紀錄</span>
          <button onClick={() => { setEditingId(null); setSelectedProducts([]); }} className="text-amber-500 hover:bg-amber-100 p-1 rounded-full transition-colors"><X size={20}/></button>
        </div>
      )}
      <div className="bg-white rounded-2xl p-5 shadow-sm mb-5 border border-gray-50">
        <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><User size={18} className="text-emerald-500"/> 我是...</h3>
        <div className="flex flex-wrap gap-2">
          {USERS.map(u => (
            <button key={u} onClick={() => setSelectedUser(u)} className={`px-4 py-2.5 rounded-full text-sm font-bold transition-all ${selectedUser === u ? 'bg-emerald-500 text-white shadow-md transform scale-105' : 'bg-gray-50 text-gray-500 border border-gray-100 hover:bg-emerald-50'}`}>{u}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <button onClick={() => setRoutine('morning')} className={`p-4 rounded-2xl border-2 flex flex-col items-center transition-all ${routine === 'morning' ? 'border-amber-400 bg-amber-50 text-amber-700 shadow-sm' : 'border-gray-100 bg-white text-gray-400'}`}><Sun size={28} className="mb-1"/> <span className="font-bold text-sm">早間保養</span></button>
        <button onClick={() => setRoutine('night')} className={`p-4 rounded-2xl border-2 flex flex-col items-center transition-all ${routine === 'night' ? 'border-indigo-400 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-gray-100 bg-white text-gray-400'}`}><Moon size={28} className="mb-1"/> <span className="font-bold text-sm">夜間保養</span></button>
      </div>
      <div className="bg-white rounded-2xl p-5 shadow-sm mb-5 border border-gray-50">
        <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><CalendarDays size={18} className="text-emerald-500"/> 保養日期</h3>
        <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="w-full bg-gray-50 p-4 rounded-xl text-sm font-bold border-none focus:ring-2 focus:ring-emerald-400 outline-none"/>
      </div>
      <div className="bg-white rounded-2xl p-5 shadow-sm mb-6 border border-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-700">使用品項</h3>
          <button onClick={() => setSelectedProducts(PRODUCTS.filter(p => routine === 'morning' || p.type !== 'morning').map(p => p.id))} className="text-xs text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full font-bold">全選</button>
        </div>
        <div className="space-y-2">
          {PRODUCTS.map(p => {
            if (routine === 'night' && p.type === 'morning') return null;
            const isSelected = selectedProducts.includes(p.id);
            return (
              <div key={p.id} onClick={() => setSelectedProducts(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])} className={`flex items-center p-4 rounded-xl border-2 transition-all cursor-pointer ${isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 bg-white hover:border-emerald-200'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${isSelected ? 'bg-emerald-500 text-white' : 'border-2 border-gray-300'}`}>{isSelected && <CheckCircle size={14} />}</div>
                <span className={`font-bold ${isSelected ? 'text-emerald-800' : 'text-gray-600'}`}>{p.name}</span>
              </div>
            );
          })}
        </div>
      </div>
      <button onClick={handleSubmit} disabled={authLoading || !!authError || !!dbError} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all text-lg disabled:opacity-50">
        {editingId ? '儲存修改' : '送出打卡'}
      </button>
    </div>
  );

  const renderRecords = () => {
    if (viewingUser) {
      const userRecords = records
        .filter(r => r.userName === viewingUser)
        .sort((a, b) => new Date(b.date) - new Date(a.date) || (b.createdAt || 0) - (a.createdAt || 0));
      return (
        <div className="animate-in slide-in-from-right-4 duration-500 pb-24 max-w-md mx-auto">
          <div className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border-l-4 border-emerald-500 mb-6">
            <button onClick={() => setViewingUser(null)} className="p-2 bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 transition-colors">
              <ArrowLeft size={18}/>
            </button>
            <div>
              <h2 className="font-black text-gray-800 text-lg">{viewingUser} 的紀錄牆</h2>
              <p className="text-xs text-emerald-600 font-bold">累計打卡 {userRecords.length} 次</p>
            </div>
          </div>
          <div className="space-y-4">
            {userRecords.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                <Sparkles size={40} className="mx-auto text-emerald-100 mb-2"/>
                <p className="text-gray-400 text-sm font-bold">目前還沒有紀錄喔</p>
              </div>
            ) : userRecords.map(record => (
              <div key={record.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 animate-in fade-in zoom-in-95">
                <div className="flex justify-between items-center mb-3 border-b border-gray-50 pb-2">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={14} className="text-emerald-500"/>
                    <span className="text-xs font-bold text-gray-600">{record.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${record.routine === 'morning' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                      {record.routine === 'morning' ? <Sun size={10}/> : <Moon size={10}/>} {record.routine === 'morning' ? '早' : '夜'}
                    </div>
                    <div className="flex gap-1 ml-1">
                      <button onClick={() => handleEdit(record)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => setConfirmDeleteId(record.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
                {confirmDeleteId === record.id && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-3 animate-in zoom-in-95">
                    <p className="text-red-700 text-xs font-bold mb-2 flex items-center gap-1"><AlertCircle size={14}/> 確定要刪除這筆紀錄？</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleDelete(record.id)} className="flex-1 bg-red-500 text-white py-1.5 rounded-lg text-xs font-bold shadow-sm">確定刪除</button>
                      <button onClick={() => setConfirmDeleteId(null)} className="flex-1 bg-white border border-gray-200 text-gray-500 py-1.5 rounded-lg text-xs font-bold">取消</button>
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {record.products.map(pid => (
                    <span key={pid} className="text-[11px] bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md border border-emerald-100 font-medium">
                      {PRODUCTS.find(p => p.id === pid)?.short || '未知品項'}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-500 pb-24 max-w-md mx-auto">
        <div className="flex items-center gap-2 mb-6 px-2">
          <Award className="text-emerald-500" size={24}/>
          <h2 className="text-xl font-black text-gray-800 tracking-tight">參賽者名單</h2>
        </div>
        <div className="space-y-4">
          {USERS.map(u => {
            const count = records.filter(r => r.userName === u).length;
            return (
              <div key={u} onClick={() => setViewingUser(u)}
                className="bg-white p-5 rounded-[2rem] flex items-center justify-between border border-gray-100 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer active:scale-[0.98] group"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-emerald-600 font-black text-xl shadow-inner border-2 border-white">
                    {u.charAt(0)}
                  </div>
                  <div>
                    <div className="font-black text-gray-800 text-lg group-hover:text-emerald-600 transition-colors">{u}</div>
                    <div className="text-sm text-gray-400 font-bold">目前累計：<span className="text-emerald-600 text-base">{count}</span> 次</div>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all">
                  <ChevronRight size={24} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FBF9] font-sans text-gray-800 relative">
      <style>{globalStyles}</style>
      {showSuccessAnim && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/90 backdrop-blur-sm animate-in fade-in">
          <Confetti />
          <div className="text-center animate-in zoom-in duration-300">
            <div className="w-32 h-32 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl animate-bounce"><ThumbsUp size={64} className="text-white" fill="currentColor" /></div>
            <h2 className="text-3xl font-black text-emerald-600 mb-2">打卡成功！</h2>
            <p className="text-emerald-500 font-bold bg-emerald-50 px-4 py-2 rounded-full inline-block shadow-sm">今天也要漂漂亮亮的 ✨</p>
          </div>
        </div>
      )}
      <header className="bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 text-white pt-10 pb-12 px-6 sticky top-0 z-20 shadow-lg rounded-b-[3rem]">
        <h1 className="text-2xl font-black text-center flex items-center justify-center gap-2 mb-8 tracking-widest leading-none drop-shadow-sm">
          <Leaf size={24} /> 珍鑽保養挑戰賽 <Leaf size={24} className="rotate-180" />
        </h1>
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between border border-white/20 max-w-md mx-auto shadow-inner">
          <div className="flex flex-col">
            <span className="text-[10px] text-emerald-100 font-black uppercase tracking-[0.2em] mb-1 flex items-center gap-1">
              <CalendarDays size={10}/> 完賽倒數
            </span>
            <span className="text-[10px] text-white/70 font-bold italic tracking-wider uppercase">Until 2026.04.28</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-black drop-shadow-sm">{daysLeft}</span>
            <span className="text-xs font-black opacity-80 uppercase tracking-widest">天</span>
          </div>
        </div>
      </header>
      {toast && (toast.message || toast.type) && (
        <div className="fixed top-44 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-xs animate-in slide-in-from-top-4">
          <div className={`p-4 rounded-2xl shadow-2xl text-white font-bold text-center flex items-center justify-center gap-2 ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-600'}`}>
            {toast.type === 'error' ? '⚠️' : <CheckCircle size={20}/>} {toast.message}
          </div>
        </div>
      )}
      <main className="p-4 mt-2">
        {authError || dbError ? (
          <div className="text-center py-10 bg-white rounded-3xl border border-red-100 p-6 mx-auto max-w-md shadow-sm">
            <AlertCircle size={48} className="mx-auto text-red-500 mb-4"/>
            <p className="text-red-600 font-bold mb-2">系統連線提示</p>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed bg-red-50 p-3 rounded-lg text-left break-words">
              {authError || dbError}
            </p>
            <button onClick={() => window.location.reload()} className="bg-emerald-500 text-white px-8 py-2 rounded-full font-bold shadow-md active:scale-95">重新整理</button>
          </div>
        ) : authLoading || dataLoading ? (
          <div className="flex flex-col items-center py-24 text-emerald-500 font-bold max-w-md mx-auto">
            <Loader2 className="animate-spin mb-4" size={48}/>
            <span className="tracking-widest">{authLoading ? '驗證身分中...' : '載入紀錄中...'}</span>
          </div>
        ) : activeTab === 'report' ? renderReport() : renderRecords()}
      </main>
      <nav className="fixed bottom-0 w-full bg-white/95 backdrop-blur-md border-t border-gray-100 pb-safe z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.06)]">
        <div className="flex justify-around items-center h-[72px] max-w-md mx-auto px-4">
          <button
            onClick={() => { setViewingUser(null); setActiveTab('report'); }}
            className={`flex-1 flex flex-col items-center justify-center relative transition-all duration-300 ${activeTab === 'report' ? 'text-emerald-600' : 'text-gray-400'}`}
          >
            {activeTab === 'report' && <div className="absolute top-0 w-14 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.4)]" />}
            <CheckCircle size={28} className={activeTab === 'report' ? 'scale-110 mb-1' : 'mb-1'} />
            <span className="text-[11px] font-black uppercase tracking-tighter">我要打卡</span>
          </button>
          <button
            onClick={() => { setViewingUser(null); setActiveTab('records'); }}
            className={`flex-1 flex flex-col items-center justify-center relative transition-all duration-300 ${activeTab === 'records' ? 'text-emerald-600' : 'text-gray-400'}`}
          >
            {activeTab === 'records' && <div className="absolute top-0 w-14 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.4)]" />}
            <LayoutList size={28} className={activeTab === 'records' ? 'scale-110 mb-1' : 'mb-1'} />
            <span className="text-[11px] font-black uppercase tracking-tighter">打卡紀錄</span>
          </button>
        </div>
      </nav>
    </div>
  );
}