import { jsPDF } from "jspdf";

export type ShippingLabelItem = {
  name?: string;
  variantLabel?: string;
  variantPublicId?: string;
  quantity: number;
  price: number;
  mrp?: number;
  subtotal: number;
  hsnCode?: string;
  seller?: string;
};

export type ShippingLabelOrder = {
  orderNumber: string;
  createdAt?: string;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  items: ShippingLabelItem[];
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  itemsTotal: number;
  taxAmount: number;
  deliveryCharge: number;
  grandTotal: number;
  user?: { name?: string; phone?: string };
};

export type ShippingLabelOptions = {
  sellerId?: string;
  brandName?: string;
  sellerName?: string;
};

const BLACK: [number, number, number] = [0, 0, 0];
const GREY: [number, number, number] = [110, 110, 110];
const RULE: [number, number, number] = [190, 190, 190];

const LABEL_W = 102;
const LABEL_H = 178;
const M = 7;
const INNER_W = LABEL_W - M * 2;
const GAP = 4;
const PAD = 4;

const COL_DESC_X = M + PAD;
const COL_DESC_W = 54;
const COL_QTY_X = M + 68;
const COL_AMT_RIGHT = LABEL_W - M - PAD;

const LINE = 3.8;
const SECTION = 5;

function fmtInr(n: number) {
  const num = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n || 0);
  return `Rs. ${num}`;
}

function paymentBadge(method: string, status: string) {
  if (status === "paid") return "PREPAID";
  if (method === "cod") return "COD";
  return status.toUpperCase();
}

function wrapText(doc: jsPDF, text: string, maxWidth: number) {
  return doc.splitTextToSize(text, maxWidth) as string[];
}

function filterItems(order: ShippingLabelOrder, sellerId?: string) {
  if (!sellerId) return order.items || [];
  return (order.items || []).filter((line) => String(line.seller) === String(sellerId));
}

function computeTotals(lines: ShippingLabelItem[]) {
  const itemsTotal = lines.reduce((s, l) => s + (l.subtotal || l.price * l.quantity), 0);
  return { itemsTotal };
}

function setFill(doc: jsPDF, rgb: [number, number, number]) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
}

function setStroke(doc: jsPDF, rgb: [number, number, number]) {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
}

function setText(doc: jsPDF, rgb: [number, number, number]) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}

function rule(doc: jsPDF, y: number, weight = 0.3) {
  setStroke(doc, BLACK);
  doc.setLineWidth(weight);
  doc.line(M, y, LABEL_W - M, y);
}

function lightRule(doc: jsPDF, y: number) {
  setStroke(doc, RULE);
  doc.setLineWidth(0.2);
  doc.line(M, y, LABEL_W - M, y);
}

