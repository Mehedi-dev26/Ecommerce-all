import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  shipping_address: string;
  city: string;
  district: string | null;
  subtotal: number;
  shipping_cost: number;
  total: number;
  status: string;
  payment_method: string;
  notes: string | null;
  created_at: string;
  pathao_consignment_id: string | null;
  pathao_order_status: string | null;
  delivery_fee: number | null;
}

interface InvoicePrintProps {
  order: Order;
  items: OrderItem[];
  open: boolean;
  onClose: () => void;
  type: "shop" | "pathao";
}

const InvoicePrint = ({ order, items, open, onClose, type }: InvoicePrintProps) => {
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = invoiceRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${order.order_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a1a; padding: 20px; font-size: 13px; }
            .invoice { max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #d97706; padding-bottom: 16px; margin-bottom: 20px; }
            .logo-section h1 { font-size: 22px; color: #d97706; font-weight: 800; }
            .logo-section p { font-size: 11px; color: #666; margin-top: 2px; }
            .invoice-meta { text-align: right; }
            .invoice-meta h2 { font-size: 24px; color: #333; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; }
            .invoice-meta p { font-size: 11px; color: #666; margin-top: 3px; }
            .info-row { display: flex; gap: 24px; margin-bottom: 20px; }
            .info-box { flex: 1; background: #fafaf8; border: 1px solid #e5e5e0; border-radius: 8px; padding: 14px; }
            .info-box h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 8px; font-weight: 700; }
            .info-box p { font-size: 12px; line-height: 1.6; }
            .info-box .name { font-weight: 700; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            thead th { background: #d97706; color: white; text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
            thead th:last-child, thead th:nth-child(3), thead th:nth-child(2) { text-align: right; }
            tbody td { padding: 10px 12px; border-bottom: 1px solid #eee; }
            tbody td:last-child, tbody td:nth-child(3), tbody td:nth-child(2) { text-align: right; }
            tbody tr:nth-child(even) { background: #fafaf8; }
            .totals { display: flex; justify-content: flex-end; }
            .totals-box { width: 280px; }
            .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 12px; }
            .totals-row.total { border-top: 2px solid #d97706; padding-top: 10px; margin-top: 4px; font-size: 16px; font-weight: 800; color: #d97706; }
            .footer { margin-top: 30px; text-align: center; padding-top: 16px; border-top: 1px solid #eee; }
            .footer p { font-size: 11px; color: #999; }
            .pathao-badge { display: inline-block; background: #e8f5e9; color: #2e7d32; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-top: 6px; }
            @media print { body { padding: 0; } .invoice { max-width: 100%; } }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
  };

  const orderDate = new Date(order.created_at).toLocaleDateString("bn-BD", {
    day: "numeric", month: "long", year: "numeric"
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{type === "pathao" ? "পাঠাও কুরিয়ার ইনভয়েস" : "অর্ডার ইনভয়েস"}</span>
            <div className="flex gap-2">
              <Button size="sm" onClick={handlePrint} className="gap-2">
                <Printer className="h-4 w-4" /> প্রিন্ট করুন
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div ref={invoiceRef} className="bg-white p-6 text-foreground">
          <div className="invoice">
            {/* Header */}
            <div className="header">
              <div className="logo-section">
                <h1>🛍️ Surzo Shop</h1>
                <p>Surzo Shop — Electronics, Appliances & Bicycles</p>
                <p>ঢাকা, বাংলাদেশ</p>
              </div>
              <div className="invoice-meta">
                <h2>{type === "pathao" ? "Shipping Label" : "Invoice"}</h2>
                <p><strong>অর্ডার:</strong> #{order.order_number}</p>
                <p><strong>তারিখ:</strong> {orderDate}</p>
                {order.pathao_consignment_id && type === "pathao" && (
                  <p className="pathao-badge">পাঠাও ID: {order.pathao_consignment_id}</p>
                )}
              </div>
            </div>

            {/* Customer + Shipping Info */}
            <div className="info-row">
              <div className="info-box">
                <h3>প্রেরক (From)</h3>
                <p className="name">সাপাহার ম্যাঙ্গো</p>
                <p>আশুরন্দ বাজার, সাপাহার, নওগাঁ</p>
                <p>রাজশাহী বিভাগ</p>
              </div>
              <div className="info-box">
                <h3>প্রাপক (To)</h3>
                <p className="name">{order.customer_name}</p>
                <p>{order.customer_phone}</p>
                {order.customer_email && <p>{order.customer_email}</p>}
                <p>{order.shipping_address}</p>
                <p>{order.city}{order.district ? `, ${order.district}` : ""}</p>
              </div>
            </div>

            {/* Items Table */}
            <table>
              <thead>
                <tr>
                  <th>পণ্য</th>
                  <th>পরিমাণ</th>
                  <th>একক দাম</th>
                  <th>মোট</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.product_name}</td>
                    <td>{item.quantity}</td>
                    <td>৳{Number(item.price).toLocaleString()}</td>
                    <td>৳{(item.price * item.quantity).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="totals">
              <div className="totals-box">
                <div className="totals-row">
                  <span>সাবটোটাল</span>
                  <span>৳{Number(order.subtotal).toLocaleString()}</span>
                </div>
                <div className="totals-row">
                  <span>ডেলিভারি চার্জ</span>
                  <span>৳{Number(order.shipping_cost).toLocaleString()}</span>
                </div>
                {order.delivery_fee != null && Number(order.delivery_fee) > 0 && (
                  <div className="totals-row">
                    <span>পাঠাও ফি</span>
                    <span>৳{Number(order.delivery_fee).toLocaleString()}</span>
                  </div>
                )}
                <div className="totals-row">
                  <span>পেমেন্ট</span>
                  <span>{order.payment_method === "cod" ? "ক্যাশ অন ডেলিভারি" : order.payment_method}</span>
                </div>
                <div className="totals-row total">
                  <span>সর্বমোট</span>
                  <span>৳{Number(order.total).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="footer">
              {type === "pathao" && order.pathao_consignment_id && (
                <p style={{ marginBottom: 8, fontSize: 12 }}>
                  <strong>পাঠাও কনসাইনমেন্ট:</strong> {order.pathao_consignment_id}
                  {order.pathao_order_status && <> | <strong>স্ট্যাটাস:</strong> {order.pathao_order_status}</>}
                </p>
              )}
              {order.notes && (
                <p style={{ marginBottom: 8, fontSize: 12, fontStyle: "italic" }}>
                  <strong>নোট:</strong> {order.notes}
                </p>
              )}
              <p>ধন্যবাদ আপনার অর্ডারের জন্য! — Surzo Shop 🛍️</p>
              <p style={{ marginTop: 4 }}>www.surzoshop.com</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoicePrint;
