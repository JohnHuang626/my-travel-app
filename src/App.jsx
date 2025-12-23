import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp, writeBatch } from 'firebase/firestore';

// ==========================================
// 0. Firebase 設定
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyA6nNGBreAOwdIbQp1aRAj-XiokoXOTH8Q",
  authDomain: "travel-mate-2025.firebaseapp.com",
  projectId: "travel-mate-2025",
  storageBucket: "travel-mate-2025.firebasestorage.app",
  messagingSenderId: "617929806986",
  appId: "1:617929806986:web:409c7d4febee9345450973"
};

// ==========================================
// 1. 純 SVG 圖示系統 (零外部依賴)
// ==========================================
const SvgIcon = ({ d, size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {d}
  </svg>
);

const Icons = {
  // 經典飛機造型 (類似 ✈️ Emoji)
  Plane: (p) => <SvgIcon {...p} fill="currentColor" stroke="none" d={<path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>} />,
  Calendar: (p) => <SvgIcon {...p} d={<><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>} />,
  Camera: (p) => <SvgIcon {...p} d={<><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></>} />,
  Plus: (p) => <SvgIcon {...p} d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>} />,
  Trash: (p) => <SvgIcon {...p} d={<><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>} />,
  Check: (p) => <SvgIcon {...p} d={<polyline points="20 6 9 17 4 12"/>} />,
  MapPin: (p) => <SvgIcon {...p} d={<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>} />,
  ArrowLeft: (p) => <SvgIcon {...p} d={<><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>} />,
  X: (p) => <SvgIcon {...p} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>} />,
  Settings: (p) => <SvgIcon {...p} d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></>} />,
  ArrowUp: (p) => <SvgIcon {...p} d={<><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>} />,
  ArrowDown: (p) => <SvgIcon {...p} d={<><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></>} />,
  ChevronRight: (p) => <SvgIcon {...p} d={<polyline points="9 18 15 12 9 6"/>} />,
  ChevronLeft: (p) => <SvgIcon {...p} d={<polyline points="15 18 9 12 15 6"/>} />,
  FileText: (p) => <SvgIcon {...p} d={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>} />,
  Paperclip: (p) => <SvgIcon {...p} d={<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>} />,
  Map: (p) => <SvgIcon {...p} d={<><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></>} />,
  Refresh: (p) => <SvgIcon {...p} d={<><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></>} />,
  Cloud: (p) => <SvgIcon {...p} d={<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>} />,
  CloudOff: (p) => <SvgIcon {...p} d={<><path d="M22.61 16.95A5 5 0 0 0 18 10h-1.26a8 8 0 0 0-7.05-6M5 5a8 8 0 0 0 4 15h9a5 5 0 0 0 1.7-.3"/><line x1="1" y1="1" x2="23" y2="23"/></>} />,
  HardDrive: (p) => <SvgIcon {...p} d={<><line x1="22" y1="12" x2="2" y2="12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" y1="16" x2="6.01" y2="16"/><line x1="10" y1="16" x2="10.01" y2="16"/></>} />,
  AlertTriangle: (p) => <SvgIcon {...p} d={<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>} />,
  AlertCircle: (p) => <SvgIcon {...p} d={<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>} />,
  ImageIcon: (p) => <SvgIcon {...p} d={<><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>} />,
  Save: (p) => <SvgIcon {...p} d={<><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>} />,
  Copy: (p) => <SvgIcon {...p} d={<><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>} />,
  Loader: (p) => <SvgIcon {...p} className={`animate-spin ${p.className||''}`} d={<path d="M21 12a9 9 0 1 1-6.219-8.56"/>} />
};

// ==========================================
// 2. Firebase Imports & Service
// ==========================================

const SafeStorage = {
  get: (key, fallback) => {
    try { const item = localStorage.getItem(key); return item ? JSON.parse(item) : fallback; } catch { return fallback; }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  },
  clear: () => { try { localStorage.clear(); } catch {} }
};

