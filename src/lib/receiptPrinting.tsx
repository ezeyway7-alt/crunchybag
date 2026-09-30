import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {CompactOrderReceipt,ReceiptDocument} from '../components/common/CompactOrderReceipt';

export async function printReceiptDocument(receipt:ReceiptDocument,existingWindow?:Window) {
  const popup=existingWindow || window.open('','_blank','width=420,height=720');
  if(!popup)throw new Error('Allow popups to print this receipt.');
  const style=popup.document.createElement('style');
  style.textContent='@page{size:80mm auto;margin:2mm}html,body{margin:0;background:#fff;color:#111;color-scheme:light}body{padding:0}a{color:inherit;text-decoration:none}article{print-color-adjust:exact;-webkit-print-color-adjust:exact}img{image-rendering:pixelated}';
  popup.document.head.append(style);
  popup.document.title=`${receipt.kind} ${receipt.snapshot.order_number}`;
  // React escapes every saved field. Only the common receipt goes into the print window.
  popup.document.body.innerHTML=renderToStaticMarkup(<CompactOrderReceipt receipt={receipt}/>);
  try {
    await Promise.all(Array.from(popup.document.images).map(img=>img.decode()));
    if(popup.closed)return;
    popup.focus();popup.print();
  }catch(error){popup.close();throw new Error('Receipt QR failed to load. Please retry printing.');}
}
