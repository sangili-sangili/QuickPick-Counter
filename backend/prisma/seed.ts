import { PrismaClient, OrderStatus, LockerStatus, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting QuickPick database seed...');

  // 1. Clean existing records in reverse dependency order
  await prisma.notification.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.addToCart.deleteMany();
  await prisma.webhookEvent.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.smartLocker.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  // 2. Hash default passwords
  const adminHashedPassword = await bcrypt.hash('admin123', 10);
  const customerHashedPassword = await bcrypt.hash('password123', 10);

  // 3. Seed Admin User Credentials
  const adminUser = await prisma.user.create({
    data: {
      id: 'usr_admin_001',
      name: 'Station Administrator',
      email: 'admin@quickpick.com',
      password: adminHashedPassword,
      role: UserRole.ADMIN,
      avatar: 'A',
      isActive: true,
    },
  });

  console.log('✅ Admin user seeded (admin@quickpick.com / admin123)');

  // 4. Seed Customer Users and Customer Profiles with Balance
  const userAlex = await prisma.user.create({
    data: {
      id: 'usr_cust_882',
      name: 'Alex Johnson',
      email: 'alex.j@snackhub.in',
      password: customerHashedPassword,
      role: UserRole.CUSTOMER,
      avatar: 'A',
      customer: {
        create: {
          id: 'cust_demo_882',
          name: 'Alex Johnson',
          email: 'alex.j@snackhub.in',
          phone: '+91 98765 43210',
          balancePaise: 50000, // ₹500.00
          membershipTier: 'Gold Member',
        },
      },
    },
    include: { customer: true },
  });

  const userPriya = await prisma.user.create({
    data: {
      id: 'usr_cust_883',
      name: 'Priya Sharma',
      email: 'priya.s@quickpick.in',
      password: customerHashedPassword,
      role: UserRole.CUSTOMER,
      avatar: 'P',
      customer: {
        create: {
          id: 'cust_demo_883',
          name: 'Priya Sharma',
          email: 'priya.s@quickpick.in',
          phone: '+91 91234 56789',
          balancePaise: 25000, // ₹250.00
          membershipTier: 'Silver Member',
        },
      },
    },
    include: { customer: true },
  });

  const userRahul = await prisma.user.create({
    data: {
      id: 'usr_cust_884',
      name: 'Rahul Verma',
      email: 'rahul.v@quickpick.in',
      password: customerHashedPassword,
      role: UserRole.CUSTOMER,
      avatar: 'R',
      customer: {
        create: {
          id: 'cust_demo_884',
          name: 'Rahul Verma',
          email: 'rahul.v@quickpick.in',
          phone: '+91 97890 12345',
          balancePaise: 100000, // ₹1,000.00
          membershipTier: 'Gold Member',
        },
      },
    },
    include: { customer: true },
  });

  const userAnanya = await prisma.user.create({
    data: {
      id: 'usr_cust_885',
      name: 'Ananya Patel',
      email: 'ananya.p@quickpick.in',
      password: customerHashedPassword,
      role: UserRole.CUSTOMER,
      avatar: 'A',
      customer: {
        create: {
          id: 'cust_demo_885',
          name: 'Ananya Patel',
          email: 'ananya.p@quickpick.in',
          phone: '+91 99887 76655',
          balancePaise: 15000, // ₹150.00
          membershipTier: 'Bronze Member',
        },
      },
    },
    include: { customer: true },
  });

  console.log('✅ 4 Customers seeded with wallet balances (default password: password123)');

  // 5. Seed Categories
  const catSnacks = await prisma.category.create({
    data: {
      id: 'cat_snacks',
      name: 'Snacks',
      description: 'Crispy potato wafers, salted chips, and namkeen',
      image: '/images/lays.jpg',
      isActive: true,
    },
  });

  const catDrinks = await prisma.category.create({
    data: {
      id: 'cat_drinks',
      name: 'Drinks',
      description: 'Sparkling sodas, chilled energy cans, and fruit beverages',
      image: '/images/coke.jpg',
      isActive: true,
    },
  });

  const catChocolates = await prisma.category.create({
    data: {
      id: 'cat_chocolates',
      name: 'Chocolates',
      description: 'Crisp wafer bars, rich milk chocolates, and sweet treats',
      image: '/images/kitkat.jpg',
      isActive: true,
    },
  });

  const catBiscuits = await prisma.category.create({
    data: {
      id: 'cat_biscuits',
      name: 'Biscuits',
      description: 'Vanilla creme sandwich cookies and sweet crackers',
      image: '/images/oreo.jpg',
      isActive: true,
    },
  });

  const catCombos = await prisma.category.create({
    data: {
      id: 'cat_combos',
      name: 'Combos',
      description: 'Value pack meal combos with beverage pairing',
      image: '/images/hero-snacks.jpg',
      isActive: true,
    },
  });

  console.log('✅ Categories seeded');

  // 6. Seed Products with paise pricing and physical stock
  const pLays = await prisma.product.create({
    data: {
      id: 'prod_1',
      name: "Lay's Classic Salted",
      subtitle: 'Crispy Golden Potato Chips • 50g',
      description: 'Crisp and perfectly salted classic potato chips, cooked to golden perfection.',
      pricePaise: 3000, // ₹30.00
      regularPricePaise: 3500,
      offerPricePaise: 3000,
      physicalStock: 14,
      image: '/images/lays.jpg',
      galleryImages: ['/images/lays.jpg'],
      badge: 'Bestseller',
      badgeType: 'red',
      rating: 4.8,
      ratingCount: 245,
      isActive: true,
      categoryId: catSnacks.id,
    },
  });

  const pCoke = await prisma.product.create({
    data: {
      id: 'prod_2',
      name: 'Coca-Cola (300ml Can)',
      subtitle: 'Chilled Sparkling Soda • 300ml',
      description: 'The iconic bubbly cola, served ice cold directly from our temperature-controlled dispenser.',
      pricePaise: 4000, // ₹40.00
      regularPricePaise: 4500,
      offerPricePaise: 4000,
      physicalStock: 8,
      image: '/images/coke.jpg',
      galleryImages: ['/images/coke.jpg'],
      badge: 'Chilled 4°C',
      badgeType: 'amber',
      rating: 4.9,
      ratingCount: 310,
      isActive: true,
      categoryId: catDrinks.id,
    },
  });

  const pKitKat = await prisma.product.create({
    data: {
      id: 'prod_3',
      name: 'KitKat 4-Finger Crisp Bar',
      subtitle: 'Crisp Wafer in Milk Chocolate • 38g',
      description: 'Crisp oven-baked wafer fingers drenched in smooth milk chocolate.',
      pricePaise: 5000, // ₹50.00
      regularPricePaise: 6000,
      offerPricePaise: 5000,
      physicalStock: 6,
      image: '/images/kitkat.jpg',
      galleryImages: ['/images/kitkat.jpg'],
      badge: 'Sweet Treat',
      badgeType: 'green',
      rating: 4.7,
      ratingCount: 180,
      isActive: true,
      categoryId: catChocolates.id,
    },
  });

  const pCocoa = await prisma.product.create({
    data: {
      id: 'prod_cocoa',
      name: 'Cocoa Dark Chocolate Bar',
      subtitle: 'Crispy Premium 70% Cocoa • 80g Bar',
      description: 'Handcrafted artisan dark chocolate bar with 70% rich cocoa and delicate crispy texture.',
      pricePaise: 15000, // ₹150.00
      regularPricePaise: 20000,
      offerPricePaise: 15000,
      physicalStock: 20,
      image: '/images/cocoa.jpg',
      galleryImages: ['/images/cocoa.jpg'],
      badge: 'Artisan',
      badgeType: 'green',
      rating: 4.8,
      ratingCount: 88,
      isActive: true,
      categoryId: catChocolates.id,
    },
  });

  const pOreo = await prisma.product.create({
    data: {
      id: 'prod_4',
      name: 'Oreo Vanilla Creme Sandwich',
      subtitle: 'Rich Chocolate Cookies • 120g',
      description: 'Rich dark chocolate biscuits filled with sweet signature vanilla creme.',
      pricePaise: 3500, // ₹35.00
      regularPricePaise: 4000,
      offerPricePaise: 3500,
      physicalStock: 10,
      image: '/images/oreo.jpg',
      galleryImages: ['/images/oreo.jpg'],
      badge: 'Popular',
      badgeType: 'green',
      rating: 4.6,
      ratingCount: 150,
      isActive: true,
      categoryId: catBiscuits.id,
    },
  });

  const pPringles = await prisma.product.create({
    data: {
      id: 'prod_5',
      name: 'Pringles Sour Cream & Onion',
      subtitle: 'Curved Potato Crisps • 107g Canister',
      description: 'Infused with tangy sour cream, savoury onion, and irresistible crunch.',
      pricePaise: 11000, // ₹110.00
      regularPricePaise: 12500,
      offerPricePaise: 11000,
      physicalStock: 4,
      image: '/images/pringles.jpg',
      galleryImages: ['/images/pringles.jpg'],
      badge: 'Top Pick',
      badgeType: 'amber',
      rating: 4.9,
      ratingCount: 290,
      isActive: true,
      categoryId: catSnacks.id,
    },
  });

  const pRedBull = await prisma.product.create({
    data: {
      id: 'prod_6',
      name: 'Red Bull Energy Drink (250ml)',
      subtitle: 'Vitalizes Body and Mind • Chilled Can',
      description: 'Chilled energy beverage with taurine, B-group vitamins, and crisp taste.',
      pricePaise: 12500, // ₹125.00
      regularPricePaise: 13500,
      offerPricePaise: 12500,
      physicalStock: 3,
      image: '/images/redbull.jpg',
      galleryImages: ['/images/redbull.jpg'],
      badge: 'Energy Boost',
      badgeType: 'amber',
      rating: 4.8,
      ratingCount: 110,
      isActive: true,
      categoryId: catDrinks.id,
    },
  });

  console.log('✅ Products seeded');

  // 7. Seed 12 Smart Lockers
  const lockerConfigs: {
    number: string;
    name: string;
    status: LockerStatus;
    temperatureC: number;
    doorState: string;
  }[] = [
    { number: 'L-01', name: 'L-01', status: LockerStatus.AVAILABLE, temperatureC: 21, doorState: 'locked' },
    { number: 'L-02', name: 'L-02', status: LockerStatus.RESERVED, temperatureC: 20, doorState: 'locked' },
    { number: 'L-03', name: 'L-03', status: LockerStatus.AVAILABLE, temperatureC: 22, doorState: 'locked' },
    { number: 'L-04', name: 'L-04', status: LockerStatus.AVAILABLE, temperatureC: 21, doorState: 'locked' },
    { number: 'L-05', name: 'L-05', status: LockerStatus.AVAILABLE, temperatureC: 22, doorState: 'locked' },
    { number: 'L-06', name: 'L-06', status: LockerStatus.AVAILABLE, temperatureC: 20, doorState: 'locked' },
    { number: 'L-07', name: 'L-07', status: LockerStatus.OCCUPIED, temperatureC: 21, doorState: 'locked' },
    { number: 'L-08', name: 'L-08', status: LockerStatus.OCCUPIED, temperatureC: 21, doorState: 'unlocked' },
    { number: 'L-09', name: 'L-09', status: LockerStatus.AVAILABLE, temperatureC: 21, doorState: 'locked' },
    { number: 'L-10', name: 'L-10', status: LockerStatus.AVAILABLE, temperatureC: 22, doorState: 'locked' },
    { number: 'L-11', name: 'L-11', status: LockerStatus.AVAILABLE, temperatureC: 21, doorState: 'locked' },
    { number: 'L-12', name: 'L-12', status: LockerStatus.OUT_OF_SERVICE, temperatureC: 25, doorState: 'locked' },
  ];

  for (const cfg of lockerConfigs) {
    await prisma.smartLocker.create({ data: cfg });
  }

  console.log('✅ 12 Smart Lockers seeded');

  // 8. Seed Initial Sample Orders linked to Customer profiles
  const now = new Date();

  // Order 1: Paid & assigned to Locker L-07 for Alex Johnson
  const orderPaid = await prisma.order.create({
    data: {
      id: 'ord_1234',
      orderNumber: 'ORD1234',
      customerId: userAlex.customer!.id,
      totalPaise: 11000,
      status: OrderStatus.PAID,
      expiresAt: new Date(now.getTime() + 90000),
      lockerNumber: 'L-07',
      items: {
        create: [
          { productId: pLays.id, quantity: 1, unitPricePaise: 3000 },
          { productId: pCoke.id, quantity: 2, unitPricePaise: 4000 },
        ],
      },
    },
  });

  // Order 2: Active 120s Hold in Locker L-02 for Priya Sharma
  await prisma.order.create({
    data: {
      id: 'ord_1233',
      orderNumber: 'ORD1233',
      customerId: userPriya.customer!.id,
      totalPaise: 7000,
      status: OrderStatus.UNPAID,
      expiresAt: new Date(now.getTime() + 45000),
      lockerNumber: 'L-02',
      items: {
        create: [
          { productId: pKitKat.id, quantity: 1, unitPricePaise: 5000 },
          { productId: pLays.id, quantity: 1, unitPricePaise: 2000 },
        ],
      },
    },
  });

  // Order 3: Past Claimed Order for Rahul Verma
  await prisma.order.create({
    data: {
      id: 'ord_1231',
      orderNumber: 'ORD1231',
      customerId: userRahul.customer!.id,
      totalPaise: 5000,
      status: OrderStatus.CLAIMED,
      expiresAt: new Date(now.getTime() - 3600000),
      lockerNumber: 'L-01',
      pickupClaimedAt: new Date(now.getTime() - 3500000),
      claimedBy: 'PIN_VERIFIED',
      items: {
        create: [
          { productId: pKitKat.id, quantity: 1, unitPricePaise: 5000 },
        ],
      },
    },
  });

  // 9. Record sample WebhookEvent
  await prisma.webhookEvent.create({
    data: {
      eventId: 'evt_pay_mock_1234',
      orderId: orderPaid.id,
      eventType: 'payment.captured',
      amountPaise: 11000,
      signature: 'mock_valid_sha256_signature_hex',
      rawPayload: JSON.stringify({
        event: 'payment.captured',
        orderNumber: 'ORD1234',
        amount: 11000,
      }),
      status: 'PROCESSED',
    },
  });

  // 10. Seed Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: adminUser.id,
        title: 'Station #01 Online',
        message: 'All 12 dispenser compartments telemetry verified at 21°C.',
        type: 'success',
      },
      {
        userId: adminUser.id,
        title: 'Low Stock Alert',
        message: 'Red Bull Can (250ml) inventory reached 3 units.',
        type: 'warning',
      },
      {
        userId: userAlex.id,
        title: 'VIP Cashback Active',
        message: 'Welcome Alex! Your 5% Gold Member kiosk cashback is ready.',
        type: 'info',
      },
    ],
  });
  console.log('✅ Notifications seeded');

  // 11. Seed Wishlist
  await prisma.wishlist.createMany({
    data: [
      { userId: userAlex.id, productId: pLays.id },
      { userId: userAlex.id, productId: pKitKat.id },
      { userId: userPriya.id, productId: pCoke.id },
    ],
  });
  console.log('✅ Wishlist seeded');

  // 12. Seed AddToCart
  await prisma.addToCart.createMany({
    data: [
      { userId: userAlex.id, productId: pPringles.id, quantity: 1 },
      { userId: userPriya.id, productId: pOreo.id, quantity: 2 },
    ],
  });
  console.log('✅ AddToCart items seeded');

  console.log('🎉 QuickPick Counter Database Seeding Completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