const Service = {
  db: null, auth: null, user: null, mode: 'loading',
  init: async () => {
    try {
      // 直接使用傳入的 firebaseConfig
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      Service.auth = getAuth(app);
      Service.db = getFirestore(app);

      // 檢查是否有 Canvas 環境的 Token，如果沒有則使用匿名登入
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(Service.auth, __initial_auth_token);
      } else {
        await signInAnonymously(Service.auth);
      }
      
      return new Promise(resolve => {
        onAuthStateChanged(Service.auth, (u) => {
          if (u) { Service.user = u; Service.mode = 'cloud'; resolve('cloud'); }
          else { Service.user = { uid: 'guest' }; Service.mode = 'local'; resolve('local'); }
        });
      });
    } catch (e) { 
      console.warn("Firebase Init Failed:", e); 
      Service.user = { uid: 'guest' };
      Service.mode = 'local';
      return 'local';
    }
  },
  subscribe: (tripId, type, callback) => {
    if (Service.mode === 'cloud' && Service.db) {
      try {
        const appId = firebaseConfig.projectId; // 使用 config 中的 projectId 或其他標識
        // 使用 'public' 路徑實現家庭共享
        // 注意：為了簡化，這裡移除了 __app_id 依賴，直接存放在 artifacts/travel-mate/public 下
        const rootPath = 'travel-mate-data'; // 簡化路徑，避免複雜的 appId 依賴
        let path = tripId ? ['artifacts', rootPath, 'public', 'data', 'trips', tripId, type] : ['artifacts', rootPath, 'public', 'data', 'trips'];
        
        let q = collection(Service.db, ...path);
        if (!tripId) q = query(q, orderBy('startDate', 'desc'));
        else if (type === 'itinerary') q = query(q, orderBy('time', 'asc'));
        else q = query(q, orderBy('createdAt', 'desc'));
        return onSnapshot(q, (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))), () => callback([]));
      } catch { return () => {}; }
    } else {
      const key = tripId ? `tm_v25_${type}_${tripId}` : 'tm_v25_trips';
      callback(SafeStorage.get(key, []));
      return () => {};
    }
  },
  op: async (tripId, type, action, data, id) => {
    const rootPath = 'travel-mate-data';
    if (Service.mode === 'cloud' && Service.db) {
      try {
        let path = tripId ? ['artifacts', rootPath, 'public', 'data', 'trips', tripId, type] : ['artifacts', rootPath, 'public', 'data', 'trips'];
        const colRef = collection(Service.db, ...path);
        if (action === 'add') await addDoc(colRef, { ...data, createdAt: serverTimestamp() });
        else if (action === 'update') await updateDoc(doc(colRef, id), data);
        else if (action === 'delete') await deleteDoc(doc(colRef, id));
        return null;
      } catch (e) { console.error(e); }
    }
    const key = tripId ? `tm_v25_${type}_${tripId}` : 'tm_v25_trips';
    let list = SafeStorage.get(key, []);
    if (action === 'add') {
      const newItem = { ...data, id: Date.now().toString() + Math.random().toString().slice(2) };
      list = tripId && type === 'itinerary' ? [...list, newItem].sort((a,b)=>(a.time||'').localeCompare(b.time||'')) : [newItem, ...list];
    } else if (action === 'update') {
      list = list.map(i => i.id === id ? { ...i, ...data } : i);
      if (tripId && type === 'itinerary') list.sort((a,b)=>(a.time||'').localeCompare(b.time||''));
    } else if (action === 'delete') {
      list = list.filter(i => i.id !== id);
    }
    SafeStorage.set(key, list);
    return list;
  },
  batchSwap: async (tripId, itemA, itemB) => {
    const rootPath = 'travel-mate-data';
    if (Service.mode === 'cloud' && Service.db) {
      const batch = writeBatch(Service.db);
      const pathBase = ['artifacts', rootPath, 'public', 'data', 'trips', tripId, 'itinerary'];
      batch.update(doc(Service.db, ...pathBase, itemA.id), { time: itemB.time });
      batch.update(doc(Service.db, ...pathBase, itemB.id), { time: itemA.time });
      await batch.commit();
      return null;
    } else {
      await Service.op(tripId, 'itinerary', 'update', { ...itemA, time: itemB.time }, itemA.id);
      return await Service.op(tripId, 'itinerary', 'update', { ...itemB, time: itemA.time }, itemB.id);
    }
  },
  batchDelete: async (tripId, type, ids) => {
    const rootPath = 'travel-mate-data';
    if (Service.mode === 'cloud' && Service.db) {
      try {
        const batch = writeBatch(Service.db);
        const pathBase = ['artifacts', rootPath, 'public', 'data', 'trips', tripId, 'itinerary'];
        ids.forEach(id => {
          batch.delete(doc(Service.db, ...pathBase, id));
        });
        await batch.commit();
        return null;
      } catch (e) { console.error(e); return null; }
    } else {
      const key = tripId ? `tm_v25_${type}_${tripId}` : 'tm_v25_trips';
      let list = SafeStorage.get(key, []);
      list = list.filter(i => !ids.includes(i.id));
      SafeStorage.set(key, list);
      return list;
    }
  }
};

// ==========================================
// 3. UI 元件 (Modal, Input, etc.) - 先定義
// ==========================================
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-xl w-full max-w-sm p-5 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100"><h3 className="font-bold text-lg text-slate-800">{title}</h3><button onClick={onClose}><Icons.X className="opacity-50 hover:opacity-100"/></button></div>
        <div className="overflow-y-auto custom-scrollbar">{children}</div>
      </div>
    </div>
  );
};

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs p-5">
        <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3><p className="text-sm text-slate-500 mb-6">{message}</p>
        <div className="flex gap-3"><button onClick={onCancel} className="flex-1 py-2 bg-slate-100 rounded text-sm">取消</button><button onClick={onConfirm} className="flex-1 py-2 bg-red-500 text-white rounded text-sm">確定</button></div>
      </div>
    </div>
  );
};

const LocationInput = ({ value, onChange, placeholder }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [show, setShow] = useState(false);
  const search = async (q) => {
    if(!q || q.length<2) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&accept-language=zh-TW`);
      const data = await res.json();
      setSuggestions(data); setShow(true);
    } catch(e){}
  };
  return (
    <div className="relative w-full">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-2.5 top-2.5 opacity-50"><Icons.MapPin size={14}/></span>
          <input className="w-full border p-2 rounded-lg text-sm pl-8" placeholder={placeholder} value={value} onChange={e=>{onChange(e.target.value); if(e.target.value.length>1) search(e.target.value); else setShow(false);}} />
        </div>
        <button onClick={()=>value && window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`)} className="p-2 bg-blue-50 text-blue-600 rounded border border-blue-100"><Icons.Map size={18}/></button>
      </div>
      {show && suggestions.length>0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border rounded shadow-xl max-h-48 overflow-y-auto">
          {suggestions.map((p,i)=>(<li key={i} onClick={()=>{onChange(p.display_name.split(',')[0]); setShow(false);}} className="px-3 py-2 text-xs hover:bg-slate-50 cursor-pointer border-b text-slate-700"><span className="font-bold block">{p.display_name.split(',')[0]}</span></li>))}
        </ul>
      )}
    </div>
  );
};

