import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp, writeBatch } from 'firebase/firestore';

// ==========================================
// 0. 全局主題 Context
// ==========================================
export const ThemeContext = React.createContext(false);

// ==========================================
// 1. Firebase 設定
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
// 2. 風格與圖示系統 (支援深色模式)
// ==========================================

const getTypeStyle = (type, isDark) => {
  const styles = {
    fun:      { dot: 'bg-sky-400',       line: 'bg-sky-200',     text: isDark?'text-sky-400':'text-sky-600',     bg: isDark?'bg-sky-900/20':'bg-sky-50',     border: isDark?'border-sky-900/50':'border-sky-100' },
    food:     { dot: 'bg-orange-400',    line: 'bg-orange-200',  text: isDark?'text-orange-400':'text-orange-600',  bg: isDark?'bg-orange-900/20':'bg-orange-50',  border: isDark?'border-orange-900/50':'border-orange-100' },
    shopping: { dot: 'bg-pink-400',      line: 'bg-pink-200',    text: isDark?'text-pink-400':'text-pink-600',    bg: isDark?'bg-pink-900/20':'bg-pink-50',    border: isDark?'border-pink-900/50':'border-pink-100' },
    transport:{ dot: 'bg-indigo-400',    line: 'bg-indigo-200',  text: isDark?'text-indigo-400':'text-indigo-600',  bg: isDark?'bg-indigo-900/20':'bg-indigo-50',  border: isDark?'border-indigo-900/50':'border-indigo-100' },
    stay:     { dot: 'bg-emerald-400',   line: 'bg-emerald-200', text: isDark?'text-emerald-400':'text-emerald-600', bg: isDark?'bg-emerald-900/20':'bg-emerald-50', border: isDark?'border-emerald-900/50':'border-emerald-100' },
    default:  { dot: 'bg-slate-400',     line: 'bg-slate-200',   text: isDark?'text-slate-400':'text-slate-600',   bg: isDark?'bg-slate-800':'bg-white',      border: isDark?'border-slate-700':'border-slate-100' }
  };
  return styles[type] || styles.default;
};

