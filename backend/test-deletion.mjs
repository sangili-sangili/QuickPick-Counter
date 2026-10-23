import fetch from 'node-fetch';

async function testDeletionGuards() {
  console.log('Testing Deletion Guards and Service...');
  
  // 1. Login
  const loginRes = await fetch('http://localhost:3000/api/admin/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@quickpick.com', password: 'admin123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('Admin logged in successfully.');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 2. Test Category Deletion Guard
  const catRes = await fetch('http://localhost:3000/api/admin/categories', { headers });
  const catData = await catRes.json();
  const linkedCategory = catData.categories.find(c => c.productCount > 0);
  console.log('\n--- 1. Testing Category Deletion Guard ---');
  console.log(`Target Category: ${linkedCategory.name} (Assigned Products: ${linkedCategory.productCount})`);
  
  const delCatRes = await fetch(`http://localhost:3000/api/admin/categories/${linkedCategory.id}`, {
    method: 'DELETE',
    headers
  });
  const delCatData = await delCatRes.json();
  console.log(`HTTP Status: ${delCatRes.status} (Expected: 409)`);
  console.log(`Response:`, delCatData);

  // 3. Test Customer Deletion Guard
  const custRes = await fetch('http://localhost:3000/api/admin/customers', { headers });
  const custData = await custRes.json();
  const linkedCust = custData.customers.find(c => c.ordersCount > 0) || custData.customers[0];
  console.log('\n--- 2. Testing Customer Deletion Guard ---');
  console.log(`Target Customer: ${linkedCust.name} (Orders: ${linkedCust.ordersCount})`);

  const delCustRes = await fetch(`http://localhost:3000/api/admin/customers/${linkedCust.id}`, {
    method: 'DELETE',
    headers
  });
  const delCustData = await delCustRes.json();
  console.log(`HTTP Status: ${delCustRes.status}`);
  console.log(`Response:`, delCustData);

  // 4. Test Product Deletion Guard
  const prodRes = await fetch('http://localhost:3000/api/admin/products', { headers });
  const prodData = await prodRes.json();
  const targetProd = prodData.products[0];
  console.log('\n--- 3. Testing Product Deletion Guard ---');
  console.log(`Target Product: ${targetProd.name}`);

  const delProdRes = await fetch(`http://localhost:3000/api/admin/products/${targetProd.id}`, {
    method: 'DELETE',
    headers
  });
  const delProdData = await delProdRes.json();
  console.log(`HTTP Status: ${delProdRes.status}`);
  console.log(`Response:`, delProdData);

  // 5. Test Order Deletion Guard
  const orderRes = await fetch('http://localhost:3000/api/admin/orders', { headers });
  const orderData = await orderRes.json();
  const activeOrder = orderData.orders.find(o => o.status === 'unpaid' || o.status === 'paid') || orderData.orders[0];
  console.log('\n--- 4. Testing Order Deletion Guard ---');
  console.log(`Target Order: #${activeOrder.orderNumber} (Status: ${activeOrder.status}, Locker: ${activeOrder.lockerNumber})`);

  const delOrderRes = await fetch(`http://localhost:3000/api/admin/orders/${activeOrder.id}`, {
    method: 'DELETE',
    headers
  });
  const delOrderData = await delOrderRes.json();
  console.log(`HTTP Status: ${delOrderRes.status}`);
  console.log(`Response:`, delOrderData);
}

testDeletionGuards().catch(console.error);
