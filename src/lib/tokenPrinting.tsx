import React from 'react';
import { Order } from '../types';

export function printTokenOnly(order: Order, outletName: string = 'Crunchy Bag') {
  const popup = window.open('', '_blank', 'width=380,height=520');
  if (!popup) {
    throw new Error('Allow popups to print this token slip.');
  }
  const tokenDisplay = order.kioskToken || order.orderNumber;
  const timeStr = new Date(order.createdAt || Date.now()).toLocaleString('en-GB', {
    timeZone: 'Asia/Kathmandu',
    dateStyle: 'short',
    timeStyle: 'short',
  });
  const fulfillment = order.fulfillmentType ? order.fulfillmentType.replace(/_/g, ' ') : 'ORDER';
  const table = order.tableNumber ? ` • Table ${order.tableNumber}` : '';
  const customer = order.customerName ? `${order.customerName}${order.customerPhone ? ` (${order.customerPhone})` : ''}` : '';

  popup.document.title = `Token ${tokenDisplay}`;
  popup.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Token ${tokenDisplay}</title>
  <style>
    @page { size: 80mm auto; margin: 3mm; }
    html, body {
      margin: 0; padding: 0;
      background: #fff; color: #111;
      font-family: ui-monospace, monospace;
      color-scheme: light;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .container {
      max-width: 74mm;
      margin: 0 auto;
      padding: 4mm 2mm;
      text-align: center;
      box-sizing: border-box;
    }
    .outlet {
      font-size: 14px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .subtitle {
      font-size: 9.5px;
      color: #555;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .rule {
      border-top: 1px dashed #444;
      margin: 8px 0;
    }
    .token-box {
      border: 2px dashed #111;
      border-radius: 4px;
      padding: 10px 4px;
      margin: 8px 0;
      background: #fafafa;
    }
    .token-label {
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 700;
      color: #555;
      letter-spacing: 1px;
    }
    .token-number {
      font-size: 46px;
      font-weight: 900;
      line-height: 1.1;
      margin: 4px 0;
      letter-spacing: 1px;
    }
    .order-ref {
      font-size: 10px;
      color: #555;
    }
    .meta-line {
      font-size: 11px;
      font-weight: 800;
      margin: 4px 0;
    }
    .detail-line {
      font-size: 10px;
      color: #333;
      margin: 2px 0;
    }
    .footer-msg {
      font-size: 9.5px;
      color: #555;
      margin-top: 8px;
      line-height: 1.35;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="outlet">${outletName}</div>
    <div class="subtitle">Order Token Slip</div>
    <div class="rule"></div>
    <div class="token-box">
      <div class="token-label">Token Number</div>
      <div class="token-number">${tokenDisplay}</div>
      <div class="order-ref">Order #${order.orderNumber}</div>
    </div>
    <div class="meta-line">${fulfillment}${table}</div>
    ${customer ? `<div class="detail-line">Guest: ${customer}</div>` : ''}
    <div class="detail-line">${timeStr}</div>
    <div class="rule"></div>
    <div class="footer-msg">Please wait for your number to be called or announced on screen.<br/>Thank you!</div>
  </div>
  <script>
    window.onload = function() {
      window.focus();
      window.print();
    };
  </script>
</body>
</html>`);
  popup.document.close();
}

export const TokenOnlySlip: React.FC<{ order: Order; outletName?: string }> = ({ order, outletName = 'Crunchy Bag' }) => {
  const tokenDisplay = order.kioskToken || order.orderNumber;
  const timeStr = new Date(order.createdAt || Date.now()).toLocaleString('en-GB', {
    timeZone: 'Asia/Kathmandu',
    dateStyle: 'short',
    timeStyle: 'short',
  });
  const fulfillment = order.fulfillmentType ? order.fulfillmentType.replace(/_/g, ' ') : 'ORDER';
  const table = order.tableNumber ? ` • Table ${order.tableNumber}` : '';
  const customer = order.customerName ? `${order.customerName}${order.customerPhone ? ` (${order.customerPhone})` : ''}` : '';

  return (
    <article
      aria-label="Order token slip"
      style={{
        width: '100%',
        maxWidth: '76mm',
        boxSizing: 'border-box',
        margin: '0 auto',
        padding: '3mm 2mm',
        background: '#fff',
        color: '#111',
        fontFamily: 'ui-monospace, monospace',
        textAlign: 'center',
        border: '1px solid #e4e4e7',
        borderRadius: 4,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {outletName}
      </div>
      <div style={{ fontSize: 9.5, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginTop: 1 }}>
        Order Token Slip
      </div>
      <div style={{ borderTop: '1px dashed #444', margin: '6px 0' }} />
      <div
        style={{
          border: '2px dashed #111',
          borderRadius: 4,
          padding: '8px 4px',
          margin: '6px 0',
          background: '#fafafa',
        }}
      >
        <div style={{ fontSize: 9.5, textTransform: 'uppercase', fontWeight: 700, color: '#555' }}>
          Token Number
        </div>
        <div
          data-testid="token-slip-number"
          style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.1, margin: '3px 0' }}
        >
          {tokenDisplay}
        </div>
        <div style={{ fontSize: 9.5, color: '#555' }}>Order #{order.orderNumber}</div>
      </div>
      <div style={{ fontSize: 10.5, fontWeight: 800, margin: '3px 0' }}>
        {fulfillment}
        {table}
      </div>
      {customer && <div style={{ fontSize: 9.5, color: '#333', margin: '2px 0' }}>Guest: {customer}</div>}
      <div style={{ fontSize: 9, color: '#555' }}>{timeStr}</div>
      <div style={{ borderTop: '1px dashed #444', margin: '6px 0' }} />
      <div style={{ fontSize: 9, color: '#555', lineHeight: 1.35 }}>
        Please wait for your number to be called or announced on screen.
        <br />
        Thank you!
      </div>
    </article>
  );
};
