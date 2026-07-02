import { useEffect, useMemo, useState } from 'react';
import './index.css';

import logo from './assets/logo.png';
import banner from './assets/FoodBanner.png';
import apples from './assets/Apples.png';
import bananas from './assets/Bananas.png';
import broccoli from './assets/Broccoli.png';
import milk from './assets/Milk.png';
import bread from './assets/SourdoughLoaf.png';
import cheese from './assets/CheddarCheese.png';
import coffee from './assets/Coffee.png';
import lobster from './assets/Lobster.png';

const API_URL = 'http://127.0.0.1:4000/api';

const imageMap = {
  'Apples.png': apples,
  'Bananas.png': bananas,
  'Broccoli.png': broccoli,
  'Milk.png': milk,
  'SourdoughLoaf.png': bread,
  'CheddarCheese.png': cheese,
  'Coffee.png': coffee,
  'Lobster.png': lobster,
};

const starterProducts = [
  { id: 1, name: 'Fresh Apples', category: 'Fruits', price: 50, oldPrice: 65, imageUrl: '/assets/Apples.png' },
  { id: 2, name: 'Bananas', category: 'Fruits', price: 96, oldPrice: 110, imageUrl: '/assets/Bananas.png' },
  { id: 3, name: 'Broccoli', category: 'Vegetables', price: 75, oldPrice: 90, imageUrl: '/assets/Broccoli.png' },
  { id: 4, name: 'Organic Milk', category: 'Dairy', price: 21, oldPrice: 30, imageUrl: '/assets/Milk.png' },
  { id: 5, name: 'Sourdough Loaf', category: 'Bakery', price: 47, oldPrice: 60, imageUrl: '/assets/SourdoughLoaf.png' },
  { id: 6, name: 'Cheddar Cheese', category: 'Dairy', price: 77, oldPrice: 95, imageUrl: '/assets/CheddarCheese.png' },
  { id: 7, name: 'Coffee', category: 'Beverages', price: 96, oldPrice: 120, imageUrl: '/assets/Coffee.png' },
  { id: 8, name: 'Lobster Tail', category: 'Seafood', price: 140, oldPrice: 180, imageUrl: '/assets/Lobster.png' },
];

const emptyProduct = {
  name: '',
  description: '',
  category: 'Fruits',
  oldPrice: '',
  price: '',
  imageUrl: '',
};

function productImage(product) {
  const fileName = product.imageUrl?.split('/').pop();
  return imageMap[fileName] || product.imageUrl || apples;
}

async function fetchJson(path, options) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}

