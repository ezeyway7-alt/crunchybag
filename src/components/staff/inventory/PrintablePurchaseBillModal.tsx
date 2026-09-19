import React from "react";
import { X, Printer, CheckCircle, FileText, Building2, Calendar, Phone, Hash } from "lucide-react";
import { PurchaseRecord } from "../../../types";
import { formatNPR } from "../../../lib/utils";

interface PrintablePurchaseBillModalProps {
  purchase: PurchaseRecord;
  mode: "BILL" | "SUPPLIER_STATEMENT";
  onClose: () => void;
  restaurantName?: string;
  restaurantPan?: string;
  restaurantAddress?: string;
}

export const PrintablePurchaseBillModal: React.FC<PrintablePurchaseBillModalProps> = ({
  purchase,
  mode,
  onClose,
  restaurantName = "Crispy Bites Restaurant & Kitchen",
  restaurantPan = "609823412",
  restaurantAddress = "Dillibazar - 33, Kathmandu, Nepal",
}) => {
  const handlePrint = () => {
    window.print();
  };

  const grossTotal =
    purchase.subtotal ??
    purchase.items.reduce((sum, it) => sum + (it.unitCost * it.quantity), 0);
  const discountTotal =
    purchase.discountAmount ??
    purchase.items.reduce((sum, it) => sum + (it.discount || 0), 0);
  const netPayable = purchase.totalAmount;
  const paidAmount = purchase.paidAmount ?? (purchase.paymentStatus === "PAID" ? netPayable : 0);
  const dueCredit = purchase.dueAmount ?? Math.max(0, netPayable - paidAmount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white text-zinc-900 shadow-2xl border border-zinc-300 my-6 font-sans">
        {/* Modal Controls (Hidden in Print) */}
        <div className="print:hidden flex items-center justify-between px-4 py-2.5 bg-zinc-900 text-white border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-xs uppercase tracking-wider">
              {mode === "BILL" ? "Purchase Bill Voucher (Print View)" : "Supplier Goods Statement"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Document</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PRINTABLE AREA */}
        <div className="p-6 text-xs text-zinc-800 bg-white" id="printable-purchase-bill">
          {/* Header */}
          <div className="text-center pb-3 border-b-2 border-zinc-800">
            <h1 className="text-base font-black uppercase tracking-wider text-zinc-950">
              {restaurantName}
            </h1>
            <p className="text-[11px] text-zinc-600">{restaurantAddress}</p>
            <p className="text-[11px] font-mono text-zinc-700">PAN / VAT No: {restaurantPan}</p>
            <div className="mt-2 inline-block px-3 py-0.5 bg-zinc-100 text-zinc-900 border border-zinc-300 font-bold uppercase text-[10px] tracking-widest">
              {mode === "BILL" ? "GOODS INWARD / PURCHASE VOUCHER" : "SUPPLIER INVENTORY SUMMARY"}
            </div>
          </div>

          {/* Invoice & Supplier Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 py-3 border-b border-zinc-200 text-[11px]">
            <div className="space-y-1">
              <p>
                <span className="text-zinc-500">Supplier: </span>
                <strong className="text-zinc-900 font-bold">{purchase.supplierName}</strong>
              </p>
              {purchase.supplierPhone && (
                <p>
                  <span className="text-zinc-500">Contact: </span>
                  <span className="font-mono text-zinc-700">{purchase.supplierPhone}</span>
                </p>
              )}
              {purchase.supplierPan && (
                <p>
                  <span className="text-zinc-500">Supplier PAN: </span>
                  <span className="font-mono text-zinc-700">{purchase.supplierPan}</span>
                </p>
              )}
            </div>

            <div className="space-y-1 text-right">
              <p>
                <span className="text-zinc-500">Invoice Ref: </span>
                <strong className="font-mono text-zinc-950 font-bold">{purchase.invoiceNumber}</strong>
              </p>
              <p>
                <span className="text-zinc-500">Date: </span>
                <span className="font-mono text-zinc-800">{purchase.purchaseDate}</span>
              </p>
              <p>
                <span className="text-zinc-500">Payment: </span>
                <span className="font-bold text-zinc-900">{purchase.paymentMethod}</span> (
                <span className={dueCredit > 0 ? "text-amber-600 font-bold" : "text-emerald-700 font-bold"}>
                  {purchase.paymentStatus}
                </span>
                )
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="my-3 overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="border-b-2 border-zinc-800 bg-zinc-100 text-zinc-800 font-bold uppercase text-[10px]">
                  <th className="py-1.5 px-2 w-8">#</th>
                  <th className="py-1.5 px-2">Item Description</th>
                  <th className="py-1.5 px-2 text-center">Batch / Exp</th>
                  <th className="py-1.5 px-2 text-right">Qty</th>
                  <th className="py-1.5 px-2 text-right">Rate (CP)</th>
                  <th className="py-1.5 px-2 text-right">Disc</th>
                  <th className="py-1.5 px-2 text-right">Net Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {purchase.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50">
                    <td className="py-1.5 px-2 font-mono text-zinc-500">{idx + 1}</td>
                    <td className="py-1.5 px-2 font-medium text-zinc-900">
                      {item.itemName}
                      {item.category && (
                        <span className="text-[9px] text-zinc-500 block">{item.category}</span>
                      )}
                    </td>
                    <td className="py-1.5 px-2 text-center font-mono text-[10px] text-zinc-600">
                      {item.batchNo || item.expiryDate ? (
                        <span>
                          {item.batchNo && <span className="font-bold">{item.batchNo} </span>}
                          {item.expiryDate && <span>(Exp: {item.expiryDate})</span>}
                        </span>
                      ) : (
                        <span className="text-zinc-400">-</span>
                      )}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono font-bold whitespace-nowrap">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono text-zinc-700">
                      {formatNPR(item.unitCost)}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono text-zinc-600">
                      {item.discount && item.discount > 0 ? formatNPR(item.discount) : "Rs. 0"}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono font-bold text-zinc-950">
                      {formatNPR(item.totalCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Summary */}
          <div className="pt-2 border-t-2 border-zinc-800 flex justify-between items-start text-xs">
            <div className="max-w-xs space-y-1 text-zinc-600 text-[11px]">
              {purchase.notes && (
                <p>
                  <span className="font-bold text-zinc-700">Remarks: </span>
                  <span>{purchase.notes}</span>
                </p>
              )}
              {purchase.documentName && (
                <p>
                  <span className="font-bold text-zinc-700">Attachment: </span>
                  <span className="font-mono text-zinc-600">{purchase.documentName}</span>
                </p>
              )}
              <p>
                <span className="font-bold text-zinc-700">Received By: </span>
                <span>{purchase.receivedBy || "Store Keeper"}</span>
              </p>
            </div>

            <div className="w-56 space-y-1 text-[11px]">
              <div className="flex justify-between text-zinc-600">
                <span>Gross Subtotal:</span>
                <span className="font-mono font-bold text-zinc-900">{formatNPR(grossTotal)}</span>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Total Discount:</span>
                  <span className="font-mono font-bold">-{formatNPR(discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-t border-zinc-300 font-bold text-xs text-zinc-950">
                <span>Net Payable:</span>
                <span className="font-mono font-black">{formatNPR(netPayable)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Paid Amount:</span>
                <span className="font-mono">{formatNPR(paidAmount)}</span>
              </div>
              {dueCredit > 0 && (
                <div className="flex justify-between text-amber-600 font-bold pt-0.5 border-t border-dashed border-zinc-300">
                  <span>Balance Due (Credit):</span>
                  <span className="font-mono font-black">{formatNPR(dueCredit)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-10 mt-6 border-t border-zinc-200 text-center text-[10px] text-zinc-500">
            <div>
              <div className="border-t border-zinc-400 w-36 mx-auto pt-1">Supplier Representative</div>
            </div>
            <div>
              <div className="border-t border-zinc-400 w-36 mx-auto pt-1">Store / Receiving Staff</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
