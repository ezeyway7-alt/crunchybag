import { Order } from '../types';
import { backendOrder } from './posApi';
export function posStatistics(orders: Order[] = []) {
  const safeOrders = Array.isArray(orders) ? orders : [];
  const stats = { orderCount: safeOrders.length, grossSubtotal: 0, totalDiscounts: 0, netFinal: 0, totalPaid: 0, totalUnpaid: 0, cashTotal: 0, cashCount: 0, qrFonepayTotal: 0, qrFonepayCount: 0, esewaTotal: 0, esewaCount: 0, cardTotal: 0, cardCount: 0, creditTotal: 0, creditCount: 0, refundVoidTotal: 0, refundVoidCount: 0 };
  for (const row of safeOrders) {
    const o = backendOrder(row); if (!o) continue;
    stats.refundVoidTotal += Number(o.refunded_amount || 0);
    if (Number(o.refunded_amount)) stats.refundVoidCount++;
    if (o.status === 'CANCELLED') continue;
    stats.grossSubtotal += Number(o.subtotal || 0); stats.totalDiscounts += Number(o.discount_amount || 0);
    stats.netFinal += Number(o.total_payable || 0); stats.totalPaid += Number(o.paid_amount || 0); stats.totalUnpaid += Number(o.due_amount || 0);
    stats.creditTotal += Number(o.credit_amount || 0); if (Number(o.credit_amount)) stats.creditCount++;
    for (const p of (o.payments || []).filter(p => p.status === 'SUCCESS')) {
      const method = { CASH: 'cash', FONEPAY: 'qrFonepay', ESEWA: 'esewa', CARD: 'card' }[p.method];
      if (method) { stats[`${method}Total`] += Number(p.amount || 0); stats[`${method}Count`]++; }
    }
  }
  return stats;
}
