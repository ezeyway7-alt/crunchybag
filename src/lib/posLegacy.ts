import { Order } from '../types';
import { backendOrder } from './posApi';
export function posStatistics(orders: Order[]) {
  const stats = { orderCount: orders.length, grossSubtotal: 0, totalDiscounts: 0, netFinal: 0, totalPaid: 0, totalUnpaid: 0, cashTotal: 0, cashCount: 0, qrFonepayTotal: 0, qrFonepayCount: 0, esewaTotal: 0, esewaCount: 0, cardTotal: 0, cardCount: 0, creditTotal: 0, creditCount: 0, refundVoidTotal: 0, refundVoidCount: 0 };
  for (const row of orders) {
    const o = backendOrder(row); if (!o) continue;
    stats.refundVoidTotal += Number(o.refunded_amount);
    if (Number(o.refunded_amount)) stats.refundVoidCount++;
    if (o.status === 'CANCELLED') continue;
    stats.grossSubtotal += Number(o.subtotal); stats.totalDiscounts += Number(o.discount_amount);
    stats.netFinal += Number(o.total_payable); stats.totalPaid += Number(o.paid_amount); stats.totalUnpaid += Number(o.due_amount);
    stats.creditTotal += Number(o.credit_amount); if (Number(o.credit_amount)) stats.creditCount++;
    for (const p of o.payments.filter(p => p.status === 'SUCCESS')) {
      const method = { CASH: 'cash', FONEPAY: 'qrFonepay', ESEWA: 'esewa', CARD: 'card' }[p.method];
      if (method) { stats[`${method}Total`] += Number(p.amount); stats[`${method}Count`]++; }
    }
  }
  return stats;
}