const ImageViewer = ({ images, initialIndex, onClose }) => {
  const [index, setIndex] = useState(initialIndex);
  const next = (e) => { e?.stopPropagation(); setIndex((i) => (i + 1) % images.length); };
  const prev = (e) => { e?.stopPropagation(); setIndex((i) => (i - 1 + images.length) % images.length); };
  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center animate-in fade-in" onClick={onClose}>
      <button className="absolute top-4 right-4 p-2 bg-white/20 rounded-full text-white" onClick={onClose}><Icons.X size={24}/></button>
      <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">{index + 1} / {images.length}</div>
      {images.length > 1 && <><button onClick={prev} className="absolute left-2 p-3 bg-white/20 rounded-full text-white"><Icons.ChevronLeft size={32}/></button><button onClick={next} className="absolute right-2 p-3 bg-white/20 rounded-full text-white"><Icons.ChevronRight size={32}/></button></>}
      <div className="w-full h-full flex items-center justify-center p-2"><img src={images[index]} className="max-w-full max-h-[90vh] object-contain shadow-2xl" onClick={e=>e.stopPropagation()}/></div>
    </div>
  );
};

const SwipeableRow = ({ children, onDeleteRequest, onEdit }) => {
  const [offset, setOffset] = useState(0);
  const startX = useRef(0);
  const handleStart = (cx) => { startX.current = cx; };
  const handleMove = (cx) => { const diff = cx - startX.current; if (diff < 0) setOffset(Math.max(diff, -80)); };
  const handleEnd = () => setOffset(offset < -40 ? -80 : 0);
  return (
    <div className="relative w-full rounded-xl mb-4 h-auto select-none overflow-hidden group touch-pan-y">
      <div className="absolute inset-0 bg-red-500 rounded-xl flex justify-end items-center z-0"><button onClick={(e) => { e.stopPropagation(); onDeleteRequest(() => setOffset(0)); }} className="w-20 h-full flex flex-col items-center justify-center text-white active:bg-red-600 transition-colors"><Icons.Trash size={20} /><span className="text-[10px] font-bold mt-1">刪除</span></button></div>
      <div className="relative z-10 bg-white rounded-xl shadow-sm border border-slate-100 transition-transform duration-200 ease-out" style={{ transform: `translateX(${offset}px)` }} onTouchStart={e => handleStart(e.touches[0].clientX)} onTouchMove={e => handleMove(e.touches[0].clientX)} onTouchEnd={handleEnd} onMouseDown={e => handleStart(e.clientX)} onMouseMove={e => handleMove(e.clientX)} onMouseUp={handleEnd} onMouseLeave={handleEnd} onClick={() => { if (offset < 0) setOffset(0); else onEdit(); }}>{children}</div>
    </div>
  );
};

const ImportModal = ({ isOpen, onClose, onImport }) => {
  const [text, setText] = useState('');
  const exampleText = `09:00 | 參觀羅浮宮 | 巴黎第1區 | 景點\n12:30 | 花神咖啡館午餐 | 聖日耳曼大道 | 美食`;
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-xl w-full max-w-md p-5 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold flex items-center gap-2"><Icons.FileText size={20}/> 批量匯入</h3><button onClick={onClose}><Icons.X className="text-slate-400"/></button></div>
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4 text-xs text-slate-600 space-y-2">
          <div className="flex justify-between items-center font-bold text-slate-700"><span>格式範例：</span><button onClick={() => setText(exampleText)} className="text-teal-600 flex items-center gap-1 hover:underline"><Icons.Copy size={10}/> 複製範例</button></div>
          <p className="font-mono bg-white p-2 rounded border border-slate-100 whitespace-pre-wrap">時間 | 行程名稱 | 地點 | 類型</p>
        </div>
        <textarea className="flex-1 border p-3 rounded-lg text-sm font-mono focus:ring-2 focus:ring-teal-500 outline-none resize-none mb-4 h-48" placeholder={`在此貼上...\n\n${exampleText}`} value={text} onChange={e => setText(e.target.value)}/>
        <div className="flex gap-3"><button onClick={onClose} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-lg font-bold text-sm">取消</button><button onClick={() => { onImport(text); onClose(); setText(''); }} className="flex-1 py-3 bg-teal-600 text-white rounded-lg font-bold text-sm shadow-md" disabled={!text.trim()}>匯入</button></div>
      </div>
    </div>
  );
};

const TripSettingsModal = ({ isOpen, trip, onClose, onSave, handleImg }) => {
  const [data, setData] = useState({ name: '', startDate: '', endDate: '' });
  const fileRef = useRef(null);
  useEffect(() => { if (trip) setData({ name: trip.name, startDate: trip.startDate, endDate: trip.endDate, coverImage: trip.coverImage }); }, [trip, isOpen]);
  
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-xl w-full max-w-sm p-5 flex flex-col">
        <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold flex items-center gap-2"><Icons.Settings className="text-sky-600" size={20}/> 旅行設定</h3><button onClick={onClose}><Icons.X className="text-slate-400"/></button></div>
        <div className="space-y-4 mb-6">
          <div className="border p-2 rounded bg-slate-50 text-center cursor-pointer" onClick={()=>fileRef.current.click()}>
             {data.coverImage ? <img src={data.coverImage} className="h-32 w-full object-cover rounded"/> : <div className="h-20 flex flex-col justify-center items-center text-slate-400"><Icons.Camera size={24}/><span className="text-xs">封面</span></div>}
             <input type="file" hidden ref={fileRef} onChange={async e=>{const b64=await resizeImage(e.target.files[0]); if(b64) setData({...data, coverImage: b64})}}/>
          </div>
          <div><label className="block text-xs text-slate-500 mb-1">名稱</label><input className="w-full border p-2 rounded-lg text-sm" value={data.name} onChange={e => setData({...data, name: e.target.value})}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-slate-500 mb-1">開始</label><input type="date" className="w-full border p-2 rounded-lg text-sm" value={data.startDate} onChange={e => setData({...data, startDate: e.target.value})}/></div>
            <div><label className="block text-xs text-slate-500 mb-1">結束</label><input type="date" className="w-full border p-2 rounded-lg text-sm" value={data.endDate} onChange={e => setData({...data, endDate: e.target.value})}/></div>
          </div>
        </div>
        <button onClick={() => { onSave(data); onClose(); }} className="w-full py-3 bg-sky-600 text-white rounded-lg font-bold text-sm shadow-md">儲存變更</button>
      </div>
    </div>
  );
};