export default function App() {
  const [view, setView] = useState('store');
  const [activeCategory, setActiveCategory] = useState('All');
  const [products, setProducts] = useState(starterProducts);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [apiStatus, setApiStatus] = useState('checking');

  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(products.map((product) => product.category)))];
  }, [products]);

  const visibleProducts = useMemo(() => {
    if (activeCategory === 'All') {
      return products;
    }

    return products.filter((product) => product.category === activeCategory);
  }, [activeCategory, products]);

  const cartTotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  async function loadBackendData() {
    try {
      const [apiProducts, apiOrders] = await Promise.all([
        fetchJson('/products'),
        fetchJson('/orders'),
      ]);
      setProducts(apiProducts);
      setOrders(apiOrders);
      setApiStatus('connected');
    } catch {
      setApiStatus('offline');
    }
  }

  useEffect(() => {
    loadBackendData();
  }, []);

  function addToCart(product) {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) => (
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        ));
      }

      return [...current, { ...product, quantity: 1 }];
    });
  }

  async function placeOrder() {
    if (cart.length === 0) {
      return;
    }

    const orderBody = {
      customer: {
        name: 'Walk-in Customer',
        email: 'customer@example.com',
        phone: '9999999999',
        address: 'Local delivery',
      },
      items: cart,
      paymentMethod: 'Cash on Delivery',
    };

    try {
      const order = await fetchJson('/orders', {
        method: 'POST',
        body: JSON.stringify(orderBody),
      });
      setOrders((current) => [order, ...current]);
      setCart([]);
      setApiStatus('connected');
    } catch {
      setApiStatus('offline');
    }
  }

  async function addProduct(event) {
    event.preventDefault();

    const productBody = {
      ...form,
      price: Number(form.price),
      oldPrice: Number(form.oldPrice || form.price),
    };

    try {
      const product = await fetchJson('/products', {
        method: 'POST',
        body: JSON.stringify(productBody),
      });
      setProducts((current) => [product, ...current]);
      setForm(emptyProduct);
      setApiStatus('connected');
    } catch {
      setProducts((current) => [{ ...productBody, id: Date.now() }, ...current]);
      setApiStatus('offline');
    }
  }

  async function deleteProduct(id) {
    setProducts((current) => current.filter((product) => product.id !== id));

    try {
      await fetchJson(`/products/${id}`, { method: 'DELETE' });
      setApiStatus('connected');
    } catch {
      setApiStatus('offline');
    }
  }

  async function updateOrderStatus(id, status) {
    setOrders((current) => current.map((order) => (order.id === id ? { ...order, status } : order)));

    try {
      await fetchJson(`/orders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setApiStatus('connected');
    } catch {
      setApiStatus('offline');
    }
  }

  return (
    <div className="app">
      <header className="navbar">
        <a className="brand" href="#home" onClick={() => setView('store')}>
          <img src={logo} alt="RushBasket" />
          <span>RushBasket</span>
        </a>

        <nav className="nav-links" aria-label="Main navigation">
          <button className={view === 'store' ? 'nav-active' : ''} onClick={() => setView('store')} type="button">
            Store
          </button>
          <button className={view === 'admin' ? 'nav-active' : ''} onClick={() => setView('admin')} type="button">
            Admin
          </button>
        </nav>

        <div className="top-actions">
          <span className={`api-pill ${apiStatus}`}>{apiStatus === 'connected' ? 'API connected' : 'API offline'}</span>
          <button className="cart-button" type="button" onClick={placeOrder}>
            Cart <span>{cartCount}</span>
          </button>
        </div>
      </header>

      {view === 'store' ? (
        <main>
          <section className="hero" id="home">
            <div className="hero-copy">
              <p className="eyebrow">Fresh groceries delivered fast</p>
              <h1>Daily essentials, picked fresh for your kitchen.</h1>
              <p>
                Shop groceries from the frontend while product and order data comes from the local
                backend API.
              </p>
              <a className="primary-link" href="#items">Shop now</a>
            </div>

            <div className="hero-media">
              <img src={banner} alt="Fresh groceries" />
            </div>
          </section>

          <section className="section" id="items">
            <div className="section-heading">
              <p className="eyebrow">Popular picks</p>
              <h2>Browse groceries</h2>
            </div>

            <div className="category-row" aria-label="Product categories">
              {categories.map((category) => (
                <button
                  className={category === activeCategory ? 'category active' : 'category'}
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  type="button"
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="product-grid">
              {visibleProducts.map((product) => (
                <article className="product-card" key={product.id}>
                  <div className="product-image">
                    <img src={productImage(product)} alt={product.name} />
                  </div>
                  <div className="product-info">
                    <p>{product.category}</p>
                    <h3>{product.name}</h3>
                    <div className="product-actions">
                      <strong>Rs {product.price}</strong>
                      <button type="button" onClick={() => addToCart(product)}>
                        Add
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <aside className="cart-summary">
              <strong>Cart total: Rs {cartTotal}</strong>
              <button type="button" onClick={placeOrder} disabled={!cart.length}>
                Place test order
              </button>
            </aside>
          </section>
        </main>
      ) : (
        <main className="admin-page">
          <section className="admin-hero">
            <div>
              <p className="eyebrow">Admin dashboard</p>
              <h1>Manage products and orders</h1>
            </div>
            <button type="button" onClick={loadBackendData}>Refresh API data</button>
          </section>

          <section className="admin-grid">
            <form className="admin-panel" onSubmit={addProduct}>
              <h2>Add product</h2>
              <label>
                Product name
                <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
              </label>
              <label>
                Description
                <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows="3" />
              </label>
              <div className="form-row">
                <label>
                  Category
                  <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                    {categories.filter((category) => category !== 'All').map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                    <option>Grocery</option>
                  </select>
                </label>
                <label>
                  Price
                  <input type="number" min="1" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required />
                </label>
              </div>
              <label>
                Image URL
                <input
                  placeholder="/assets/Apples.png or https://..."
                  value={form.imageUrl}
                  onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
                />
              </label>
              <button className="primary-button" type="submit">Add item</button>
            </form>

            <section className="admin-panel">
              <h2>Products</h2>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td>{product.name}</td>
                        <td>{product.category}</td>
                        <td>Rs {product.price}</td>
                        <td>
                          <button className="danger-button" type="button" onClick={() => deleteProduct(product.id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </section>

          <section className="admin-panel">
            <h2>Orders</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{order.customer?.name || 'Customer'}</td>
                      <td>{order.items?.length || 0}</td>
                      <td>Rs {order.total}</td>
                      <td>
                        <select value={order.status} onChange={(event) => updateOrderStatus(order.id, event.target.value)}>
                          {['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((status) => (
                            <option key={status}>{status}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      )}

      <footer className="footer">
        <div>
          <strong>RushBasket</strong>
          <p>Frontend + admin connected to a local Node backend.</p>
        </div>
        <span>{apiStatus === 'connected' ? 'Backend: http://127.0.0.1:4000' : 'Start backend to save data'}</span>
      </footer>
    </div>
  );
}
