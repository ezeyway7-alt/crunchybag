import React, {useEffect, useState} from 'react';
import {useAuth} from '../../context/AuthContext';
import {useApp} from '../../context/AppContext';
import {useCustomerAddresses, addressPoint, SavedAddress, DeliveryPoint} from '../../lib/customerAddresses';
import {DeliveryLocationModal} from './DeliveryLocationModal';
import {Input} from '../common/Input';
import {Button} from '../common/Button';

export function CustomerProfilePage() {
  const {authUser, logout} = useAuth();
  const {customerProfile, updateCustomerProfile, setCustomerActiveTab} = useApp();
  const saved = useCustomerAddresses();
  const [name, setName] = useState(''), [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const [editing, setEditing] = useState<SavedAddress | null | undefined>();
  const [label, setLabel] = useState('Home');
  const [address, setAddress] = useState('');
  const [point, setPoint] = useState<DeliveryPoint | undefined>();
  const [isDefault, setDefault] = useState(false), [mapOpen, setMapOpen] = useState(false);
  useEffect(() => {setName(customerProfile.name || '');setEmail(customerProfile.email || '');}, [customerProfile.name, customerProfile.email]);
  const startAddress = (row: SavedAddress | null) => {
    setEditing(row);setLabel(row?.label || 'Home');setAddress(row?.address || '');
    setPoint(row ? addressPoint(row) : undefined);setDefault(row?.is_default || false);setMessage('');
  };
  useEffect(() => {
    if (!authUser || authUser.is_active === false) {
      window.dispatchEvent(new Event('customer:login'));
      setCustomerActiveTab('menu');
    }
  }, [authUser]);

  if (!authUser || authUser.is_active === false) {
    return (
      <main className="max-w-md mx-auto p-6 my-10 bg-[#121214] border border-zinc-800 text-center space-y-4 shadow-xl text-zinc-100">
        <h1 className="text-lg font-bold text-white uppercase tracking-tight">Customer Profile</h1>
        <p className="text-xs text-zinc-400">Please sign in to manage your profile, saved delivery addresses, and past orders.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
          <Button variant="primary" onClick={() => window.dispatchEvent(new Event('customer:login'))} className="w-full sm:w-auto">
            Sign In / Sign Up
          </Button>
          <Button variant="outline" onClick={() => setCustomerActiveTab('menu')} className="w-full sm:w-auto">
            Browse Menu
          </Button>
        </div>
      </main>
    );
  }

  return <main className="max-w-3xl mx-auto px-4 py-6 space-y-7 text-zinc-100">
    <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setCustomerActiveTab('menu')}
          className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          ← Back to Menu
        </button>
        <h1 className="text-xl font-bold text-white">My Profile</h1>
      </div>
      <button onClick={()=>setCustomerActiveTab('orders')} className="text-xs font-bold text-amber-400 hover:underline">View My Orders →</button>
    </div>
    <form className="space-y-4" onSubmit={async e=>{e.preventDefault();setBusy(true);setMessage('');try{setMessage(await updateCustomerProfile({name: (name || '').trim(), email: (email || '').trim()}) ? 'Profile saved.' : 'Could not save profile. Check your details and try again.');}finally{setBusy(false);}}}>
      <div className="grid sm:grid-cols-2 gap-4"><Input label="Username" value={name} onChange={e=>setName(e.target.value)} minLength={3} maxLength={150} pattern="[a-zA-Z0-9_.@+\-]+" required />
        <Input label="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} maxLength={254} /></div>
      <Input label="Phone number" value={customerProfile.phone} readOnly />
      <Button type="submit" disabled={busy}>Save profile</Button>
    </form>
    {message && <p role="status" className="text-sm text-amber-400">{message}</p>}
    <section className="space-y-3 border-t border-zinc-800 pt-5">
      <div className="flex items-center justify-between"><h2 className="font-semibold">Delivery addresses</h2><button onClick={()=>startAddress(null)} className="text-sm text-amber-400">Add address</button></div>
      {saved.error && <p role="alert" className="text-sm text-rose-400">{saved.error}</p>}
      {!saved.addresses.length && <p className="text-sm text-zinc-400">No saved addresses yet.</p>}
      {saved.addresses.map(row=><article key={row.id} className="border border-zinc-800 p-4 space-y-2">
        <div className="flex items-center gap-2"><h3 className="text-sm font-semibold">{row.label}</h3>{row.is_default && <span className="text-xs text-amber-400">Default</span>}</div>
        <p className="text-sm text-zinc-300">{row.address}</p>{row.landmark && <p className="text-xs text-zinc-400">{row.landmark}</p>}
        <div className="flex gap-4 text-xs"><button onClick={()=>startAddress(row)}>Edit</button>
          {!row.is_default && <button disabled={busy} onClick={async()=>{setBusy(true);try{await saved.save({is_default:true},row.id);}catch{}finally{setBusy(false);}}}>Set default</button>}
          <button disabled={busy} onClick={async()=>{setBusy(true);try{await saved.remove(row.id);}catch{}finally{setBusy(false);}}} className="text-rose-400">Remove</button></div>
      </article>)}
      {editing !== undefined && <form className="p-4 border border-zinc-700 space-y-3" onSubmit={async e=>{
        e.preventDefault();setBusy(true);try{await saved.save({label:(label || '').trim(),address:(address || '').trim(),landmark:point?.landmark || '',latitude:point ? point.lat.toFixed(7):null,longitude:point?point.lng.toFixed(7):null,is_default:isDefault},editing?.id);setEditing(undefined);}catch{}finally{setBusy(false);}
      }}>
        <h3 className="text-sm font-semibold">{editing ? 'Edit address' : 'New address'}</h3>
        <Input label="Address label" value={label} onChange={e=>setLabel(e.target.value)} maxLength={60} required />
        <Input label="Address" value={address} onChange={e=>{setAddress(e.target.value);setPoint(undefined);}} maxLength={800} required />
        <button type="button" onClick={()=>setMapOpen(true)} className="text-sm text-amber-400">{point ? 'Edit map pin' : 'Choose on map'}</button>
        <label className="flex gap-2 text-sm"><input type="checkbox" checked={isDefault} onChange={e=>setDefault(e.target.checked)} />Default delivery address</label>
        <div className="flex gap-3"><Button type="submit" disabled={busy || !(address || '').trim() || !(label || '').trim()}>Save address</Button><Button type="button" variant="outline" onClick={()=>setEditing(undefined)}>Cancel</Button></div>
      </form>}
    </section>
    <button onClick={()=>{logout();setCustomerActiveTab('menu');}} className="text-sm text-zinc-400">Sign out</button>
    <DeliveryLocationModal isOpen={mapOpen} onClose={()=>setMapOpen(false)} currentAddress={address} currentLocation={point} onSaveAddress={(text, location)=>{setAddress(text);setPoint(location);}} />
  </main>;
}
