import { useEffect, useState } from 'react';
import { apiClient, extractErrorMessage } from './api';
import { useOutletEvents } from './useOutletEvents';
import { PurchaseRecord } from '../types';

export function usePurchaseRecords(outlet: string) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{ outlet: string; rows: PurchaseRecord[]; error: string }>({ outlet: '', rows: [], error: '' });
  useOutletEvents(outlet, /^\d+$/.test(outlet), () => setRevision(value => value + 1), undefined, 'suppliers');
  useEffect(() => {
    if (!/^\d+$/.test(outlet)) return;
    const abort = new AbortController();
    apiClient.get<any[]>(`/inventory/purchases/?outlet_id=${encodeURIComponent(outlet)}`, { signal: abort.signal })
      .then(rows => {
        if (abort.signal.aborted) return;
        setState({ outlet, error: '', rows: rows.map(row => ({
          id: row.id, invoiceNumber: row.invoice_number, supplierName: row.supplier_name,
          supplierPhone: row.supplier_phone, purchaseDate: row.purchase_date,
          subtotal: Number(row.subtotal), discountAmount: Number(row.discount_amount),
          totalAmount: Number(row.total_amount), paidAmount: Number(row.paid_amount), dueAmount: Number(row.due_amount),
          paymentStatus: row.payment_status, paymentMethod: row.payment_method, notes: row.notes,
          documentName: row.document_name, documentUrl: row.document, receivedBy: row.received_by_name || '', outletId: outlet,
          items: (row.items || []).map((item: any) => ({ itemId: String(item.item), itemName: item.item_name,
            category: item.category, quantity: Number(item.quantity), unit: item.unit, unitCost: Number(item.unit_cost),
            discount: Number(item.discount), totalCost: Number(item.total_cost), batchNo: item.batch_no, expiryDate: item.expiry_date })),
        })) });
      }).catch(error => { if (!abort.signal.aborted) setState({ outlet, rows: [], error: extractErrorMessage(error) }); });
    return () => abort.abort();
  }, [outlet, revision]);
  return { purchases: state.outlet === outlet ? state.rows : [], error: state.outlet === outlet ? state.error : '', loading: state.outlet !== outlet,
    retry: () => setRevision(value => value + 1) };
}
