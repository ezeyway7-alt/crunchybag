import React, {useRef, useState} from 'react';
import {apiClient, extractErrorMessage} from '../../lib/api';
import {customerPath} from '../../lib/customerApi';

type Review = {rating:number;comment:string};

export const CompletedOrderReview: React.FC<{
  credentials:{token:string} | {order_number:string;customer_phone:string};
  savedReview?:Review | null;
}> = ({credentials, savedReview}) => {
  const [review,setReview]=useState<Review | null>(null);
  const [rating,setRating]=useState('');
  const [comment,setComment]=useState('');
  const [error,setError]=useState('');
  const [saving,setSaving]=useState(false);
  const lock=useRef(false);
  const saved=review || savedReview;
  const submit=async(event:React.FormEvent)=>{
    event.preventDefault();
    if(lock.current)return;
    lock.current=true;setSaving(true);setError('');
    try {
      const result=await apiClient.post<Review>(customerPath('order-review/'),{
        ...credentials,rating:Number(rating),comment:comment.trim(),
      },{skipAuth:true,credentials:'omit'});
      setReview(result);
    } catch(error) {setError(extractErrorMessage(error));}
    finally {lock.current=false;setSaving(false);}
  };
  return <section className="bg-zinc-900 border border-zinc-800 p-4 space-y-3" aria-label="Order review">
    <h2 className="font-bold text-lg">How was your order?</h2>
    {saved ? <div role="status" className="text-sm text-emerald-400">Thank you! Your review has been saved ({saved.rating}/5).</div> : <>
      <p className="text-sm text-zinc-400">Your order is completed. Please share your experience.</p>
      <form onSubmit={submit} className="space-y-3">
        <fieldset disabled={saving} className="space-y-3">
          <label className="block space-y-1 text-sm">Rating
            <select required value={rating} onChange={event=>setRating(event.target.value)} className="block w-full bg-zinc-950 border border-zinc-700 p-2">
              <option value="">Choose a rating</option>
              {[5,4,3,2,1].map(value=><option key={value} value={value}>{value} {value===1?'star':'stars'}</option>)}
            </select>
          </label>
          <label className="block space-y-1 text-sm">Review (optional)
            <textarea value={comment} onChange={event=>setComment(event.target.value)} maxLength={2000} rows={3} className="block w-full bg-zinc-950 border border-zinc-700 p-2"/>
          </label>
          {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
          <button type="submit" disabled={!rating || saving} className="w-full bg-amber-500 px-3 py-2 text-sm font-bold text-black disabled:opacity-50">{saving?'Saving review...':'Submit review'}</button>
        </fieldset>
      </form>
    </>}
  </section>;
};
