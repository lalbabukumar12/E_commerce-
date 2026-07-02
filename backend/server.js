const http = require('http');
const { URL } = require('url');

const PORT = Number(process.env.PORT) || 4000;

let products = [
  { id: 1, name: 'Fresh Apples', category: 'Fruits', price: 50, oldPrice: 65, description: 'Crisp red apples.', imageUrl: '/assets/Apples.png' },
  { id: 2, name: 'Bananas', category: 'Fruits', price: 96, oldPrice: 110, description: 'Sweet ripe bananas.', imageUrl: '/assets/Bananas.png' },
  { id: 3, name: 'Broccoli', category: 'Vegetables', price: 75, oldPrice: 90, description: 'Fresh green broccoli.', imageUrl: '/assets/Broccoli.png' },
  { id: 4, name: 'Organic Milk', category: 'Dairy', price: 21, oldPrice: 30, description: 'Everyday organic milk.', imageUrl: '/assets/Milk.png' },
  { id: 5, name: 'Sourdough Loaf', category: 'Bakery', price: 47, oldPrice: 60, description: 'Tangy artisan bread.', imageUrl: '/assets/SourdoughLoaf.png' },
  { id: 6, name: 'Cheddar Cheese', category: 'Dairy', price: 77, oldPrice: 95, description: 'Rich cheddar cheese.', imageUrl: '/assets/CheddarCheese.png' },
  { id: 7, name: 'Coffee', category: 'Beverages', price: 96, oldPrice: 120, description: 'Fresh roasted coffee.', imageUrl: '/assets/Coffee.png' },
  { id: 8, name: 'Lobster Tail', category: 'Seafood', price: 140, oldPrice: 180, description: 'Premium seafood pick.', imageUrl: '/assets/Lobster.png' },
];

let orders = [
  {
    id: 'ORD-1001',
    customer: {
      name: 'Alice Johnson',
      email: 'alice.johnson@example.com',
      phone: '9876543210',
      address: '123 Elm Street, Springfield',
    },
    items: [
      { id: 1, name: 'Fresh Apples', price: 50, quantity: 2, imageUrl: '/assets/Apples.png' },
      { id: 4, name: 'Organic Milk', price: 21, quantity: 1, imageUrl: '/assets/Milk.png' },
    ],
    date: '2026-07-03',
    total: 121,
    status: 'Processing',
    paymentStatus: 'Unpaid',
    paymentMethod: 'Cash on Delivery',
  },
];

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  });
  res.end(JSON.stringify(data));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function normalizeProduct(body) {
  return {
    id: Date.now(),
    name: String(body.name || '').trim(),
    description: String(body.description || '').trim(),
    category: String(body.category || 'Grocery').trim(),
    oldPrice: Number(body.oldPrice || body.price || 0),
    price: Number(body.price || 0),
    imageUrl: String(body.imageUrl || '').trim(),
  };
}

function createOrder(body) {
  const items = Array.isArray(body.items) ? body.items : [];
  const total = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);

  return {
    id: `ORD-${Date.now()}`,
    customer: body.customer || {},
    items,
    date: new Date().toISOString().slice(0, 10),
    total,
    status: 'Pending',
    paymentStatus: body.paymentStatus || 'Unpaid',
    paymentMethod: body.paymentMethod || 'Cash on Delivery',
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  try {
    if (req.method === 'GET' && path === '/api/health') {
      sendJson(res, 200, { ok: true, service: 'rushbasket-api' });
      return;
    }

    if (req.method === 'GET' && path === '/api/products') {
      sendJson(res, 200, products);
      return;
    }

    if (req.method === 'POST' && path === '/api/products') {
      const product = normalizeProduct(await readJson(req));
      if (!product.name || !product.price) {
        sendJson(res, 400, { message: 'Product name and price are required.' });
        return;
      }

      products = [product, ...products];
      sendJson(res, 201, product);
      return;
    }

    if (req.method === 'DELETE' && path.startsWith('/api/products/')) {
      const id = Number(path.split('/').pop());
      products = products.filter((product) => Number(product.id) !== id);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === 'GET' && path === '/api/orders') {
      sendJson(res, 200, orders);
      return;
    }

    if (req.method === 'POST' && path === '/api/orders') {
      const order = createOrder(await readJson(req));
      orders = [order, ...orders];
      sendJson(res, 201, order);
      return;
    }

    if (req.method === 'PATCH' && path.startsWith('/api/orders/')) {
      const id = path.split('/').pop();
      const body = await readJson(req);
      orders = orders.map((order) => (order.id === id ? { ...order, ...body } : order));
      sendJson(res, 200, orders.find((order) => order.id === id));
      return;
    }

    sendJson(res, 404, { message: 'Route not found.' });
  } catch (error) {
    sendJson(res, 500, { message: error.message || 'Server error.' });
  }
});

server.listen(PORT, () => {
  console.log(`RushBasket API running at http://127.0.0.1:${PORT}`);
});