const SvgIcon = ({ children, size = 20, className = "", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    {children}
  </svg>
);

const Icons = {
  Plane: (p) => <SvgIcon {...p} fill="currentColor" stroke="none"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></SvgIcon>,
  Calendar: (p) => <SvgIcon {...p}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></SvgIcon>,
  Camera: (p) => <SvgIcon {...p}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></SvgIcon>,
  Plus: (p) => <SvgIcon {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></SvgIcon>,
  Trash: (p) => <SvgIcon {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></SvgIcon>,
  Check: (p) => <SvgIcon {...p}><polyline points="20 6 9 17 4 12"/></SvgIcon>,
  MapPin: (p) => <SvgIcon {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></SvgIcon>,
  ArrowLeft: (p) => <SvgIcon {...p}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></SvgIcon>,
  X: (p) => <SvgIcon {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></SvgIcon>,
  Settings: (p) => <SvgIcon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></SvgIcon>,
  ArrowUp: (p) => <SvgIcon {...p}><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></SvgIcon>,
  ArrowDown: (p) => <SvgIcon {...p}><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></SvgIcon>,
  ChevronRight: (p) => <SvgIcon {...p}><polyline points="9 18 15 12 9 6"/></SvgIcon>,
  ChevronLeft: (p) => <SvgIcon {...p}><polyline points="15 18 9 12 15 6"/></SvgIcon>,
  FileText: (p) => <SvgIcon {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></SvgIcon>,
  Map: (p) => <SvgIcon {...p}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></SvgIcon>,
  Refresh: (p) => <SvgIcon {...p}><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></SvgIcon>,
  Cloud: (p) => <SvgIcon {...p}><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></SvgIcon>,
  CloudOff: (p) => <SvgIcon {...p}><path d="M22.61 16.95A5 5 0 0 0 18 10h-1.26a8 8 0 0 0-7.05-6M5 5a8 8 0 0 0 4 15h9a5 5 0 0 0 1.7-.3"/><line x1="1" y1="1" x2="23" y2="23"/></SvgIcon>,
  Copy: (p) => <SvgIcon {...p}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></SvgIcon>,
  Loader: (p) => <SvgIcon {...p} className={`animate-spin ${p.className||''}`}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></SvgIcon>,
  LogOut: (p) => <SvgIcon {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></SvgIcon>,
  Database: (p) => <SvgIcon {...p}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></SvgIcon>,
  Printer: (p) => <SvgIcon {...p}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></SvgIcon>,
  Upload: (p) => <SvgIcon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></SvgIcon>,
  Download: (p) => <SvgIcon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></SvgIcon>,
  Moon: (p) => <SvgIcon {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></SvgIcon>,
  Sun: (p) => <SvgIcon {...p}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></SvgIcon>
};

// ==========================================
// 3. Local Database (IndexedDB)
// ==========================================

const LocalDB = {
  dbName: 'TravelMateDB',
  version: 1,
  dbPromise: null,

  init: () => {
    if (!window.indexedDB) return Promise.resolve(null);
    if (LocalDB.dbPromise) return LocalDB.dbPromise;

    LocalDB.dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(LocalDB.dbName, LocalDB.version);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('backup')) db.createObjectStore('backup');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => { LocalDB.dbPromise = null; reject(req.error); };
    });
    return LocalDB.dbPromise;
  },

  set: async (key, value) => {
    try {
      const db = await LocalDB.init();
      if (!db) return;
      return new Promise((resolve, reject) => {
        const tx = db.transaction('backup', 'readwrite');
        const store = tx.objectStore('backup');
        store.put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) { console.error("LocalDB Save Failed:", e); }
  },

  get: async (key) => {
    try {
      const db = await LocalDB.init();
      if (!db) return [];
      return new Promise((resolve, reject) => {
        const tx = db.transaction('backup', 'readonly');
        const store = tx.objectStore('backup');
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch (e) { console.error("LocalDB Read Failed:", e); return []; }
  },

  getAllKeys: async () => {
    try {
      const db = await LocalDB.init();
      if (!db) return [];
      return new Promise((resolve, reject) => {
        const tx = db.transaction('backup', 'readonly');
        const store = tx.objectStore('backup');
        const req = store.getAllKeys();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch (e) { return []; }
  },

  clear: async () => {
    try {
      const db = await LocalDB.init();
      if (!db) return;
      return new Promise((resolve, reject) => {
        const tx = db.transaction('backup', 'readwrite');
        const store = tx.objectStore('backup');
        store.clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) { console.error("LocalDB Clear Failed:", e); }
  }
};

const Service = {
  db: null, auth: null, user: null, mode: 'loading',
  init: async () => {
    if (!navigator.onLine) {
      Service.user = { uid: 'guest' }; Service.mode = 'local'; return 'local';
    }
    try {
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      Service.auth = getAuth(app);
      Service.db = getFirestore(app);
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(Service.auth, __initial_auth_token);
      else if (!Service.auth.currentUser) try { await signInAnonymously(Service.auth); } catch(e){ Service.user = { uid: 'guest' }; Service.mode = 'local'; return 'local'; }
      
      return new Promise(resolve => {
        const timeout = setTimeout(() => { Service.user = { uid: 'guest' }; Service.mode = 'local'; resolve('local'); }, 2000);
        onAuthStateChanged(Service.auth, (u) => { clearTimeout(timeout); if (u) { Service.user = u; Service.mode = 'cloud'; resolve('cloud'); } else { Service.user = { uid: 'guest' }; Service.mode = 'local'; resolve('local'); } });
      });
    } catch (e) { Service.user = { uid: 'guest' }; Service.mode = 'local'; return 'local'; }
  },
  
  subscribe: (tripId, type, callback) => {
    const backupKey = tripId ? `tm_v3_${type}_${tripId}` : 'tm_v3_trips';
    let isActive = true;
    LocalDB.get(backupKey).then(data => { if (isActive && data && data.length > 0) callback(data); else if (isActive) callback([]); });

    let unsubscribe = () => {};
    if (Service.mode === 'cloud' && Service.db && navigator.onLine) {
      try {
        const rootPath = 'travel-mate-data'; 
        let path = tripId ? ['artifacts', rootPath, 'public', 'data', 'trips', tripId, type] : ['artifacts', rootPath, 'public', 'data', 'trips'];
        let q = collection(Service.db, ...path);
        if (!tripId) q = query(q, orderBy('startDate', 'desc'));
        else if (type === 'itinerary') q = query(q, orderBy('time', 'asc'));
        else q = query(q, orderBy('createdAt', 'desc'));
        
        unsubscribe = onSnapshot(q, (snap) => {
           if (!isActive) return;
           const data = snap.docs.map(d => ({ ...d.data(), id: d.id }));
           callback(data);
           LocalDB.set(backupKey, data);
        }, () => {});
      } catch (e) {}
    }
    return () => { isActive = false; unsubscribe(); };
  },

  op: async (tripId, type, action, data, id) => {
    if (Service.mode === 'cloud' && Service.db && navigator.onLine) {
      try {
        const rootPath = 'travel-mate-data';
        let path = tripId ? ['artifacts', rootPath, 'public', 'data', 'trips', tripId, type] : ['artifacts', rootPath, 'public', 'data', 'trips'];
        const colRef = collection(Service.db, ...path);
        if (action === 'add') await addDoc(colRef, { ...data, createdAt: serverTimestamp() });
        else if (action === 'update') await updateDoc(doc(colRef, id), data);
        else if (action === 'delete') await deleteDoc(doc(colRef, id));
        return null;
      } catch (e) { alert("連線失敗，無法同步至雲端。"); return null; }
    } else {
      alert("目前處於離線模式，變更將無法儲存至雲端，請連接網路後再試。"); return null;
    }
  },
  
  batchSwap: async (tripId, itemA, itemB) => {
    if (Service.mode === 'cloud' && Service.db && navigator.onLine) {
        const batch = writeBatch(Service.db);
        const pathBase = ['artifacts', 'travel-mate-data', 'public', 'data', 'trips', tripId, 'itinerary'];
        batch.update(doc(Service.db, ...pathBase, itemA.id), { time: itemB.time });
        batch.update(doc(Service.db, ...pathBase, itemB.id), { time: itemA.time });
        await batch.commit();
    }
  },
  batchDelete: async (tripId, type, ids) => {
    if (Service.mode === 'cloud' && Service.db && navigator.onLine) {
        const batch = writeBatch(Service.db);
        const pathBase = ['artifacts', 'travel-mate-data', 'public', 'data', 'trips', tripId, 'itinerary'];
        ids.forEach(id => batch.delete(doc(Service.db, ...pathBase, id)));
        await batch.commit();
    }
  },

  exportAll: async () => {
    const keys = await LocalDB.getAllKeys();
    const exportData = {};
    for (const key of keys) {
      exportData[key] = await LocalDB.get(key);
    }
    return JSON.stringify(exportData);
  },

  importAll: async (jsonStr) => {
    try {
      const data = JSON.parse(jsonStr);
      for (const key in data) {
        await LocalDB.set(key, data[key]);
      }
      return true;
    } catch (e) { console.error(e); return false; }
  },

  logout: async () => {
    try { if (Service.auth) await signOut(Service.auth); await LocalDB.clear(); localStorage.clear(); window.location.reload(); } 
    catch (e) { window.location.reload(); }
  }
};

// ==========================================
// 4. UI 元件 (全面適配深色模式)
// ==========================================
const Modal = ({ isOpen, onClose, title, children }) => {
  const isDark = React.useContext(ThemeContext);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in">
      <div className={`rounded-xl w-full max-w-sm p-5 shadow-2xl flex flex-col max-h-[90vh] ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white'}`}>
        <div className={`flex justify-between items-center mb-4 pb-2 border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
          <h3 className={`font-bold text-lg ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{title}</h3>
          <button onClick={onClose}><Icons.X className="opacity-50 hover:opacity-100"/></button>
        </div>
        <div className="overflow-y-auto custom-scrollbar">{children}</div>
      </div>
    </div>
  );
};

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  const isDark = React.useContext(ThemeContext);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 animate-in fade-in">
      <div className={`rounded-xl shadow-2xl w-full max-w-xs p-5 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white'}`}>
        <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{title}</h3>
        <p className={`text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className={`flex-1 py-2 rounded text-sm transition-colors ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>取消</button>
          <button onClick={onConfirm} className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition-colors">確定</button>
        </div>
      </div>
    </div>
  );
};

const DataToolsModal = ({ isOpen, onClose }) => {
  const isDark = React.useContext(ThemeContext);
  const [status, setStatus] = useState('');
  const [exportData, setExportData] = useState('');
  
  useEffect(() => {
    if (isOpen) { setStatus(''); setExportData(''); }
  }, [isOpen]);
  
  const handleExport = async () => {
    setStatus('正在打包資料... (請稍候)');
    setExportData('');
    setTimeout(async () => {
        try {
            const dataStr = await Service.exportAll();
            if (dataStr === '{}' || dataStr === '[]') { setStatus('沒有可匯出的資料 (本地資料庫為空)'); return; }
            setExportData(dataStr);
            const textArea = document.createElement("textarea");
            textArea.value = dataStr;
            document.body.appendChild(textArea);
            textArea.select();
            try {
              const successful = document.execCommand('copy');
              if(successful) setStatus('✅ 備份代碼已複製！若貼上失敗，請手動複製下方文字。');
              else setStatus('⚠️ 自動複製失敗，請手動複製下方文字。');
            } catch (err) { setStatus('⚠️ 自動複製失敗，請手動複製下方文字。'); }
            document.body.removeChild(textArea);
        } catch (e) { setStatus('❌ 匯出錯誤: ' + e.message); }
    }, 100);
  };

  const handleImport = async () => {
    const str = prompt("請貼上備份代碼：");
    if (!str) return;
    setStatus('正在匯入...');
    setTimeout(async () => {
        const success = await Service.importAll(str);
        if (success) { alert("匯入成功！即將重新整理..."); window.location.reload(); } 
        else { setStatus('❌ 匯入失敗，格式錯誤'); }
    }, 100);
  };

  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="資料管理中心">
      <div className="space-y-4">
        <div className={`p-3 rounded text-xs ${isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
          <p className="font-bold mb-1">💡 為什麼需要這個？</p>
          <p>如果在 iPhone 桌面模式發現資料遺失，您可以使用此功能手動搬移資料。</p>
        </div>
        <button onClick={handleExport} className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}`}>
          <Icons.Upload size={18} /> 匯出備份 (產生代碼)
        </button>
        {exportData && (
            <div className="animate-in fade-in slide-in-from-top-2">
                <label className="text-xs text-slate-500 block mb-1">備份代碼 (請全選複製)：</label>
                <textarea className={`w-full h-32 border p-2 rounded text-[10px] font-mono break-all outline-none focus:ring-2 focus:ring-sky-500 ${isDark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'}`} value={exportData} readOnly onClick={(e) => e.target.select()} />
            </div>
        )}
        <button onClick={handleImport} className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}`}>
          <Icons.Download size={18} /> 匯入備份 (貼上代碼)
        </button>
        <button onClick={()=>{if(confirm("確定清除所有資料與登出？")) Service.logout()}} className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 mt-6 border transition-colors ${isDark ? 'bg-red-900/20 text-red-400 border-red-900/50 hover:bg-red-900/40' : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'}`}>
          <Icons.LogOut size={18} /> 清除資料並登出
        </button>
        {status && <div className="text-center text-sm font-bold text-emerald-500 animate-pulse">{status}</div>}
      </div>
    </Modal>
  );
};

const LocationInput = ({ value, onChange, placeholder }) => {
  const isDark = React.useContext(ThemeContext);
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
          <span className={`absolute left-2.5 top-2.5 opacity-50 ${isDark?'text-slate-300':''}`}><Icons.MapPin size={14}/></span>
          <input className={`w-full border p-2 rounded-lg text-sm pl-8 outline-none focus:ring-2 focus:ring-sky-500 transition-colors ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'}`} placeholder={placeholder} value={value} onChange={e=>{onChange(e.target.value); if(e.target.value.length>1) search(e.target.value); else setShow(false);}} />
        </div>
        <button onClick={()=>value && window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`)} className={`p-2 rounded border transition-colors ${isDark ? 'bg-blue-900/30 text-blue-400 border-blue-900/50 hover:bg-blue-900/50' : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100'}`}><Icons.Map size={18}/></button>
      </div>
      {show && suggestions.length>0 && (
        <ul className={`absolute z-50 left-0 right-0 mt-1 border rounded shadow-xl max-h-48 overflow-y-auto ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          {suggestions.map((p,i)=>(<li key={i} onClick={()=>{onChange(p.display_name.split(',')[0]); setShow(false);}} className={`px-3 py-2 text-xs cursor-pointer border-b transition-colors ${isDark ? 'hover:bg-slate-700 border-slate-700 text-slate-200' : 'hover:bg-slate-50 border-slate-100 text-slate-700'}`}><span className="font-bold block">{p.display_name.split(',')[0]}</span></li>))}
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

const SwipeableRow = ({ children, onDeleteRequest, onEdit, className = "" }) => {
  const [offset, setOffset] = useState(0);
  const startX = useRef(0);
  const handleStart = (cx) => { startX.current = cx; };
  const handleMove = (cx) => { const diff = cx - startX.current; if (diff < 0) setOffset(Math.max(diff, -80)); };
  const handleEnd = () => setOffset(offset < -40 ? -80 : 0);
  return (
    <div className={`relative w-full rounded-xl h-auto select-none overflow-visible group touch-pan-y ${className}`}>
      <div className="absolute inset-0 bg-red-500 rounded-xl flex justify-end items-center z-0"><button onClick={(e) => { e.stopPropagation(); onDeleteRequest(() => setOffset(0)); }} className="w-20 h-full flex flex-col items-center justify-center text-white active:bg-red-600 transition-colors"><Icons.Trash size={20} /><span className="text-[10px] font-bold mt-1">刪除</span></button></div>
      <div className="relative z-10 transition-transform duration-200 ease-out h-full w-full" style={{ transform: `translateX(${offset}px)` }} onTouchStart={e => handleStart(e.touches[0].clientX)} onTouchMove={e => handleMove(e.touches[0].clientX)} onTouchEnd={handleEnd} onMouseDown={e => handleStart(e.clientX)} onMouseMove={e => handleMove(e.clientX)} onMouseUp={handleEnd} onMouseLeave={handleEnd} onClick={() => { if (offset < 0) setOffset(0); else onEdit(); }}>{children}</div>
    </div>
  );
};

const ImportModal = ({ isOpen, onClose, onImport }) => {
  const isDark = React.useContext(ThemeContext);
  const [text, setText] = useState('');
  const exampleText = `09:00 | 參觀羅浮宮 | 巴黎第1區 | 景點\n12:30 | 花神咖啡館午餐 | 聖日耳曼大道 | 美食`;
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 animate-in fade-in">
      <div className={`rounded-xl w-full max-w-md p-5 flex flex-col max-h-[90vh] ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-4"><h3 className={`text-lg font-bold flex items-center gap-2 ${isDark?'text-slate-100':'text-slate-800'}`}><Icons.FileText size={20}/> 批量匯入</h3><button onClick={onClose}><Icons.X className="opacity-50 hover:opacity-100"/></button></div>
        <div className={`p-3 rounded-lg border mb-4 text-xs space-y-2 ${isDark ? 'bg-slate-900/50 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
          <div className="flex justify-between items-center font-bold"><span>格式範例：</span><button onClick={() => setText(exampleText)} className="text-teal-500 flex items-center gap-1 hover:underline"><Icons.Copy size={10}/> 複製範例</button></div>
          <p className={`font-mono p-2 rounded border whitespace-pre-wrap ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-100'}`}>時間 | 行程名稱 | 地點 | 類型</p>
        </div>
        <textarea className={`flex-1 border p-3 rounded-lg text-sm font-mono focus:ring-2 focus:ring-teal-500 outline-none resize-none mb-4 h-48 ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-200 placeholder-slate-400'}`} placeholder={`在此貼上...\n\n${exampleText}`} value={text} onChange={e => setText(e.target.value)}/>
        <div className="flex gap-3"><button onClick={onClose} className={`flex-1 py-3 rounded-lg font-bold text-sm transition-colors ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>取消</button><button onClick={() => { onImport(text); onClose(); setText(''); }} className="flex-1 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold text-sm shadow-md transition-colors" disabled={!text.trim()}>匯入</button></div>
      </div>
    </div>
  );
};

const TripSettingsModal = ({ isOpen, trip, onClose, onSave, handleImg, isProcessing }) => {
  const isDark = React.useContext(ThemeContext);
  const [data, setData] = useState({ name: '', startDate: '', endDate: '' });
  const fileRef = useRef(null);
  useEffect(() => { if (trip) setData({ name: trip.name, startDate: trip.startDate, endDate: trip.endDate, coverImage: trip.coverImage }); }, [trip, isOpen]);
  
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 animate-in fade-in">
      <div className={`rounded-xl w-full max-w-sm p-5 flex flex-col ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-4"><h3 className={`text-lg font-bold flex items-center gap-2 ${isDark?'text-slate-100':'text-slate-800'}`}><Icons.Settings className="text-sky-500" size={20}/> 旅行設定</h3><button onClick={onClose}><Icons.X className="opacity-50 hover:opacity-100"/></button></div>
        <div className="space-y-4 mb-6">
          <div className={`border p-2 rounded text-center cursor-pointer relative overflow-hidden ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'}`} onClick={()=>fileRef.current.click()}>
             {data.coverImage ? <img src={data.coverImage} className="h-32 w-full object-cover rounded"/> : <div className={`h-20 flex flex-col justify-center items-center ${isDark ? 'text-slate-400' : 'text-slate-400'}`}><Icons.Camera size={24}/><span className="text-xs mt-1">變更封面</span></div>}
             {isProcessing && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Icons.Loader className="text-white" size={30}/></div>}
             <input type="file" hidden ref={fileRef} onChange={async e=>{handleImg(e, [], n=>{if(n[0]) setData({...data, coverImage: n[0]})})}}/>
          </div>
          <div><label className={`block text-xs mb-1 ${isDark?'text-slate-400':'text-slate-500'}`}>名稱</label><input className={`w-full border p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-500 ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-800'}`} value={data.name} onChange={e => setData({...data, name: e.target.value})}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={`block text-xs mb-1 ${isDark?'text-slate-400':'text-slate-500'}`}>開始</label><input type="date" className={`w-full border p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-500 ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-800'}`} value={data.startDate} onChange={e => setData({...data, startDate: e.target.value})}/></div>
            <div><label className={`block text-xs mb-1 ${isDark?'text-slate-400':'text-slate-500'}`}>結束</label><input type="date" className={`w-full border p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-500 ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-800'}`} value={data.endDate} onChange={e => setData({...data, endDate: e.target.value})}/></div>
          </div>
        </div>
        <button onClick={() => { onSave(data); onClose(); }} className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-sm shadow-md transition-colors">儲存變更</button>
      </div>
    </div>
  );
};

// ==========================================
// 5. 錯誤邊界與輔助函數
// ==========================================
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-slate-800 bg-red-50 text-center print:hidden">
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

const calculateDays = (s, e) => { 
  try { 
    if(!s || !e) return 1;
    const d1 = new Date(s.replace(/-/g, '/')); 
    const d2 = new Date(e.replace(/-/g, '/'));
    if(isNaN(d1) || isNaN(d2)) return 1;
    return Math.max(1, Math.ceil(Math.abs(d2 - d1) / 86400000) + 1); 
  } catch { return 1; } 
};

const getDisplayDate = (start, dayIdx) => {
  if (!start) return `Day ${dayIdx}`;
  try {
    const d = new Date(start.replace(/-/g, '/')); 
    if (isNaN(d.getTime())) return `Day ${dayIdx}`;
    d.setDate(d.getDate() + (dayIdx - 1));
    return d.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric', weekday: 'short' });
  } catch { return `Day ${dayIdx}`; }
};

const getPlaneRotation = (startDate, endDate) => {
  if (!startDate || !endDate) return "rotate-0";
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  if (todayStr < startDate) return "rotate-0"; 
  if (todayStr > endDate) return "rotate-180"; 
  return "rotate-90"; 
};

const MOODS = [
  {k:'happy',i:'😊',l:'開心'},{k:'excited',i:'😆',l:'興奮'},{k:'relaxed',i:'😌',l:'放鬆'},{k:'loved',i:'🥰',l:'幸福'},
  {k:'hungry',i:'😋',l:'貪吃'},{k:'surprised',i:'😲',l:'驚訝'},{k:'tired',i:'😴',l:'累了'},{k:'cool',i:'😎',l:'耍酷'},
  {k:'angry',i:'😠',l:'生氣'},{k:'sad',i:'😢',l:'難過'}
];

const TYPE_ICONS = { fun:'🎡', food:'🍜', shopping:'🛍️', transport:'🚆', stay:'🏨' };

const renderTextWithLinks = (text, isDark) => {
  if (!text) return null;
  return text.split(/(https?:\/\/[^\s]+)/g).map((part, i) => {
    if (part.match(/^https?:\/\//)) {
      return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className={`underline break-all transition-colors ${isDark ? 'text-sky-400 hover:text-sky-300' : 'text-sky-600 hover:text-sky-800'}`} onClick={e => e.stopPropagation()}>{part}</a>;
    }
    return <span key={i}>{part}</span>;
  });
};

// ==========================================
// 6. 核心頁面元件
// ==========================================

function TripList({ trips, onAdd, onDelete, onSelect, mode, toggleTheme }) {
  const isDark = React.useContext(ThemeContext);
  const [isCreating, setIsCreating] = useState(false);
  const [newTrip, setNewTrip] = useState({ name: '', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0] });
  const [deleteModal, setDeleteModal] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [dataToolsModal, setDataToolsModal] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  const handleCreate = () => {
    if(!newTrip.name) return;
    onAdd(newTrip);
    setIsCreating(false); setNewTrip({ ...newTrip, name: '' });
  };

  return (
    <div className="pb-20">
      <ConfirmModal isOpen={!!deleteModal} title="刪除" message="確定刪除？" onConfirm={() => { onDelete(deleteModal); setDeleteModal(null); }} onCancel={() => setDeleteModal(null)} />
      <ConfirmModal isOpen={logoutModal} title="登出並清除資料" message="確定要登出嗎？此動作將會清除這台裝置上的所有暫存資料與照片。" onConfirm={() => Service.logout()} onCancel={() => setLogoutModal(false)} />
      <DataToolsModal isOpen={dataToolsModal} onClose={() => setDataToolsModal(false)} />

      <header className={`text-white p-6 pt-10 shadow-md rounded-b-3xl mb-6 flex justify-between items-start transition-colors duration-300 ${isDark ? 'bg-slate-800' : (mode==='cloud' && isOnline ?'bg-sky-600':'bg-slate-600')}`}>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Icons.Plane /> 我的旅程</h1>
          <div className="text-[10px] opacity-80 mt-1 flex items-center gap-1">
            {isStandalone && <span className="bg-white/20 px-1 rounded flex items-center gap-1">📱 App 模式</span>}
            {mode==='cloud' && isOnline ? <span className="flex items-center gap-1"><Icons.Cloud size={10}/> 雲端備份中</span> : <span className="flex items-center gap-1"><Icons.CloudOff size={10}/> 離線模式</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors" title="切換深色/淺色模式">
            {isDark ? <Icons.Sun size={20} /> : <Icons.Moon size={20} />}
          </button>
          <button onClick={() => setLogoutModal(true)} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors" title="登出並清除資料">
            <Icons.LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="px-4 space-y-4">
        {!isCreating ? (
          <button onClick={() => setIsCreating(true)} className={`w-full py-4 border-2 border-dashed rounded-2xl flex items-center justify-center gap-2 font-bold transition-colors ${isDark ? 'border-sky-800 text-sky-400 bg-slate-800 hover:bg-slate-700' : 'border-sky-200 text-sky-600 bg-white hover:bg-sky-50'}`}>
            <Icons.Plus/> 建立新計畫
          </button>
        ) : (
          <div className={`p-4 rounded-xl shadow-lg border animate-in fade-in transition-colors ${isDark ? 'bg-slate-800 border-sky-900' : 'bg-white border-sky-100'}`}>
            <input className={`w-full border p-2 rounded mb-2 outline-none focus:ring-2 focus:ring-sky-500 ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-200 placeholder-slate-400'}`} placeholder="旅行名稱" value={newTrip.name} onChange={e => setNewTrip({...newTrip, name: e.target.value})} />
            <div className="flex gap-2 mb-2">
              <input type="date" className={`border p-1 rounded w-1/2 outline-none focus:ring-2 focus:ring-sky-500 ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-800'}`} value={newTrip.startDate} onChange={e => setNewTrip({...newTrip, startDate: e.target.value})} />
              <input type="date" className={`border p-1 rounded w-1/2 outline-none focus:ring-2 focus:ring-sky-500 ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-800'}`} value={newTrip.endDate} onChange={e => setNewTrip({...newTrip, endDate: e.target.value})} />
            </div>
            <div className="flex gap-2">
               <button onClick={() => setIsCreating(false)} className={`flex-1 py-2 rounded text-sm transition-colors ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>取消</button>
               <button onClick={handleCreate} className="flex-1 bg-sky-600 hover:bg-sky-500 text-white py-2 rounded text-sm transition-colors">建立</button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {trips.length===0 && !isCreating && <div className={`text-center py-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>暫無行程</div>}
          {trips.map(t => (
            <div key={t.id} onClick={() => onSelect(t.id)} className={`relative rounded-xl shadow-sm border flex items-center gap-4 cursor-pointer h-auto min-h-[6rem] overflow-hidden py-2 transition-all ${isDark ? 'bg-slate-800 border-slate-700 hover:shadow-slate-900/50' : 'bg-white border-slate-100 hover:shadow-md'}`}>
               {t.coverImage ? <><img src={t.coverImage} className="absolute inset-0 w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent"></div></> : <div className={`absolute inset-0 bg-gradient-to-r ${isDark ? 'from-slate-800 to-slate-700' : 'from-sky-50 to-white'}`}></div>}
               <div className="relative z-10 flex items-center gap-4 w-full p-4">
                 <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0 transition-colors ${t.coverImage?'bg-white/20 backdrop-blur text-white':(isDark?'bg-slate-700 text-slate-300':'bg-sky-100 text-slate-700')}`}>
                   <Icons.Plane className={`transform transition-transform duration-500 ${getPlaneRotation(t.startDate, t.endDate)}`} />
                 </div>
                 <div className="flex-1 min-w-0">
                    <h3 className={`font-bold ${t.name.length > 6 ? 'text-base whitespace-normal break-words line-clamp-2 leading-tight' : 'text-lg truncate'} ${t.coverImage?'text-white':(isDark?'text-slate-100':'text-slate-800')}`}>{t.name}</h3>
                    <p className={`text-xs mt-1 ${t.coverImage?'text-white/80':(isDark?'text-slate-400':'text-slate-400')}`}>{t.startDate} ~ {t.endDate}</p>
                 </div>
                 <button onClick={e=>{e.stopPropagation(); setDeleteModal(t.id)}} className={`p-2 rounded-full shrink-0 transition-colors ${t.coverImage?'text-white/80 hover:text-red-300':(isDark?'text-slate-500 hover:text-red-400':'text-slate-300 hover:text-red-500')}`}><Icons.Trash size={18}/></button>
               </div>
            </div>
          ))}
        </div>
      </div>
      
      <button onClick={() => setDataToolsModal(true)} className={`fixed bottom-4 left-4 z-50 p-3 shadow-lg rounded-full border transition-colors ${isDark ? 'bg-slate-800 text-slate-300 border-slate-700 hover:text-sky-400 hover:border-sky-800' : 'bg-white text-slate-600 border-slate-200 hover:text-sky-600 hover:border-sky-200'}`}>
        <Icons.Database size={20}/>
      </button>
    </div>
  );
}

// === Trip Detail ===
function TripDetail({ trip, mode, onUpdate, onBack, toggleTheme }) {
  const isDark = React.useContext(ThemeContext);
  const [day, setDay] = useState(1);
  const [activeTab, setActiveTab] = useState('plan');
  
  const [editOpen, setEditOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [gallery, setGallery] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, type: 'itinerary' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);
  
  const [newItem, setNewItem] = useState({ time: '', activity: '', location: '', type: 'fun', notes: '', attachments: [] });
  const [newMem, setNewMem] = useState({ text: '', mood: 'happy', attachments: [], linkedId: '' });

  const fileRef = useRef(null);
  
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
    setEditOpen(false); 
    setEditingItem(null); 
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
    setImportOpen(false);
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
  const typeIcon = (t) => TYPE_ICONS[t] || '📍';

  return (
    <>
      <ConfirmModal isOpen={deleteModal.isOpen} title={deleteModal.type === 'batch_day' ? "清空當日行程" : "確認刪除"} message={deleteModal.type === 'batch_day' ? `確定要刪除 Day ${day} 的所有行程嗎？` : "確定要刪除這個項目嗎？"} onConfirm={() => { if (deleteModal.type === 'batch_day') performBatchDelete(); else handleItemAction(deleteModal.type, 'delete', null, deleteModal.id); setDeleteModal({ isOpen: false }); }} onCancel={() => setDeleteModal({ isOpen: false })} />
      <ImportModal isOpen={importOpen} onClose={() => setImportOpen(false)} onImport={handleImport} />
      <TripSettingsModal isOpen={settingsOpen} trip={trip} onClose={() => setSettingsOpen(false)} onSave={onUpdate} handleImg={handleImg} isProcessing={isProcessing} />
      {gallery && <ImageViewer images={gallery.images} initialIndex={gallery.index} onClose={() => setGallery(null)} />}

      <Modal isOpen={editOpen || !!editingItem} title={editingItem ? "編輯" : "新增"} onClose={()=>{setEditOpen(false); setEditingItem(null);}}>
        <div className="space-y-3">
           {((editingItem && isItineraryEdit) || (!editingItem && activeTab==='plan')) ? (
             <>
               <div className="flex gap-2">
                 <input type="time" className={`border p-2 rounded w-1/3 outline-none focus:ring-2 focus:ring-sky-500 ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-800'}`} value={editingItem?editingItem.time:newItem.time} onChange={e=>{const v=e.target.value; editingItem?setEditingItem({...editingItem, time:v}):setNewItem({...newItem, time:v})}} />
                 <select className={`border p-2 rounded w-2/3 outline-none focus:ring-2 focus:ring-sky-500 ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-800'}`} value={editingItem?editingItem.type:newItem.type} onChange={e=>{const v=e.target.value; editingItem?setEditingItem({...editingItem, type:v}):setNewItem({...newItem, type:v})}}><option value="fun">🎡 景點</option><option value="food">🍜 美食</option><option value="shopping">🛍️ 購物</option><option value="transport">🚆 交通</option><option value="stay">🏨 住宿</option></select>
               </div>
               <input className={`w-full border p-2 rounded outline-none focus:ring-2 focus:ring-sky-500 ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-200 placeholder-slate-400'}`} placeholder="名稱" value={editingItem?editingItem.activity:newItem.activity} onChange={e=>{const v=e.target.value; editingItem?setEditingItem({...editingItem, activity:v}):setNewItem({...newItem, activity:v})}} />
               <LocationInput placeholder="地點" value={editingItem?editingItem.location:newItem.location} onChange={v=>editingItem?setEditingItem({...editingItem, location:v}):setNewItem({...newItem, location:v})} />
               <textarea className={`w-full border p-2 rounded h-20 outline-none focus:ring-2 focus:ring-sky-500 ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-200 placeholder-slate-400'}`} placeholder="備註 (支援網址與換行)" value={editingItem?editingItem.notes:newItem.notes} onChange={e=>{const v=e.target.value; editingItem?setEditingItem({...editingItem, notes:v}):setNewItem({...newItem, notes:v})}} />
             </>
           ) : (
             <>
               <div className="grid grid-cols-5 gap-2">{MOODS.map(m=><button key={m.k} onClick={()=>editingItem?setEditingItem({...editingItem, mood:m.k}):setNewMem({...newMem, mood:m.k})} className={`flex flex-col items-center p-1 rounded transition-colors ${(editingItem?editingItem.mood:newMem.mood)===m.k?(isDark?'bg-indigo-900/50 border-indigo-700 border':'bg-indigo-100 border-indigo-300 border'):''}`}><span className="text-xl">{m.i}</span><span className={`text-[10px] ${isDark?'text-slate-300':''}`}>{m.l}</span></button>)}</div>
               <div className="flex gap-2 items-center"><span className={`text-xs ${isDark?'text-slate-300':''}`}>關聯:</span><select className={`border p-2 rounded flex-1 text-sm outline-none focus:ring-2 focus:ring-sky-500 ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-800'}`} value={editingItem?editingItem.linkedId:newMem.linkedId} onChange={e=>{const v=e.target.value; editingItem?setEditingItem({...editingItem, linkedId:v}):setNewMem({...newMem, linkedId:v})}}><option value="">-- 無 --</option>{dailyItems.map(i=><option key={i.id} value={i.id}>{i.time} {i.activity}</option>)}</select></div>
               <textarea className={`w-full border p-2 rounded h-32 outline-none focus:ring-2 focus:ring-sky-500 ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-slate-200 placeholder-slate-400'}`} placeholder="回憶..." value={editingItem?editingItem.text:newMem.text} onChange={e=>{const v=e.target.value; editingItem?setEditingItem({...editingItem, text:v}):setNewMem({...newMem, text:v})}} />
             </>
           )}
           <div className={`flex justify-between items-center border p-2 rounded ${isDark ? 'border-slate-600' : 'border-slate-200'}`}><span className={`text-xs ${isDark?'text-slate-300':''}`}>圖片</span><button onClick={()=>fileRef.current.click()} className="text-sky-500 font-bold hover:text-sky-400" disabled={isProcessing}><Icons.Plus/></button><input type="file" multiple hidden ref={fileRef} onChange={e=>handleImg(e, editingItem?safeAtt(editingItem):(activeTab==='plan'?newItem.attachments:newMem.attachments), n=>{editingItem?setEditingItem({...editingItem, attachments:n}):(activeTab==='plan'?setNewItem({...newItem, attachments:n}):setNewMem({...newMem, attachments:n}))})} /></div>
           
           {isProcessing && <div className="text-xs text-sky-500 flex items-center gap-1"><Icons.Loader size={12}/> 正在處理圖片...</div>}
           
           <div className="grid grid-cols-4 gap-2">{(editingItem?safeAtt(editingItem):(activeTab==='plan'?newItem.attachments:newMem.attachments)).map((a,i)=><div key={i} className={`relative h-16 ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}><img src={a} className="w-full h-full object-cover cursor-pointer hover:opacity-80" onClick={(e)=>{e.stopPropagation(); setGallery({images:safeAtt(editingItem?editingItem:(activeTab==='plan'?newItem:newMem)), index:i})}}/>
             <button onClick={()=>{const curr=editingItem?safeAtt(editingItem):(activeTab==='plan'?newItem.attachments:newMem.attachments); const n=[...curr]; n.splice(i,1); editingItem?setEditingItem({...editingItem, attachments:n}):(activeTab==='plan'?setNewItem({...newItem, attachments:n}):setNewMem({...newMem, attachments:n}))}} className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5"><Icons.X size={10}/></button></div>)}</div>
           <div className="flex gap-2">
             {editingItem && <button onClick={()=>setDeleteModal({isOpen:true, id:editingItem.id, type:isItineraryEdit?'itinerary':'memories'})} className={`flex-1 py-2 rounded transition-colors ${isDark ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}>刪除</button>}
             <button onClick={()=>{ if(editingItem) handleItemAction(editingItem.activity?'itinerary':'memories', 'update', editingItem, editingItem.id); else { if(activeTab==='plan') handleItemAction('itinerary', 'add', {day, ...newItem, completed:false}); else { const n={...newMem, day, time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}; handleItemAction('memories', 'add', n); setEditOpen(false); setNewMem({text:'',mood:'happy',attachments:[], linkedId: ''}); } } }} className="flex-1 bg-sky-600 hover:bg-sky-500 text-white py-2 rounded font-bold transition-colors" disabled={isProcessing}>{isProcessing ? '處理中...' : '儲存'}</button>
           </div>
        </div>
      </Modal>

      {/* 修改處：解除固定高度，改為 flex flex-col 與自動彈性高度，防止被文字擠壓而破版 */}
      <header className={`relative text-white p-4 pt-10 shadow-md z-20 print:hidden transition-colors duration-300 flex flex-col ${trip.coverImage ? 'min-h-[11rem]' : (isDark ? 'bg-slate-800 min-h-[11rem]' : 'bg-sky-600 min-h-[11rem]')}`}>
         {trip.coverImage && <><img src={trip.coverImage} className="absolute inset-0 w-full h-full object-cover"/><div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/80"></div></>}
         
         <div className="relative z-10 flex-1 flex flex-col justify-between">
           {/* 頂部：返回鍵、標題、控制按鈕 */}
           <div className="flex items-start gap-2">
             <button onClick={onBack} className="p-1 mt-0.5 hover:bg-white/20 rounded-full shrink-0 transition-colors"><Icons.Plane className="transform rotate-180"/></button>
             
             {/* 標題區 */}
             <div className="flex-1 min-w-0 pr-1">
                <h1 className={`font-bold ${trip.name.length > 6 ? 'text-lg whitespace-normal break-words leading-snug' : 'text-xl truncate'}`}>
                  {trip.name}
                </h1>
                <p className="text-[10px] opacity-80 mt-1">{trip.startDate} ~ {trip.endDate}</p>
             </div>
             
             {/* 右上角控制區：縮小圖示並縮減間距 */}
             <div className="flex items-center shrink-0 gap-0.5 mt-0.5">
               <button onClick={toggleTheme} className="p-1.5 hover:bg-white/20 rounded-full transition-colors" title="切換深色/淺色模式">
                 {isDark ? <Icons.Sun size={18}/> : <Icons.Moon size={18}/>}
               </button>
               <button onClick={() => window.print()} className="p-1.5 hover:bg-white/20 rounded-full transition-colors" title="列印行程 / 匯出 PDF"><Icons.Printer size={18}/></button>
               <button onClick={()=>{setSettingsOpen(true)}} className="p-1.5 hover:bg-white/20 rounded-full transition-colors"><Icons.Settings size={18}/></button>
             </div>
           </div>
           
           {/* 底部：日期按鈕列與狀態標籤 */}
           <div className="flex justify-between items-end mt-4">
             <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mt-auto">
               {Array.from({length: totalDays}).map((_, i) => (<button key={i} onClick={()=>setDay(i+1)} className={`flex-shrink-0 w-12 h-14 rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all ${day === i+1 ? (isDark ? 'bg-slate-700 text-sky-400 shadow-lg border border-slate-600' : 'bg-white text-sky-600 scale-105 shadow') : 'bg-white/20 text-white'}`}><span className="text-xs opacity-70">Day</span><span className="text-lg font-bold">{i+1}</span></button>))}
             </div>
             
             <div className="pb-2 text-[9px] opacity-80 flex items-center gap-1 bg-black/30 px-2 py-1 rounded-full backdrop-blur-sm shrink-0 whitespace-nowrap ml-2 mb-1">
                {mode==='cloud' && isOnline ? <span className="flex items-center gap-1"><Icons.Cloud size={10}/> 雲端</span> : <span className="flex items-center gap-1"><Icons.Database size={10}/> 本地</span>}
             </div>
           </div>
         </div>
      </header>

      <main className="pb-24 px-4 pt-4 print:hidden flex-1 overflow-y-auto">
        {activeTab === 'plan' ? (
          <div className="space-y-1">
            <div className="flex justify-between items-center mb-4"><h2 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}><Icons.Calendar/> <span>Day {day}</span><span className={`text-xs px-2 rounded-full ${isDark ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-slate-100 text-slate-500'}`}>{getDisplayD()}</span></h2>
            <div className="flex gap-2">
              {dailyItems.length > 0 && <button onClick={()=>setDeleteModal({isOpen:true, type:'batch_day'})} className={`border p-2 rounded-full shadow-sm transition-colors ${isDark ? 'bg-slate-800 border-red-900/50 text-red-400 hover:bg-slate-700' : 'bg-white border-red-100 text-red-500'}`}><Icons.Trash/></button>}
              <button onClick={()=>setImportOpen(true)} className={`border p-2 rounded-full transition-colors ${isDark ? 'bg-slate-800 border-sky-900/50 text-sky-400 hover:bg-slate-700' : 'bg-white border-sky-100 text-sky-600'}`}><Icons.FileText/></button>
              <button onClick={()=>{if(!isOnline){alert("離線模式無法新增行程");return;} setNewItem({time:'',activity:'',location:'',type:'fun',notes:'',attachments:[]}); setEditOpen(true)}} className={`p-2 rounded-full shadow-md transition-colors ${!isOnline ? 'bg-slate-500 cursor-not-allowed text-white' : 'bg-sky-600 hover:bg-sky-500 text-white'}`}><Icons.Plus/></button>
            </div>
            </div>
            
            <div className="relative">
               {dailyItems.length === 0 && <div className={`text-center py-10 text-sm ${isDark ? 'text-slate-500' : 'text-slate-300'}`}>點擊 + 新增第一個行程</div>}
               {dailyItems.map((item, idx) => {
                  const style = getTypeStyle(item.type, isDark);
                  const isLast = idx === dailyItems.length - 1;

                  return (
                    <div key={item.id} className="flex relative">
                      <div className="w-14 flex-shrink-0 flex flex-col items-end pr-3 pt-5 relative">
                        <span className={`text-xs font-bold font-mono ${style.text}`}>{item.time}</span>
                      </div>
                      <div className="relative flex flex-col items-center w-6 flex-shrink-0">
                        <div className={`w-0.5 flex-1 ${style.line} ${isLast ? 'bg-gradient-to-b from-current to-transparent max-h-full' : ''}`} style={{ minHeight: '60px' }}></div>
                        <div className={`absolute top-5 w-3 h-3 rounded-full border-2 ${isDark ? 'border-slate-900' : 'border-white'} shadow-sm z-10 ${style.dot}`}></div>
                      </div>
                      <div className="flex-1 pb-4 pl-2 min-w-0">
                        <SwipeableRow onDeleteRequest={()=>setDeleteModal({isOpen:true, id:item.id, type:'itinerary'})} onEdit={()=>setEditingItem(item)}>
                           <div className={`p-3 rounded-xl border relative shadow-sm transition-all active:scale-[0.98] ${style.bg} ${style.border} ${item.completed ? 'opacity-60 grayscale' : ''}`}>
                             <div className="flex justify-between items-start">
                               <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1 mb-1">
                                    <h3 className={`font-bold text-base truncate ${item.completed ? 'line-through text-slate-500' : (isDark ? 'text-slate-200' : 'text-slate-800')}`}>{item.activity}</h3>
                                  </div>
                                  <div className={`flex items-center gap-2 text-xs opacity-70 mb-1 ${isDark ? 'text-slate-300' : ''}`}>
                                     <span className="flex items-center gap-0.5">{typeIcon(item.type)} {item.type.toUpperCase()}</span>
                                     {item.location && <span className="flex items-center gap-0.5 truncate"><Icons.MapPin size={10}/> {item.location}</span>}
                                  </div>
                                  {(item.notes || safeAtt(item).length>0) && <div className={`mt-2 p-2 rounded text-sm whitespace-pre-wrap border ${isDark ? 'bg-slate-900/50 text-slate-300 border-white/5' : 'bg-white/60 text-slate-600 border-black/5'}`}>{renderTextWithLinks(item.notes, isDark)}{safeAtt(item).length>0 && <div className="flex gap-1 mt-1">{safeAtt(item).map((a,i)=><img key={i} src={a} className="w-8 h-8 rounded object-cover cursor-pointer hover:opacity-80" onClick={(e)=>{e.stopPropagation(); setGallery({images:safeAtt(item), index:i})}}/>)}</div>}</div>}
                               </div>
                               <div className="flex flex-col gap-3 ml-2">
                                 <button onClick={(e)=>{e.stopPropagation(); handleItemAction('itinerary', 'update', {completed:!item.completed}, item.id)}} className={`${item.completed?'text-emerald-500':(isDark?'text-slate-600 hover:text-emerald-400':'text-slate-300 hover:text-emerald-500')}`}><Icons.Check size={18}/></button>
                                 <div className="flex flex-col gap-1">
                                   <button onClick={(e)=>{e.stopPropagation(); handleMove(idx, -1)}} className={`${isDark?'text-slate-600 hover:text-sky-400':'text-slate-300 hover:text-sky-500'}`}><Icons.ArrowUp size={14}/></button>
                                   <button onClick={(e)=>{e.stopPropagation(); handleMove(idx, 1)}} className={`${isDark?'text-slate-600 hover:text-sky-400':'text-slate-300 hover:text-sky-500'}`}><Icons.ArrowDown size={14}/></button>
                                 </div>
                               </div>
                             </div>
                           </div>
                        </SwipeableRow>
                      </div>
                    </div>
                  );
               })}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <button onClick={()=>{if(!isOnline){alert("離線模式無法新增回憶");return;} setNewMem({text:'', mood:'happy', attachments:[], linkedId:''}); setEditOpen(true);}} className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors ${!isOnline ? (isDark ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed') : (isDark ? 'bg-indigo-900/40 text-indigo-400 hover:bg-indigo-900/60' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200')}`}><Icons.Camera/> 新增回憶</button>
            {dailyMemories.map(m=>{
               const linked = dailyItems.find(i=>i.id===m.linkedId);
               const moodData = MOODS.find(x=>x.k===m.mood) || MOODS[0];
               return (
                 <SwipeableRow key={m.id} onDeleteRequest={()=>setDeleteModal({isOpen:true, id:m.id, type:'memories'})} onEdit={()=>setEditingItem(m)} className="mb-4">
                    <div className={`p-3 relative shadow-sm rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                      <div className={`absolute top-2 right-2 ${isDark ? 'text-slate-500' : 'text-slate-300'}`}><Icons.Settings/></div>
                      {safeAtt(m).length>0 && <div className="flex gap-1 mb-2">{safeAtt(m).map((a,i)=><img key={i} src={a} className={`h-20 w-full object-cover rounded cursor-pointer hover:opacity-80 ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`} onClick={e=>{e.stopPropagation();setGallery({images:safeAtt(m), index:i})}}/>)}</div>}
                      {linked && <div className={`text-xs inline-block px-1 rounded mb-1 border ${isDark ? 'bg-sky-900/30 text-sky-400 border-sky-900/50' : 'bg-sky-50 text-sky-600 border-sky-100'}`}><Icons.MapPin/> 於 {linked.activity}</div>}
                      <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{m.text}</p>
                      <div className={`mt-2 pt-2 border-t flex justify-between text-xs ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-100 text-slate-400'}`}><span>{m.time}</span><span title={moodData.l}>{moodData.i}</span></div>
                    </div>
                 </SwipeableRow>
               );
            })}
          </div>
        )}
      </main>

      <nav className={`fixed bottom-0 left-0 right-0 border-t px-6 py-3 flex justify-around items-center z-30 max-w-md mx-auto print:hidden transition-colors duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
         <button onClick={()=>setActiveTab('plan')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab==='plan'?(isDark?'text-sky-400':'text-sky-600'):(isDark?'text-slate-500 hover:text-slate-300':'text-slate-300 hover:text-slate-500')}`}><Icons.Calendar/><span className="text-[10px] font-bold">行程</span></button>
         <button onClick={()=>setActiveTab('record')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab==='record'?(isDark?'text-indigo-400':'text-indigo-600'):(isDark?'text-slate-500 hover:text-slate-300':'text-slate-300 hover:text-slate-500')}`}><Icons.Camera/><span className="text-[10px] font-bold">回憶</span></button>
      </nav>

      {/* --- 隱藏的列印排版區塊 (PDF 匯出用) --- */}
      <div className="hidden print:block w-full bg-white text-black font-sans p-8 print:m-0 print:p-0">
        <div className="text-center mb-8 border-b-4 border-slate-800 pb-4">
          <h1 className="text-4xl font-bold mb-2">{trip.name} - 行程總覽</h1>
          <p className="text-lg text-slate-600">{trip.startDate} ~ {trip.endDate} ({totalDays} 天)</p>
        </div>

        {Array.from({length: totalDays}).map((_, i) => {
          const currentDay = i + 1;
          const dayItems = items.filter(item => item.day === currentDay).sort((a, b) => a.time.localeCompare(b.time));
          
          if (dayItems.length === 0) return null;

          return (
            <div key={i} className="mb-10" style={{ pageBreakInside: 'avoid' }}>
              <h2 className="text-2xl font-bold border-b-2 border-slate-300 mb-4 pb-2 flex items-center gap-2 text-slate-800">
                 Day {currentDay} <span className="text-base font-normal text-slate-500">({getDisplayDate(trip.startDate, currentDay)})</span>
              </h2>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800">
                    <th className="py-3 px-4 border border-slate-300 w-24 text-center">時間</th>
                    <th className="py-3 px-4 border border-slate-300 w-1/3">活動名稱</th>
                    <th className="py-3 px-4 border border-slate-300 w-1/4">地點</th>
                    <th className="py-3 px-4 border border-slate-300">備註</th>
                  </tr>
                </thead>
                <tbody>
                  {dayItems.map(item => (
                    <tr key={item.id} className="border-b border-slate-200">
                      <td className="py-3 px-4 border border-slate-300 font-mono text-center text-slate-700">{item.time}</td>
                      <td className="py-3 px-4 border border-slate-300 font-bold text-slate-800">
                          <span className="mr-2">{TYPE_ICONS[item.type] || '📍'}</span>
                          {item.activity}
                      </td>
                      <td className="py-3 px-4 border border-slate-300 text-slate-700">{item.location}</td>
                      <td className="py-3 px-4 border border-slate-300 text-sm text-slate-600 whitespace-pre-wrap">{item.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })}
      </div>
    </>
  );
}

// === AppContent ===
function AppContent() {
  const [trips, setTrips] = useState([]);
  const [activeTripId, setActiveTripId] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState('loading');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    document.title = "我的旅程";
    const setFavicon = () => {
      const oldLinks = document.querySelectorAll("link[rel*='icon'], link[rel='manifest']");
      oldLinks.forEach(link => link.remove());
      const svgIcon = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 width=%22512%22 height=%22512%22><rect width=%2224%22 height=%2224%22 fill=%22%230ea5e9%22 rx=%220%22/><path fill=%22white%22 d=%22M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z%22/></svg>`;
      const linkIcon = document.createElement('link');
      linkIcon.rel = 'icon'; linkIcon.type = 'image/svg+xml'; linkIcon.href = svgIcon;
      document.head.appendChild(linkIcon);
      const linkApple = document.createElement('link');
      linkApple.rel = 'apple-touch-icon'; linkApple.href = svgIcon;
      document.head.appendChild(linkApple);
    };
    setFavicon();
    
    // 初始化讀取深色模式設定
    const savedTheme = localStorage.getItem('tm_theme');
    if (savedTheme === 'dark') setIsDarkMode(true);

    Service.init().then(m => { setMode(m); setLoaded(true); });
  }, []);

  useEffect(() => {
    if (loaded) {
      const unsub = Service.subscribe(null, null, (data) => setTrips(data || []));
      return () => unsub && unsub();
    }
  }, [loaded, mode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('tm_theme', newMode ? 'dark' : 'light');
      // 動態更新 body 背景以防出現白邊
      document.body.style.backgroundColor = newMode ? '#0f172a' : '#f8fafc';
      return newMode;
    });
  };

  // 確保初始載入時 body 背景正確
  useEffect(() => {
    document.body.style.backgroundColor = isDarkMode ? '#0f172a' : '#f8fafc';
  }, [isDarkMode]);

  const activeTrip = trips.find(t => t.id === activeTripId);
  const addTrip = async (t) => { const res = await Service.op(null, null, 'add', t); if(res) setTrips(res); };
  const deleteTrip = async (id) => { const res = await Service.op(null, null, 'delete', null, id); if(res) setTrips(res); };
  const updateTrip = async (data) => { const res = await Service.op(null, null, 'update', data, activeTrip.id); if(res) setTrips(res); };

  if (!loaded) return <div className="min-h-screen flex items-center justify-center text-slate-400 bg-slate-900">Loading...</div>;

  return (
    <ThemeContext.Provider value={isDarkMode}>
      {/* 最外層容器加入深色模式判斷，並確保列印時不受影響 */}
      <div className={`min-h-screen font-sans max-w-md mx-auto shadow-2xl overflow-x-hidden border-x relative transition-colors duration-300 print:max-w-none print:w-full print:overflow-visible print:shadow-none print:border-none print:bg-white print:p-0 print:m-0 ${isDarkMode ? 'bg-slate-900 text-slate-100 border-slate-800' : 'bg-slate-50 text-slate-800 border-slate-200'}`}>
        <button onClick={()=>{if(confirm('重置所有資料?')){localStorage.clear(); window.location.reload();}}} className="fixed bottom-1 left-1 z-50 p-2 text-slate-300 hover:text-red-500 opacity-50 hidden print:hidden"><Icons.Refresh size={12}/></button>

        {activeTrip ? (
          <TripDetail trip={activeTrip} mode={mode} onUpdate={(d) => updateTrip(d)} onBack={() => setActiveTripId(null)} toggleTheme={toggleTheme} />
        ) : (
          <div className="print:hidden h-full">
            <TripList trips={trips} onAdd={addTrip} onDelete={deleteTrip} onSelect={setActiveTripId} mode={mode} toggleTheme={toggleTheme} />
          </div>
        )}
      </div>
    </ThemeContext.Provider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}