// ==========================================
// 4. 錯誤邊界
// ==========================================
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-slate-800 bg-red-50 text-center">
        <div className="bg-red-100 p-4 rounded-full mb-4 text-red-600"><Icons.Trash size={32}/></div>
        <h2 className="text-xl font-bold mb-2">發生預期外的錯誤</h2>
        <p className="text-sm text-slate-600 mb-6">請嘗試重置資料以修復問題。</p>
        <button onClick={()=>{localStorage.clear(); window.location.reload()}} className="px-6 py-3 bg-red-600 text-white rounded-full shadow-lg font-bold flex items-center gap-2">
          <span className="text-white"><Icons.Refresh size={16}/></span> 重置 App
        </button>
      </div>
    );
    return this.props.children; 
  }
}

const resizeImage = (file) => new Promise(resolve => {
  if (!file) resolve(null);
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = e => {
    const img = new Image(); img.src = e.target.result;
    img.onload = () => {
      const cvs = document.createElement('canvas'); const max = 800; let w=img.width, h=img.height;
      if(w>max){h*=max/w;w=max} cvs.width=w; cvs.height=h;
      cvs.getContext('2d').drawImage(img,0,0,w,h);
      resolve(cvs.toDataURL('image/jpeg', 0.6));
    };
  };
});

// 日期計算與顯示 (加強容錯)
const calculateDays = (s, e) => { 
  try { 
    if(!s || !e) return 1;
    const d1 = new Date(s.replace(/-/g, '/')); // 相容 iOS
    const d2 = new Date(e.replace(/-/g, '/'));
    if(isNaN(d1) || isNaN(d2)) return 1;
    return Math.max(1, Math.ceil(Math.abs(d2 - d1) / 86400000) + 1); 
  } catch { return 1; } 
};

// 日期顯示防呆：解決 Invalid Date
const getDisplayDate = (start, dayIdx) => {
  if (!start) return `Day ${dayIdx}`;
  try {
    const d = new Date(start.replace(/-/g, '/')); // 相容 iOS
    if (isNaN(d.getTime())) return `Day ${dayIdx}`;
    d.setDate(d.getDate() + (dayIdx - 1));
    return d.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric', weekday: 'short' });
  } catch { return `Day ${dayIdx}`; }
};

const MOODS = [
  {k:'happy',i:'😊',l:'開心'},{k:'excited',i:'😆',l:'興奮'},{k:'relaxed',i:'😌',l:'放鬆'},{k:'loved',i:'🥰',l:'幸福'},
  {k:'hungry',i:'😋',l:'貪吃'},{k:'surprised',i:'😲',l:'驚訝'},{k:'tired',i:'😴',l:'累了'},{k:'cool',i:'😎',l:'耍酷'},
  {k:'angry',i:'😠',l:'生氣'},{k:'sad',i:'😢',l:'難過'}
];

const TYPE_ICONS = { fun:'🎡', food:'🍜', shopping:'🛍️', transport:'🚆', stay:'🏨' };

