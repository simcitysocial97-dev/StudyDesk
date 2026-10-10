/* IndexedDB-first persistence with a small-browser fallback to LocalStorage. */
(function(root){
  'use strict';
  const DB_NAME='ugc-net-jrf-tracker';
  const DB_VERSION=1;
  const STORE='records';
  let dbPromise=null;
  function openDB(){
    if(!('indexedDB' in root))return Promise.reject(new Error('IndexedDB is not available.'));
    if(dbPromise)return dbPromise;
    dbPromise=new Promise((resolve,reject)=>{
      const req=root.indexedDB.open(DB_NAME,DB_VERSION);
      req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'key'});};
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error||new Error('Could not open the local database.'));
      req.onblocked=()=>reject(new Error('Database upgrade is blocked by another open tab. Close other tracker tabs and retry.'));
    });
    return dbPromise;
  }
  async function load(){
    try{
      const db=await openDB();
      const value=await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly');const req=tx.objectStore(STORE).get('appState');req.onsuccess=()=>resolve(req.result?.value||null);req.onerror=()=>reject(req.error);});
      if(value)return {value,backend:'IndexedDB'};
    }catch(error){
      try{const raw=root.localStorage?.getItem('ugc-net-jrf-tracker-state');if(raw)return {value:JSON.parse(raw),backend:'LocalStorage fallback',warning:error.message};}catch(_){/* no fallback available */}
      return {value:null,backend:'memory',warning:error.message};
    }
    return {value:null,backend:'IndexedDB'};
  }
  async function save(value){
    try{
      const db=await openDB();
      await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put({key:'appState',value});tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||new Error('Database write failed.'));tx.onabort=()=>reject(tx.error||new Error('Database write was cancelled.'));});
      try{root.localStorage?.setItem('ugc-net-jrf-tracker-state',JSON.stringify(value));}catch(_){/* IndexedDB remains the primary copy. */}
      return 'IndexedDB';
    }catch(error){
      try{root.localStorage?.setItem('ugc-net-jrf-tracker-state',JSON.stringify(value));return 'LocalStorage fallback';}catch(storageError){throw new Error(`Could not save locally: ${storageError.message||error.message}`);}
    }
  }
  async function clear(){
    try{const db=await openDB();await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete('appState');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}catch(_){/* continue to fallback */}
    try{root.localStorage?.removeItem('ugc-net-jrf-tracker-state');}catch(_){/* ignore */}
  }
  root.TrackDB={load,save,clear,DB_NAME,DB_VERSION};
})(typeof window!=='undefined'?window:globalThis);
