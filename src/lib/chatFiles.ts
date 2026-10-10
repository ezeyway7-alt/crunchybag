// Keep a pending attachment across reloads without putting binary data in sessionStorage.
function database(): Promise<IDBDatabase> {
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open('crunchy-chat-files',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('pending');
    request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
  });
}
export async function pendingFile(key:string, value?:File|null):Promise<File|undefined> {
  const db=await database();
  try{return await new Promise((resolve,reject)=>{
    const tx=db.transaction('pending',value===undefined?'readonly':'readwrite'),store=tx.objectStore('pending');
    const request=value===undefined?store.get(key):value===null?store.delete(key):store.put(value,key);
    tx.oncomplete=()=>resolve(value===undefined?request.result:undefined);
    tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
  });}finally{db.close();}
}
