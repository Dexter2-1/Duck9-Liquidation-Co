// Sends transactional email via Resend (https://resend.com). Requires RESEND_API_KEY
// and RESEND_FROM_EMAIL (a domain/address verified in your Resend account) in .env.
// If not configured, logs to the console instead of throwing — an email hiccup
// should never block an order from being saved.
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  attachments?: { filename: string; content: string }[] // content = base64
) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    console.log(`[email skipped — no RESEND_API_KEY/RESEND_FROM_EMAIL set] To: ${to} | Subject: ${subject}${attachments ? ` | Attachments: ${attachments.map((a) => a.filename).join(", ")}` : ""}`);
    return { sent: false, reason: "Email not configured" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html, ...(attachments ? { attachments } : {}) }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("Resend email failed:", errText);
      return { sent: false, reason: errText };
    }
    return { sent: true };
  } catch (err: any) {
    console.error("Resend email error:", err.message);
    return { sent: false, reason: err.message };
  }
}

export function orderNotificationEmail(order: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  totalPrice: number;
  fulfillmentMode: string;
  deliveryAddress: string | null;
  pickupWarehouse: string | null;
  items: { pallet: { sku: string; title: string }; price: number; quantity: number }[];
}) {
  const itemRows = order.items
    .map((i) => `<li>${i.quantity} × ${i.pallet.title} (LOAD #${i.pallet.sku}) — $${(i.price * i.quantity).toLocaleString()}</li>`)
    .join("");

  return `
    <h2>New order: ${order.orderNumber}</h2>
    <p><b>Customer:</b> ${order.customerName} — ${order.customerEmail}${order.customerPhone ? " — " + order.customerPhone : ""}</p>
    <p><b>Fulfillment:</b> ${order.fulfillmentMode === "delivery" ? `Freight delivery to ${order.deliveryAddress}` : `Dock pickup at ${order.pickupWarehouse}`}</p>
    <p><b>Total due:</b> $${order.totalPrice.toLocaleString()}</p>
    <p><b>Pallets:</b></p>
    <ul>${itemRows}</ul>
    <p>Payment is expected manually (Zelle, Venmo, Chime, Apple Pay, or Cash App — per your site's payment instructions). This order is marked <b>UNPAID</b> until you confirm payment and mark it Paid in the admin panel.</p>
    <p style="color:#888;font-size:12px;">The invoice PDF for this order is attached.</p>
  `;
}

export function customerInvoiceEmail(order: {
  orderNumber: string;
  customerName: string;
  totalPrice: number;
  discountAmount: number;
  fulfillmentMode: string;
  deliveryAddress: string | null;
  pickupWarehouse: string | null;
  items: { pallet: { sku: string; title: string }; price: number; quantity: number }[];
}, settings: { companyName: string; paymentInstructions: string; supportEmail: string; supportPhone: string }) {
  const itemRows = order.items
    .map(
      (i) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #eee;">${i.pallet.title}<br><span style="color:#888;font-size:12px;">LOAD #${i.pallet.sku}</span></td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">$${(i.price * i.quantity).toLocaleString()}</td></tr>`
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#17181A;">
      <h1 style="font-size:20px;margin-bottom:4px;">Thanks for your order, ${order.customerName.split(" ")[0]}!</h1>
      <p style="color:#555;font-size:14px;">Order <b>${order.orderNumber}</b> is reserved. Your invoice is attached as a PDF for your records — here's a quick summary:</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
        <thead><tr><th style="text-align:left;padding-bottom:8px;border-bottom:2px solid #17181A;">Pallet</th><th style="padding-bottom:8px;border-bottom:2px solid #17181A;">Qty</th><th style="text-align:right;padding-bottom:8px;border-bottom:2px solid #17181A;">Total</th></tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      ${order.discountAmount > 0 ? `<p style="font-size:13px;color:#166534;">Discount applied: -$${order.discountAmount.toLocaleString()}</p>` : ""}
      <p style="font-size:16px;font-weight:bold;">Amount due: $${order.totalPrice.toLocaleString()}</p>
      <p style="font-size:14px;"><b>Fulfillment:</b> ${order.fulfillmentMode === "delivery" ? `Freight delivery to ${order.deliveryAddress}` : `Dock pickup at ${order.pickupWarehouse}`}</p>
      <div style="background:#F6F3EC;border-radius:6px;padding:14px 16px;margin:20px 0;font-size:13.5px;">
        <b>How to pay:</b> ${settings.paymentInstructions}
      </div>
      <p style="font-size:13px;color:#888;">Questions? Reply to this email or reach us at ${settings.supportEmail} / ${settings.supportPhone}.</p>
      <p style="font-size:13px;color:#888;">— ${settings.companyName}</p>
    </div>
  `;
}