// ==========================================
// 5. 主程式入口
// ==========================================
export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [trips, setTrips] = useState([]);
  const [activeTripId, setActiveTripId] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState('loading');

  useEffect(() => {
    document.title = "我的旅程";
    
    // 設定網頁圖示 (Favicon & Apple Touch Icon) - 天空藍主題
    const setFavicon = () => {
      const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
      link.type = 'image/svg+xml';
      link.rel = 'icon';
      // 修改：背景改為 Sky Blue (Sky 500: #0ea5e9)，飛機為白色
      link.href = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22><rect width=%2224%22 height=%2224%22 fill=%22%230ea5e9%22 rx=%224%22/><path fill=%22white%22 d=%22M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z%22/></svg>`;
      document.head.appendChild(link);

      const appleLink = document.querySelector("link[rel='apple-touch-icon']") || document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      appleLink.href = link.href;
      document.head.appendChild(appleLink);
    };
    setFavicon();

    Service.init().then(m => { setMode(m); setLoaded(true); });
  }, []);

  useEffect(() => {
    if (loaded) {
      const unsub = Service.subscribe(null, null, (data) => setTrips(data || []));
      return () => unsub && unsub();
    }
  }, [loaded, mode]);

  const activeTrip = trips.find(t => t.id === activeTripId);

  const addTrip = async (t) => {
    const res = await Service.op(null, null, 'add', t);
    if(res) setTrips(res);
  };
  const deleteTrip = async (id) => {
    const res = await Service.op(null, null, 'delete', null, id);
    if(res) setTrips(res);
  };
  const updateTrip = async (data) => {
    const res = await Service.op(null, null, 'update', data, activeTrip.id);
    if(res) setTrips(res);
  };

  if (!loaded) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 max-w-md mx-auto shadow-2xl overflow-hidden border-x border-slate-200 relative">
      <button onClick={()=>{if(confirm('重置所有資料?')){localStorage.clear(); window.location.reload();}}} className="fixed bottom-1 left-1 z-50 p-2 text-slate-300 hover:text-red-500 opacity-50"><Icons.Refresh size={12}/></button>

      {activeTrip ? (
        <TripDetail 
          trip={activeTrip} 
          mode={mode}
          onUpdate={(d) => updateTrip(d)}
          onBack={() => setActiveTripId(null)}
        />
      ) : (
        <TripList 
          trips={trips} 
          onAdd={addTrip} 
          onDelete={deleteTrip} 
          onSelect={setActiveTripId} 
          mode={mode}
        />
      )}
    </div>
  );
}

// === Trip List ===
function TripList({ trips, onAdd, onDelete, onSelect, mode }) {
  const [isCreating, setIsCreating] = useState(false);
  const [newTrip, setNewTrip] = useState({ name: '', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0] });
  const [deleteModal, setDeleteModal] = useState(false);

  const handleCreate = () => {
    if(!newTrip.name) return;
    onAdd(newTrip);
    setIsCreating(false); setNewTrip({ ...newTrip, name: '' });
  };

  return (
    <div className="pb-20">
      <ConfirmModal isOpen={!!deleteModal} title="刪除" message="確定刪除？" onConfirm={() => { onDelete(deleteModal); setDeleteModal(null); }} onCancel={() => setDeleteModal(null)} />
      <header className={`text-white p-6 pt-10 shadow-md rounded-b-3xl mb-6 ${mode==='cloud'?'bg-sky-600':'bg-slate-600'}`}>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Icons.Plane /> 我的旅程</h1>
        <div className="text-[10px] opacity-80 mt-1 flex items-center gap-1">{mode==='cloud'?<><Icons.Cloud size={10}/> 家庭共享模式</>:<><Icons.CloudOff size={10}/> 本機試用模式</>}</div>
      </header>

      <div className="px-4 space-y-4">
        {!isCreating ? (
          <button onClick={() => setIsCreating(true)} className="w-full py-4 border-2 border-dashed border-sky-200 rounded-2xl flex items-center justify-center gap-2 text-sky-600 font-bold hover:bg-sky-50 bg-white"><Icons.Plus/> 建立新計畫</button>
        ) : (
          <div className="bg-white p-4 rounded-xl shadow-lg border border-sky-100 animate-in fade-in">
            <input className="w-full border p-2 rounded mb-2" placeholder="旅行名稱" value={newTrip.name} onChange={e => setNewTrip({...newTrip, name: e.target.value})} />
            <div className="flex gap-2 mb-2">
              <input type="date" className="border p-1 rounded w-1/2" value={newTrip.startDate} onChange={e => setNewTrip({...newTrip, startDate: e.target.value})} />
              <input type="date" className="border p-1 rounded w-1/2" value={newTrip.endDate} onChange={e => setNewTrip({...newTrip, endDate: e.target.value})} />
            </div>
            <div className="flex gap-2"><button onClick={() => setIsCreating(false)} className="flex-1 bg-slate-100 py-2 rounded text-sm">取消</button><button onClick={handleCreate} className="flex-1 bg-sky-600 text-white py-2 rounded text-sm">建立</button></div>
          </div>
        )}

        <div className="space-y-3">
          {trips.length===0 && !isCreating && <div className="text-center text-slate-400 py-8">暫無行程</div>}
          {trips.map(t => (
            <div key={t.id} onClick={() => onSelect(t.id)} className="relative bg-white rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 cursor-pointer hover:shadow-md h-24 overflow-hidden">
               {t.coverImage ? <><img src={t.coverImage} className="absolute inset-0 w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent"></div></> : <div className="absolute inset-0 bg-gradient-to-r from-sky-50 to-white"></div>}
               <div className="relative z-10 flex items-center gap-4 w-full p-4">
                 <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0 ${t.coverImage?'bg-white/20 backdrop-blur text-white':'bg-sky-100 text-slate-700'}`}><Icons.Plane/></div>
                 <div className="flex-1 min-w-0"><h3 className={`font-bold text-lg truncate ${t.coverImage?'text-white':'text-slate-800'}`}>{t.name}</h3><p className={`text-xs ${t.coverImage?'text-white/80':'text-slate-400'}`}>{t.startDate} ~ {t.endDate}</p></div>
                 <button onClick={e=>{e.stopPropagation(); setDeleteModal(t.id)}} className={`p-2 rounded-full ${t.coverImage?'text-white/80 hover:text-red-300':'text-slate-300 hover:text-red-500'}`}><Icons.Trash size={18}/></button>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// === Trip Detail ===
function TripDetail({ trip, mode, onUpdate, onBack }) {
  const [day, setDay] = useState(1);
  const [activeTab, setActiveTab] = useState('plan');
  
  // Modals
  const [editOpen, setEditOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [gallery, setGallery] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, type: 'itinerary' });
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Forms
  const [newItem, setNewItem] = useState({ time: '', activity: '', location: '', type: 'fun', notes: '', attachments: [] });
  const [newMem, setNewMem] = useState({ text: '', mood: 'happy', attachments: [], linkedId: '' });
  const [importText, setImportText] = useState('');
  const [settingsData, setSettingsData] = useState({ name: trip.name, startDate: trip.startDate, endDate: trip.endDate, coverImage: trip.coverImage });

  const fileRef = useRef(null);
  const coverRef = useRef(null);
  const memFileRef = useRef(null);
  const editFileRef = useRef(null);

  const [items, setItems] = useState([]);
  const [memories, setMemories] = useState([]);

  useEffect(() => {
    const u1 = Service.subscribe(trip.id, 'itinerary', (d) => setItems(d || []));
    const u2 = Service.subscribe(trip.id, 'memories', (d) => setMemories(d || []));
    return () => { if(u1)u1(); if(u2)u2(); };
  }, [trip.id]);

  const handleItemAction = async (type, action, data, id) => {
    const res = await Service.op(trip.id, type, action, data, id);
    if (Service.mode === 'local' && res) type === 'itinerary' ? setItems(res) : setMemories(res);
    if (action !== 'delete') { setEditOpen(false); setEditingItem(null); }
  };

  const handleImport = async (text) => {
    if (!text) return;
    const lines = text.split('\n');
    for (const l of lines) {
      const p = l.split(/[|｜]/).map(s=>s.trim());
      if (p.length < 2) continue;
      const [time, activity, location='', typeRaw='fun'] = p;
      let type='fun';
      const lt = typeRaw.toLowerCase();
      if(lt.includes('食')||lt==='food') type='food'; else if(lt.includes('購')||lt.includes('shopping')||lt.includes('buy')||lt.includes('outlet')) type='shopping'; else if(lt.includes('通')||lt.includes('transport')) type='transport'; else if(lt.includes('住')||lt.includes('stay')) type='stay';
      await handleItemAction('itinerary', 'add', { day, time, activity, location, type, notes: '', attachments: [], completed: false });
    }
    setImportOpen(false); setImportText('');
  };

  const performBatchDelete = async () => {
    const ids = dailyItems.map(i => i.id);
    const res = await Service.batchDelete(trip.id, 'itinerary', ids);
    if (Service.mode === 'local' && res) setItems(res);
  };

  const handleImg = async (e, current, cb) => {
    setIsProcessing(true);
    const files = Array.from(e.target.files||[]);
    const res = await Promise.all(files.map(resizeImage));
    cb([...current, ...res.filter(r=>r)]);
    setIsProcessing(false); e.target.value='';
  };

  const handleMove = async (idx, dir) => {
    const currentList = dailyItems;
    const targetIdx = idx + dir;
    if(targetIdx < 0 || targetIdx >= currentList.length) return;
    
    const a = currentList[idx];
    const b = currentList[targetIdx];
    const res = await Service.batchSwap(trip.id, a, b);
    if (Service.mode === 'local') setItems(res);
  };

  const getDisplayD = () => getDisplayDate(trip.startDate, day);

  const totalDays = calculateDays(trip.startDate, trip.endDate);
  const isItineraryEdit = editingItem && editingItem.hasOwnProperty('activity');
  const dailyItems = items.filter(i => i.day === day);
  const dailyMemories = memories.filter(m => m.day === day);
  
  const safeAtt = (i) => Array.isArray(i?.attachments) ? i.attachments : [];
  const typeIcon = (t) => { if(t==='shopping') return '🛍️'; if(t==='food') return '🍜'; if(t==='transport') return '🚆'; if(t==='stay') return '🏨'; return '🎡'; };

  return (
    <>
      <ConfirmModal 
        isOpen={deleteModal.isOpen} 
        title={deleteModal.type === 'batch_day' ? "清空當日行程" : "確認刪除"} 
        message={deleteModal.type === 'batch_day' ? `確定要刪除 Day ${day} 的所有行程嗎？` : "確定要刪除這個項目嗎？"}
        onConfirm={() => { 
          if (deleteModal.type === 'batch_day') {
             performBatchDelete();
          } else {
             handleItemAction(deleteModal.type, 'delete', null, deleteModal.id); 
          }
          setDeleteModal({ isOpen: false }); 
        }} 
        onCancel={() => setDeleteModal({ isOpen: false })} 
      />
      <ImportModal isOpen={importOpen} onClose={() => setImportOpen(false)} onImport={handleImport} />
      <TripSettingsModal isOpen={settingsOpen} trip={trip} onClose={() => setSettingsOpen(false)} onSave={onUpdate} handleImg={handleImg} />
      {gallery && <ImageViewer images={gallery.images} initialIndex={gallery.index} onClose={() => setGallery(null)} />}

      {/* Edit/Add Modal */}
      <Modal isOpen={editOpen || !!editingItem} title={editingItem ? "編輯" : "新增"} onClose={()=>{setEditOpen(false); setEditingItem(null);}}>
        <div className="space-y-3">
           {((editingItem && isItineraryEdit) || (!editingItem && activeTab==='plan')) ? (
             <>
               <div className="flex gap-2">
                 <input type="time" className="border p-2 rounded w-1/3" value={editingItem?editingItem.time:newItem.time} onChange={e=>{const v=e.target.value; editingItem?setEditingItem({...editingItem, time:v}):setNewItem({...newItem, time:v})}} />
                 <select className="border p-2 rounded w-2/3" value={editingItem?editingItem.type:newItem.type} onChange={e=>{const v=e.target.value; editingItem?setEditingItem({...editingItem, type:v}):setNewItem({...newItem, type:v})}}><option value="fun">🎡 景點</option><option value="food">🍜 美食</option><option value="shopping">🛍️ 購物</option><option value="transport">🚆 交通</option><option value="stay">🏨 住宿</option></select>
               </div>
               <input className="w-full border p-2 rounded" placeholder="名稱" value={editingItem?editingItem.activity:newItem.activity} onChange={e=>{const v=e.target.value; editingItem?setEditingItem({...editingItem, activity:v}):setNewItem({...newItem, activity:v})}} />
               <LocationInput placeholder="地點" value={editingItem?editingItem.location:newItem.location} onChange={v=>editingItem?setEditingItem({...editingItem, location:v}):setNewItem({...newItem, location:v})} />
               <textarea className="w-full border p-2 rounded h-20" placeholder="備註" value={editingItem?editingItem.notes:newItem.notes} onChange={e=>{const v=e.target.value; editingItem?setEditingItem({...editingItem, notes:v}):setNewItem({...newItem, notes:v})}} />
             </>
           ) : (
             <>
               <div className="grid grid-cols-5 gap-2">{MOODS.map(m=><button key={m.k} onClick={()=>editingItem?setEditingItem({...editingItem, mood:m.k}):setNewMem({...newMem, mood:m.k})} className={`flex flex-col items-center p-1 rounded ${(editingItem?editingItem.mood:newMem.mood)===m.k?'bg-indigo-100 border-indigo-300 border':''}`}><span className="text-xl">{m.i}</span><span className="text-[10px]">{m.l}</span></button>)}</div>
               <div className="flex gap-2 items-center"><span className="text-xs">關聯:</span><select className="border p-2 rounded flex-1 text-sm" value={editingItem?editingItem.linkedId:newMem.linkedId} onChange={e=>{const v=e.target.value; editingItem?setEditingItem({...editingItem, linkedId:v}):setNewMem({...newMem, linkedId:v})}}><option value="">-- 無 --</option>{dailyItems.map(i=><option key={i.id} value={i.id}>{i.time} {i.activity}</option>)}</select></div>
               <textarea className="w-full border p-2 rounded h-32" placeholder="回憶..." value={editingItem?editingItem.text:newMem.text} onChange={e=>{const v=e.target.value; editingItem?setEditingItem({...editingItem, text:v}):setNewMem({...newMem, text:v})}} />
             </>
           )}
           <div className="flex justify-between items-center border p-2 rounded"><span className="text-xs">圖片</span><button onClick={()=>fileRef.current.click()} className="text-sky-600 font-bold"><Icons.Plus/></button><input type="file" multiple hidden ref={fileRef} onChange={e=>handleImg(e, editingItem?safeAtt(editingItem):(activeTab==='plan'?newItem.attachments:newMem.attachments), n=>{editingItem?setEditingItem({...editingItem, attachments:n}):(activeTab==='plan'?setNewItem({...newItem, attachments:n}):setNewMem({...newMem, attachments:n}))})} /></div>
           <div className="grid grid-cols-4 gap-2">{(editingItem?safeAtt(editingItem):(activeTab==='plan'?newItem.attachments:newMem.attachments)).map((a,i)=><div key={i} className="relative h-16 bg-slate-100"><img src={a} className="w-full h-full object-cover"/><button onClick={()=>{const curr=editingItem?safeAtt(editingItem):(activeTab==='plan'?newItem.attachments:newMem.attachments); const n=[...curr]; n.splice(i,1); editingItem?setEditingItem({...editingItem, attachments:n}):(activeTab==='plan'?setNewItem({...newItem, attachments:n}):setNewMem({...newMem, attachments:n}))}} className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5"><Icons.X size={10}/></button></div>)}</div>
           <div className="flex gap-2">
             {editingItem && <button onClick={()=>setDeleteModal({isOpen:true, id:editingItem.id, type:isItineraryEdit?'itinerary':'memories'})} className="flex-1 bg-red-100 text-red-600 py-2 rounded">刪除</button>}
             <button onClick={()=>{ if(editingItem) handleItemAction(editingItem.activity?'itinerary':'memories', 'update', editingItem, editingItem.id); else { if(activeTab==='plan') handleItemAction('itinerary', 'add', {day, ...newItem, completed:false}); else { const n={...newMem, id:Date.now().toString(), day, time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}; handleItemAction('memories', 'add', n); setEditOpen(false); setNewMem({text:'',mood:'happy',attachments:[], linkedId: ''}); } } }} className="flex-1 bg-sky-600 text-white py-2 rounded font-bold">儲存</button>
           </div>
        </div>
      </Modal>

      <header className={`relative text-white p-4 pt-8 shadow-md z-20 ${trip.coverImage?'h-40':'bg-sky-600'}`}>
         {trip.coverImage && <><img src={trip.coverImage} className="absolute inset-0 w-full h-full object-cover"/><div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/80"></div></>}
         <div className="relative z-10 h-full flex flex-col justify-between">
           <div className="flex items-center gap-3"><button onClick={onBack} className="p-1 hover:bg-white/20 rounded-full"><Icons.Plane className="transform rotate-180"/></button><div className="flex-1 min-w-0"><h1 className="text-xl font-bold truncate">{trip.name}</h1><p className="text-xs opacity-80">{trip.startDate} ~ {trip.endDate}</p></div><button onClick={()=>{setSettingsData({name:trip.name, startDate:trip.startDate, endDate:trip.endDate, coverImage:trip.coverImage}); setSettingsOpen(true)}} className="p-2 hover:bg-white/20 rounded-full"><Icons.Settings/></button></div>
           <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mt-auto">{Array.from({length: totalDays}).map((_, i) => (<button key={i} onClick={()=>setDay(i+1)} className={`flex-shrink-0 w-12 h-14 rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all ${day === i+1 ? 'bg-white text-sky-600 scale-105 shadow' : 'bg-white/20 text-white'}`}><span className="text-xs opacity-70">Day</span><span className="text-lg font-bold">{i+1}</span></button>))}</div>
         </div>
      </header>

      <main className="pb-24 px-4 pt-4">
        {activeTab === 'plan' ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center"><h2 className="text-lg font-bold text-slate-700 flex items-center gap-2"><Icons.Calendar/> <span>Day {day}</span><span className="text-xs bg-slate-100 px-2 rounded-full text-slate-500">{getDisplayD()}</span></h2>
            <div className="flex gap-2">
              {dailyItems.length > 0 && <button onClick={()=>setDeleteModal({isOpen:true, type:'batch_day'})} className="text-red-500 bg-white border border-red-100 p-2 rounded-full shadow-sm"><Icons.Trash/></button>}
              <button onClick={()=>setImportOpen(true)} className="text-sky-600 bg-white border border-sky-100 p-2 rounded-full"><Icons.FileText/></button>
              <button onClick={()=>{setNewItem({time:'',activity:'',location:'',type:'fun',notes:'',attachments:[]}); setEditOpen(true)}} className="text-white bg-sky-600 p-2 rounded-full shadow-md"><Icons.Plus/></button>
            </div>
            </div>
            <div className="space-y-3 relative pl-4 border-l-2 border-slate-200 ml-2">
               {dailyItems.map((item, idx) => (
                  <div key={item.id} className="relative pl-6">
                     <div className={`absolute -left-[21px] top-3 w-4 h-4 rounded-full border-2 border-white shadow-sm z-10 ${item.completed ? 'bg-slate-400' : 'bg-sky-500'}`}></div>
                     <div className={`bg-white p-3 rounded-xl shadow-sm border border-slate-100 relative ${item.completed ? 'opacity-60' : ''}`}>
                       <div className="flex justify-between items-start">
                         <div className="flex flex-col gap-1 mr-2 mt-1"><button onClick={()=>handleMove(idx, -1)} className="p-1 bg-slate-50 rounded text-slate-400"><Icons.ArrowUp/></button><button onClick={()=>handleMove(idx, 1)} className="p-1 bg-slate-50 rounded text-slate-400"><Icons.ArrowDown/></button></div>
                         <div className="flex-1 min-w-0 pr-2" onClick={()=>setEditingItem(item)}>
                            <div className="flex items-center gap-2 mb-1"><span className="font-mono text-xs font-bold text-sky-600 bg-sky-50 px-1 rounded">{item.time}</span><span className="text-lg">{typeIcon(item.type)}</span></div>
                            <h3 className="font-bold text-slate-800 text-sm truncate">{item.activity}</h3>
                            {item.location && <div className="flex items-center gap-1 text-xs text-slate-400 mt-1"><Icons.MapPin/> {item.location}</div>}
                            {(item.notes || safeAtt(item).length>0) && <div className="mt-2 bg-slate-50 p-2 rounded text-xs text-slate-600">{item.notes}{safeAtt(item).length>0 && <div className="flex gap-1 mt-1">{safeAtt(item).map((a,i)=><img key={i} src={a} className="w-8 h-8 rounded object-cover"/>)}</div>}</div>}
                         </div>
                         <div className="flex flex-col gap-2 border-l pl-2"><button onClick={()=>handleItemAction('itinerary', 'update', {completed:!item.completed}, item.id)} className={`mt-1 ${item.completed?'text-green-500':'text-slate-300'}`}><Icons.Check/></button><button onClick={()=>setEditingItem(item)} className="text-slate-300"><Icons.Settings/></button></div>
                       </div>
                       <SwipeableRow onDeleteRequest={()=>setDeleteModal({isOpen:true, id:item.id, type:'itinerary'})} onEdit={()=>setEditingItem(item)}><div/></SwipeableRow>
                     </div>
                  </div>
               ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <button onClick={()=>{setNewMem({text:'', mood:'happy', attachments:[], linkedId:''}); setEditOpen(true);}} className="w-full py-3 bg-indigo-100 text-indigo-600 rounded-lg font-bold flex items-center justify-center gap-2"><Icons.Camera/> 新增回憶</button>
            {dailyMemories.map(m=>{
               const linked = dailyItems.find(i=>i.id===m.linkedId);
               const moodData = MOODS.find(x=>x.k===m.mood) || MOODS[0];
               return (
                 <div key={m.id} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 relative" onClick={()=>setEditingItem(m)}>
                    <div className="absolute top-2 right-2 text-slate-300"><Icons.Settings/></div>
                    {safeAtt(m).length>0 && <div className="flex gap-1 mb-2">{safeAtt(m).map((a,i)=><img key={i} src={a} className="h-20 w-full object-cover rounded bg-slate-100" onClick={e=>{e.stopPropagation();setGallery({images:safeAtt(m), index:i})}}/>)}</div>}
                    {linked && <div className="text-xs text-sky-600 bg-sky-50 inline-block px-1 rounded mb-1"><Icons.MapPin/> 於 {linked.activity}</div>}
                    <p className="text-sm text-slate-800 whitespace-pre-wrap">{m.text}</p>
                    <div className="mt-2 pt-2 border-t flex justify-between text-xs text-slate-400"><span>{m.time}</span><span title={moodData.l}>{moodData.i}</span></div>
                    <SwipeableRow onDeleteRequest={()=>setDeleteModal({isOpen:true, id:m.id, type:'memories'})} onEdit={()=>setEditingItem(m)}><div/></SwipeableRow>
                 </div>
               );
            })}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-around items-center z-30 max-w-md mx-auto">
         <button onClick={()=>setActiveTab('plan')} className={`flex flex-col items-center gap-1 ${activeTab==='plan'?'text-sky-600':'text-slate-300'}`}><Icons.Calendar/><span className="text-[10px] font-bold">行程</span></button>
         <button onClick={()=>setActiveTab('record')} className={`flex flex-col items-center gap-1 ${activeTab==='record'?'text-indigo-600':'text-slate-300'}`}><Icons.Camera/><span className="text-[10px] font-bold">回憶</span></button>
      </nav>
    </>
  );
}