function sectionLabel(doc: jsPDF, title: string, y: number) {
  setText(doc, GREY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.text(title.toUpperCase(), M, y);
  return y + SECTION;
}

function drawBarcode(doc: jsPDF, code: string, centerX: number, y: number, totalW: number) {
  const barH = 8;
  const seed = code.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  let x = centerX - totalW / 2;
  const endX = centerX + totalW / 2;
  let i = 0;
  while (x < endX && i < 48) {
    const w = ((seed + i * 7) % 3) * 0.28 + 0.2;
    if ((seed + i) % 2 === 0) {
      setFill(doc, BLACK);
      doc.rect(x, y, w, barH, "F");
    }
    x += w + 0.28;
    i++;
  }
  return barH;
}

/** Draw label + value on one shared baseline (mm). */
function labeledValue(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  valueFontSize: number,
  valueBold = true
) {
  setText(doc, GREY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.text(label, x, y);

  const labelW = doc.getTextWidth(label);
  setText(doc, BLACK);
  doc.setFont("times", valueBold ? "bold" : "normal");
  doc.setFontSize(valueFontSize);
  doc.text(value, x + labelW + 2.5, y);
}

export function downloadShippingLabel(order: ShippingLabelOrder, options: ShippingLabelOptions = {}) {
  const brand = options.brandName || "Paridhan Emporium";
  const lines = filterItems(order, options.sellerId);
  if (!lines.length) {
    throw new Error("No products in this order for your catalog");
  }

  const totals = computeTotals(lines);
  const addr = order.shippingAddress || {};
  const doc = new jsPDF({ unit: "mm", format: [LABEL_W, LABEL_H], orientation: "portrait" });

  setStroke(doc, BLACK);
  doc.setLineWidth(0.45);
  doc.rect(4, 4, LABEL_W - 8, LABEL_H - 8, "S");
  doc.setLineWidth(0.15);
  doc.rect(5.5, 5.5, LABEL_W - 11, LABEL_H - 11, "S");

  let y = M + 1;

  // Header
  setText(doc, BLACK);
  doc.setFont("times", "bold");
  doc.setFontSize(12);
  doc.text(brand, M, y + 4);

  setText(doc, GREY);
  doc.setFont("times", "italic");
  doc.setFontSize(7);
  doc.text("Curated sarees & ethnic wear", M, y + 9);

  const badge = paymentBadge(order.paymentMethod, order.paymentStatus);
  const badgeW = 19;
  const badgeH = 6.5;
  const badgeX = LABEL_W - M - badgeW;
  setStroke(doc, BLACK);
  doc.setLineWidth(0.3);
  doc.rect(badgeX, y + 0.5, badgeW, badgeH, "S");
  setText(doc, BLACK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.text(badge, badgeX + badgeW / 2, y + 4.6, { align: "center" });

  y += 13;
  rule(doc, y);
  y += GAP;

  // Order reference
  y = sectionLabel(doc, "Order reference", y);
  setText(doc, GREY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.text("ORDER ID", M, y);
  doc.text("DATE", LABEL_W - M, y, { align: "right" });
  y += LINE;
  setText(doc, BLACK);
  doc.setFont("times", "bold");
  doc.setFontSize(9);
  doc.text(order.orderNumber, M, y);
  if (order.createdAt) {
    doc.setFont("times", "normal");
    doc.setFontSize(8.5);
    doc.text(
      new Date(order.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      LABEL_W - M,
      y,
      { align: "right" }
    );
  }
  y += GAP + 1;
  rule(doc, y);
  y += GAP;

  // Deliver to
  y = sectionLabel(doc, "Deliver to", y);

  const shipName = String(addr.fullName || order.user?.name || "Customer");
  const streetLines = wrapText(doc, String(addr.street || ""), INNER_W - PAD * 2);
  const cityPart = [addr.city, addr.state].filter(Boolean).join(", ");
  const pin = addr.postalCode ? String(addr.postalCode) : "";
  const phone = addr.phone || order.user?.phone;

  const pinRowH = pin ? 7 : 0;
  const phoneRowH = phone ? LINE + 1 : 0;
  const boxH =
    PAD * 2 +
    LINE +
    1 +
    streetLines.filter((l) => l.trim()).length * LINE +
    (cityPart ? LINE + 1 : 0) +
    pinRowH +
    phoneRowH;

  setStroke(doc, BLACK);
  doc.setLineWidth(0.25);
  doc.rect(M, y, INNER_W, boxH, "S");

  const bx = M + PAD;
  let by = y + PAD + LINE;

  setText(doc, BLACK);
  doc.setFont("times", "bold");
  doc.setFontSize(10);
  doc.text(shipName, bx, by);
  by += LINE + 1;

  doc.setFont("times", "normal");
  doc.setFontSize(8.5);
  for (const line of streetLines) {
    if (!line.trim()) continue;
    doc.text(line, bx, by);
    by += LINE;
  }
  if (cityPart) {
    doc.text(cityPart, bx, by);
    by += LINE + 1;
  }
  if (pin) {
    by += 2;
    labeledValue(doc, "PIN CODE", pin, bx, by, 11, true);
    by += pinRowH - 2;
  }
  if (phone) {
    by += 1;
    labeledValue(doc, "MOBILE", `+91 ${String(phone).replace(/\D/g, "").slice(-10)}`, bx, by, 8.5, false);
  }

  y += boxH + GAP;
  rule(doc, y);
  y += GAP;

  // Package contents — plain column headers (no fill)
  y = sectionLabel(doc, "Package contents", y);

  setText(doc, GREY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.text("ITEM DESCRIPTION", COL_DESC_X, y);
  doc.text("QTY", COL_QTY_X, y, { align: "center" });
  doc.text("AMOUNT", COL_AMT_RIGHT, y, { align: "right" });
  y += 2;
  lightRule(doc, y);
  y += GAP + 2;

  const maxY = LABEL_H - 40;

  for (const item of lines) {
    if (y > maxY) break;

    const variant = item.variantLabel || item.variantPublicId;
    const title = variant ? `${item.name} — ${variant}` : String(item.name || "Saree");
    const titleLines = wrapText(doc, title, COL_DESC_W);
    const meta = [`Unit ${fmtInr(item.price)}`, item.hsnCode ? `HSN ${item.hsnCode}` : null]
      .filter(Boolean)
      .join("  |  ");

    const rowStart = y;
    const titleStart = rowStart + 1;

    setText(doc, BLACK);
    doc.setFont("times", "normal");
    doc.setFontSize(8);
    let ty = titleStart;
    for (const tl of titleLines) {
      doc.text(tl, COL_DESC_X, ty);
      ty += LINE;
    }

    setText(doc, GREY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.text(meta, COL_DESC_X, ty);
    ty += LINE - 0.5;

    const qtyAmtY = titleStart + (LINE - 1) * 0.5;
    setText(doc, BLACK);
    doc.setFont("times", "bold");
    doc.setFontSize(8);
    doc.text(String(item.quantity), COL_QTY_X, qtyAmtY, { align: "center" });
    doc.text(fmtInr(item.subtotal || item.price * item.quantity), COL_AMT_RIGHT, qtyAmtY, {
      align: "right",
    });

    y = Math.max(ty, rowStart + titleLines.length * LINE + LINE) + 2;
    lightRule(doc, y - 1);
  }

  y += 1;
  rule(doc, y);
  y += GAP;

  // Totals — plain, no filled bar
  const totalLabel = options.sellerId ? "Seller total" : "Order total";
  const totalVal = options.sellerId ? totals.itemsTotal : order.grandTotal;

  if (!options.sellerId) {
    setText(doc, GREY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text(`Items  ${fmtInr(totals.itemsTotal)}`, M, y);
    doc.text(`Tax  ${fmtInr(order.taxAmount)}`, M + 34, y);
    doc.text(`Shipping  ${fmtInr(order.deliveryCharge)}`, M + 62, y);
    y += LINE + 2;
  }

  lightRule(doc, y);
  y += 3;
  setText(doc, BLACK);
  doc.setFont("times", "bold");
  doc.setFontSize(9);
  doc.text(totalLabel.toUpperCase(), M, y);
  doc.setFontSize(10);
  doc.text(fmtInr(totalVal), COL_AMT_RIGHT, y, { align: "right" });
  y += 2;
  lightRule(doc, y);
  y += GAP;

  // Footer
  setText(doc, GREY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.text(`Payment: ${order.paymentStatus}  |  ${order.paymentMethod.toUpperCase()}`, M, y);
  if (options.sellerName) {
    doc.text(`Seller: ${options.sellerName}`, LABEL_W - M, y, { align: "right" });
  }
  y += GAP + 2;

  const centerX = LABEL_W / 2;
  const barH = drawBarcode(doc, order.orderNumber, centerX, y, INNER_W - 20);
  y += barH + 3;

  setText(doc, BLACK);
  doc.setFont("times", "bold");
  doc.setFontSize(8.5);
  doc.text(order.orderNumber, centerX, y, { align: "center" });
  y += LINE;

  setText(doc, GREY);
  doc.setFont("times", "italic");
  doc.setFontSize(6);
  doc.text("Handle with care  |  Premium ethnic textiles", centerX, y, { align: "center" });

  doc.save(`shipping-label-${order.orderNumber}.pdf`);
}
