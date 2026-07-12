import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import { readFileSync } from "fs";
import { join } from "path";

type InvoiceOrder = {
  orderNumber: string;
  createdAt: Date;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  fulfillmentMode: string;
  deliveryAddress: string | null;
  pickupWarehouse: string | null;
  subtotal: number;
  discountAmount: number;
  discountReason: string | null;
  totalPrice: number;
  items: { pallet: { sku: string; title: string }; price: number; quantity: number }[];
};

type InvoiceSettings = {
  companyName: string;
  headquartersAddress: string;
  supportEmail: string;
  supportPhone: string;
  paymentInstructions: string;
};

const INK = rgb(0.09, 0.09, 0.1);
const GRAY = rgb(0.45, 0.45, 0.46);
const YELLOW = rgb(0.96, 0.71, 0);
const LINE = rgb(0.85, 0.84, 0.8);

function money(n: number) {
  return "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export async function generateInvoicePdf(order: InvoiceOrder, settings: InvoiceSettings, paid: boolean = false): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]); // US Letter
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const marginX = 50;
  let y = 740;

  // Draw the PAID watermark first, underneath everything else, so it can never
  // collide with or obscure any text regardless of how long names/addresses are.
  if (paid) {
    page.drawText("PAID", {
      x: 100, y: 330, size: 150, font: bold,
      color: rgb(0.19, 0.55, 0.28), rotate: degrees(-35), opacity: 0.12,
    });
  }

  const text = (str: string, x: number, yy: number, opts: { size?: number; f?: typeof font; color?: any } = {}) => {
    page.drawText(str, { x, y: yy, size: opts.size ?? 10, font: opts.f ?? font, color: opts.color ?? INK });
  };
  const textRight = (str: string, rightEdge: number, yy: number, opts: { size?: number; f?: typeof font; color?: any } = {}) => {
    const size = opts.size ?? 10;
    const f = opts.f ?? font;
    const width = f.widthOfTextAtSize(str, size);
    page.drawText(str, { x: rightEdge - width, y: yy, size, font: f, color: opts.color ?? INK });
  };
  const line = (yy: number) => {
    page.drawLine({ start: { x: marginX, y: yy }, end: { x: 562, y: yy }, thickness: 0.75, color: LINE });
  };

  // Header — logo icon on the left, text shifted over to make room for it
  let textX = marginX;
  try {
    const logoBytes = readFileSync(join(process.cwd(), "public", "logo-icon.png"));
    const logoImage = await doc.embedPng(logoBytes);
    const logoHeight = 42;
    const logoWidth = logoHeight * (logoImage.width / logoImage.height);
    page.drawImage(logoImage, { x: marginX, y: y - 34, width: logoWidth, height: logoHeight });
    textX = marginX + logoWidth + 12;
  } catch (err) {
    console.error("Invoice logo not found or failed to embed (falling back to text-only header):", err);
  }

  text(settings.companyName.toUpperCase(), textX, y, { size: 18, f: bold });
  text("INVOICE", 462, y, { size: 18, f: bold, color: YELLOW });
  y -= 18;
  text(settings.headquartersAddress, textX, y, { size: 9, color: GRAY });
  text(`Invoice #: ${order.orderNumber}`, 462, y, { size: 9, color: GRAY });
  y -= 12;
  text(`${settings.supportEmail}  ·  ${settings.supportPhone}`, textX, y, { size: 9, color: GRAY });
  text(`Date: ${order.createdAt.toLocaleDateString()}`, 462, y, { size: 9, color: GRAY });
  y -= 28;
  line(y);
  y -= 24;

  // Bill To / Fulfillment
  text("BILL TO", marginX, y, { size: 9, f: bold, color: GRAY });
  text("FULFILLMENT", 320, y, { size: 9, f: bold, color: GRAY });
  y -= 14;
  text(order.customerName, marginX, y, { size: 11, f: bold });
  text(
    order.fulfillmentMode === "delivery" ? "Freight Delivery" : "Dock Pickup",
    320, y, { size: 11, f: bold }
  );
  y -= 14;
  text(order.customerEmail, marginX, y, { size: 9.5, color: GRAY });
  text(
    order.fulfillmentMode === "delivery" ? (order.deliveryAddress || "") : (order.pickupWarehouse || ""),
    320, y, { size: 9.5, color: GRAY }
  );
  y -= 13;
  if (order.customerPhone) text(order.customerPhone, marginX, y, { size: 9.5, color: GRAY });
  y -= 26;
  line(y);
  y -= 20;

  // Item table header
  text("PALLET", marginX, y, { size: 9, f: bold, color: GRAY });
  text("QTY", 380, y, { size: 9, f: bold, color: GRAY });
  textRight("UNIT PRICE", 480, y, { size: 9, f: bold, color: GRAY });
  textRight("TOTAL", 562, y, { size: 9, f: bold, color: GRAY });
  y -= 8;
  line(y);
  y -= 18;

  for (const item of order.items) {
    text(`${item.pallet.title}`, marginX, y, { size: 10, f: bold });
    text(`LOAD #${item.pallet.sku}`, marginX, y - 12, { size: 8.5, color: GRAY });
    text(String(item.quantity), 385, y, { size: 10 });
    textRight(money(item.price), 480, y, { size: 10 });
    textRight(money(item.price * item.quantity), 562, y, { size: 10 });
    y -= 32;
  }

  line(y);
  y -= 22;

  // Totals — labels stay short and fixed-position; amounts are right-aligned so
  // long text (like a discount reason) can never collide with the numbers.
  text("Subtotal", 420, y, { size: 10, color: GRAY });
  textRight(money(order.subtotal), 562, y, { size: 10 });
  y -= 16;

  if (order.discountAmount > 0) {
    text("Discount", 420, y, { size: 10, color: GRAY });
    textRight(`-${money(order.discountAmount)}`, 562, y, { size: 10 });
    y -= 12;
    if (order.discountReason) {
      text(order.discountReason, 420, y, { size: 8, color: GRAY });
      y -= 16;
    } else {
      y -= 4;
    }
  }

  text("Amount Due", 420, y, { size: 12, f: bold });
  textRight(money(order.totalPrice), 562, y, { size: 12, f: bold });
  y -= 34;

  // Payment box — shows payment instructions if unpaid, a thank-you note if already paid
  page.drawRectangle({
    x: marginX, y: y - 54, width: 512, height: 54,
    color: paid ? rgb(0.9, 0.96, 0.91) : rgb(0.965, 0.95, 0.89),
  });
  if (paid) {
    text("PAYMENT RECEIVED", marginX + 14, y - 16, { size: 9, f: bold, color: rgb(0.19, 0.55, 0.28) });
    text("Thanks for your business — no further action needed on this invoice.", marginX + 14, y - 32, { size: 9 });
  } else {
    text("HOW TO PAY", marginX + 14, y - 16, { size: 9, f: bold, color: GRAY });
    const paymentLines = wrapText(settings.paymentInstructions, 78);
    paymentLines.slice(0, 3).forEach((l, i) => text(l, marginX + 14, y - 30 - i * 12, { size: 9 }));
  }
  y -= 74;

  text(
    paid
      ? `Payment received. Thank you! Invoice #${order.orderNumber}.`
      : `This order is marked UNPAID until payment is confirmed. Invoice #${order.orderNumber}.`,
    marginX, y, { size: 8.5, color: GRAY }
  );
  y -= 24;
  text("Thank you for your business — Dock9 Liquidation Co.", marginX, y, { size: 9, color: GRAY });

  return doc.save();
}

function wrapText(str: string, maxChars: number): string[] {
  const words = str.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    if ((current + " " + w).trim().length > maxChars) {
      lines.push(current.trim());
      current = w;
    } else {
      current += " " + w;
    }
  }
  if (current.trim()) lines.push(current.trim());
  return lines;
}
