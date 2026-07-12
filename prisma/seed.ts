import { PrismaClient, Role, Condition, PalletStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.newsletterSubscriber.deleteMany();
  await prisma.descriptionHistory.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.pallet.deleteMany();
  await prisma.descriptionTemplate.deleteMany();
  await prisma.user.deleteMany();
  await prisma.siteSettings.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.create({
    data: { name: "Alex Rivera", email: "admin@dock9.example", password: passwordHash, role: Role.ADMIN },
  });
  await prisma.user.create({
    data: { name: "Jordan Lee", email: "manager@dock9.example", password: passwordHash, role: Role.MANAGER },
  });
  await prisma.user.create({
    data: { name: "Sam Torres", email: "warehouse@dock9.example", password: passwordHash, role: Role.WAREHOUSE },
  });

  await prisma.descriptionTemplate.createMany({
    data: [
      { name: "Electronics Template", body: "This pallet contains a mixed lot of electronics and small appliances. Items are customer returns and may include units that are like-new, lightly used, or non-functional. Testing is recommended before resale. Retail value is estimated from manifested MSRP." },
      { name: "Furniture Template", body: "This pallet contains furniture and home goods pulled from retail overstock. Expect assembled and flat-pack items; boxes may show shelf wear. Ideal for resale to local buyers due to freight size." },
      { name: "General Merchandise Template", body: "This is a mixed general merchandise pallet sourced from customer returns and shelf pulls. Category mix varies by load. Item count and condition reflect the attached manifest." },
    ],
  });

  await prisma.siteSettings.create({
    data: {
      id: "main",
      whatsappNumber: "+17045550139",
      announcementBarText: "Call or text us to order — bulk/truckload buyers ask about wire or bank deposit terms.",
    },
  });

  const pallets = [
    { sku: "DK-2291", title: "Mixed General Merchandise — Home & Tools", category: "General", weightLbs: 980, cost: 310, price: 650, floorPrice: 400, retailValue: 4800, itemsRange: "95–130 units", location: "Charlotte, NC", condition: Condition.AS_IS, binLocation: "Aisle 4, Rack 3", supplier: "Vendor A", imageUrl: "https://placehold.co/600x450/2B2E33/F4B400?text=General+Pallet" },
    { sku: "DK-2306", title: "Electronics & Small Appliances Mixed", category: "Electronics", weightLbs: 720, cost: 610, price: 1150, floorPrice: 700, retailValue: 6200, itemsRange: "40–60 units", location: "Charlotte, NC", condition: Condition.MINOR_SCRATCHES, binLocation: "Aisle 1, Rack 2", supplier: "Vendor B", imageUrl: "https://placehold.co/600x450/2B2E33/F4B400?text=Electronics+Pallet" },
    { sku: "DK-2318", title: "Apparel & Footwear Overstock", category: "Apparel", weightLbs: 610, cost: 340, price: 650, compareAtPrice: 780, floorPrice: 450, retailValue: 5500, itemsRange: "200–260 units", location: "Reno, NV", condition: Condition.LIKE_NEW, binLocation: "Aisle 6, Rack 1", supplier: "Vendor A", imageUrl: "https://placehold.co/600x450/2B2E33/F4B400?text=Apparel+Pallet" },
    { sku: "DK-2325", title: "Toys & Seasonal Mixed Pallet", category: "Toys & Seasonal", weightLbs: 850, cost: 250, price: 560, floorPrice: 350, retailValue: 3900, itemsRange: "110–150 units", location: "Charlotte, NC", condition: Condition.AS_IS, binLocation: "Aisle 3, Rack 2", supplier: "Vendor A", imageUrl: "https://placehold.co/600x450/2B2E33/F4B400?text=Toys+Pallet" },
    { sku: "DK-2331", title: "Kitchen & Housewares Shelf Pulls", category: "Housewares", weightLbs: 900, cost: 300, price: 690, floorPrice: 420, retailValue: 4300, itemsRange: "80–100 units", location: "Reno, NV", condition: Condition.MINOR_SCRATCHES, binLocation: "Aisle 5, Rack 1", supplier: "Vendor B", imageUrl: "https://placehold.co/600x450/2B2E33/F4B400?text=Housewares+Pallet" },
    { sku: "DK-2340", title: "Power Tools & Hardware Mixed", category: "Tools", weightLbs: 1050, cost: 720, price: 1340, floorPrice: 850, retailValue: 7100, itemsRange: "35–50 units", location: "Dallas, TX", condition: Condition.HEAVY_WEAR, binLocation: "Aisle 2, Rack 4", supplier: "Vendor C", imageUrl: "https://placehold.co/600x450/2B2E33/F4B400?text=Tools+Pallet", status: PalletStatus.HIDDEN },
    { sku: "DK-2347", title: "Health, Beauty & Personal Care", category: "Health & Beauty", weightLbs: 540, cost: 210, price: 480, floorPrice: 300, retailValue: 3600, itemsRange: "300–400 units", location: "Dallas, TX", condition: Condition.LIKE_NEW, binLocation: "Aisle 7, Rack 3", supplier: "Vendor B", imageUrl: "https://placehold.co/600x450/2B2E33/F4B400?text=Health+Beauty+Pallet" },
    { sku: "DK-2352", title: "Furniture & Home Decor Mixed", category: "Furniture", weightLbs: 1200, cost: 480, price: 890, floorPrice: 550, retailValue: 5200, itemsRange: "15–25 units", location: "Reno, NV", condition: Condition.AS_IS, binLocation: "Aisle 8, Rack 1", supplier: "Vendor A", imageUrl: "https://placehold.co/600x450/2B2E33/F4B400?text=Furniture+Pallet", quantityAvailable: 2 },
  ];

  for (const p of pallets) {
    await prisma.pallet.create({ data: p as any });
  }

  const order = await prisma.order.create({
    data: {
      orderNumber: "D9-100234",
      customerName: "Chris Nguyen",
      customerEmail: "chris@example.com",
      customerPhone: "555-201-4477",
      fulfillmentMode: "delivery",
      deliveryAddress: "812 Resale Ave, Greensboro, NC 27401",
      subtotal: 650,
      totalPrice: 650,
      status: "PENDING",
      paymentStatus: "UNPAID",
    },
  });

  const first = await prisma.pallet.findFirstOrThrow();
  await prisma.orderItem.create({ data: { orderId: order.id, palletId: first.id, price: first.price, quantity: 1 } });

  // A few historical orders (already paid/shipped) so Analytics has something to show.
  const allPallets = await prisma.pallet.findMany();
  const bySku = (sku: string) => allPallets.find((p) => p.sku === sku)!;
  const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);

  const historicalOrders = [
    { orderNumber: "D9-100101", customerName: "Priya Patel", customerEmail: "priya@example.com", sku: "DK-2306", price: 1150, createdAt: daysAgo(18) },
    { orderNumber: "D9-100142", customerName: "Marcus Webb", customerEmail: "marcus@example.com", sku: "DK-2318", price: 780, createdAt: daysAgo(11) },
    { orderNumber: "D9-100178", customerName: "Dana Cole", customerEmail: "dana@example.com", sku: "DK-2347", price: 480, createdAt: daysAgo(6) },
    { orderNumber: "D9-100201", customerName: "Ray Ortiz", customerEmail: "ray@example.com", sku: "DK-2352", price: 890, createdAt: daysAgo(2) },
  ];

  for (const h of historicalOrders) {
    const pallet = bySku(h.sku);
    const o = await prisma.order.create({
      data: {
        orderNumber: h.orderNumber,
        customerName: h.customerName,
        customerEmail: h.customerEmail,
        fulfillmentMode: "pickup",
        pickupWarehouse: "Charlotte, NC — Dock A",
        subtotal: h.price,
        totalPrice: h.price,
        status: "SHIPPED",
        paymentStatus: "PAID",
        createdAt: h.createdAt,
        shippedAt: h.createdAt,
      },
    });
    await prisma.orderItem.create({ data: { orderId: o.id, palletId: pallet.id, price: h.price, quantity: 1 } });
  }

  await prisma.activityLog.create({
    data: { userId: admin.id, action: "SEED", target: "database", detail: "Initial seed data loaded" },
  });

  // Reviews: a few tied to specific pallets (shown on that pallet's detail page),
  // plus a couple of general/featured ones for the sitewide testimonials section.
  const electronics = bySku("DK-2306");
  const furniture = bySku("DK-2352");
  await prisma.review.createMany({
    data: [
      { palletId: electronics.id, authorName: "Priya P.", rating: 5, comment: "Way more usable stuff than I expected for a returns pallet — three items were still sealed.", approved: true },
      { palletId: furniture.id, authorName: "Ray O.", rating: 4, comment: "One piece had a cracked leg but everything else was in great shape. Good value overall.", approved: true },
      { palletId: null, authorName: "Marcus W.", rating: 5, comment: "Been buying loads from Dock9 for four months now — consistent grading, no surprises.", approved: true, featured: true },
      { palletId: null, authorName: "Dana C.", rating: 5, comment: "Pickup was fast and the staff had my pallet already staged when I arrived.", approved: true, featured: true },
      { palletId: bySku("DK-2318").id, authorName: "New Buyer", rating: 3, comment: "Decent pallet, still waiting on a couple items to resell.", approved: false },
    ],
  });

  // A pending "Make an Offer" submission for the admin Offers dashboard to show.
  await prisma.offer.create({
    data: {
      palletId: bySku("DK-2340").id,
      customerName: "Jordan Blake",
      customerEmail: "jordan.blake@example.com",
      customerPhone: "555-330-2210",
      offerPrice: 1150,
      message: "Would you take $1,150 for this one? Picking up in person.",
      status: "PENDING",
    },
  });

  // A repeat/wholesale customer flagged for an automatic discount at checkout.
  await prisma.customer.create({
    data: {
      email: "marcus@example.com",
      name: "Marcus Webb",
      phone: "555-118-2290",
      wholesaleDiscountPercent: 12,
      notes: "Reselling to 2 local shops, orders roughly monthly — flagged wholesale per his request.",
    },
  });

  console.log("Seed complete. Logins:");
  console.log("  admin@dock9.example / password123 (ADMIN)");
  console.log("  manager@dock9.example / password123 (MANAGER)");
  console.log("  warehouse@dock9.example / password123 (WAREHOUSE)");
}

main().finally(() => prisma.$disconnect());
