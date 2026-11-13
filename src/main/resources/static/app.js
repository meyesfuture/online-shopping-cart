const CUSTOMER_ID = 1;
const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
const $ = (selector) => document.querySelector(selector);
let products = [];
let toastTimer;

async function api(path, options = {}) {
  const response = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try { message = (await response.json()).error || message; } catch (_) { /* response had no JSON body */ }
    throw new Error(message);
  }
  if (response.status === 204) return null;
  return response.json();
}
function showToast(message) {
  const toast = $('#toast'); toast.textContent = message; toast.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}
function showView(name) {
  document.querySelectorAll('.view').forEach(view => view.classList.toggle('active', view.id === name));
  document.querySelectorAll('.nav-link').forEach(button => button.classList.toggle('active', button.dataset.view === name));
  if (name === 'cart') loadCart();
  if (name === 'orders') loadOrders();
  if (name === 'admin') loadAdminProducts();
  window.scrollTo({ top: document.querySelector('.view.active')?.offsetTop - 70 || 0, behavior: 'smooth' });
}
function productIcon(name) {
  const value = name.toLowerCase();
  if (value.includes('bottle')) return '◉';
  if (value.includes('lamp')) return '☼';
  if (value.includes('notebook') || value.includes('book')) return '▤';
  if (value.includes('bag') || value.includes('backpack')) return '◒';
  return '✳';
}
async function loadProducts(search = '') {
  try {
    products = await api(`/api/products${search ? `?search=${encodeURIComponent(search)}` : ''}`);
    $('#product-list').innerHTML = products.length ? products.map(p => `
      <article class="product-card"><div class="product-visual">${productIcon(p.name)}</div><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.description || 'A useful campus essential.')}</p>
      <div class="product-bottom"><div><span class="price">${currency.format(p.price)}</span><span class="availability">${p.stock > 0 ? `${p.stock} available` : 'Out of stock'}</span></div><button class="add-button" data-add="${p.id}" ${p.stock < 1 ? 'disabled' : ''} aria-label="Add ${escapeHtml(p.name)} to cart">+</button></div></article>`).join('') : '<div class="empty">No products match your search.</div>';
    document.querySelectorAll('[data-add]').forEach(button => button.addEventListener('click', () => addToCart(Number(button.dataset.add))));
  } catch (error) { showToast(error.message); }
}
async function addToCart(productId) {
  try { await api(`/api/customers/${CUSTOMER_ID}/cart/items`, { method: 'POST', body: JSON.stringify({ productId, quantity: 1 }) }); showToast('Added to your cart'); await updateCartCount(); }
  catch (error) { showToast(error.message); }
}
async function updateCartCount() {
  try { const cart = await api(`/api/customers/${CUSTOMER_ID}/cart`); $('#cart-count').textContent = cart.items.reduce((sum, item) => sum + item.quantity, 0); }
  catch (_) { $('#cart-count').textContent = '0'; }
}
async function loadCart() {
  try {
    const cart = await api(`/api/customers/${CUSTOMER_ID}/cart`);
    $('#cart-count').textContent = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const host = $('#cart-items');
    if (!cart.items.length) { host.innerHTML = '<div class="empty">Your cart is empty. Pick something useful for your next class.</div>'; $('#cart-summary').innerHTML = ''; return; }
    host.innerHTML = cart.items.map(item => `<article class="cart-row"><div><strong>${escapeHtml(item.productName)}</strong><small>${currency.format(item.price)} each · ${item.availableStock} in stock</small></div><div class="quantity"><button data-change="${item.productId}" data-quantity="${item.quantity - 1}" aria-label="Decrease quantity">−</button><span>${item.quantity}</span><button data-change="${item.productId}" data-quantity="${item.quantity + 1}" aria-label="Increase quantity">+</button></div><div><strong>${currency.format(item.lineTotal)}</strong><button class="remove-button" data-remove="${item.productId}">Remove</button></div></article>`).join('');
    host.querySelectorAll('[data-change]').forEach(button => button.addEventListener('click', async () => {
      const quantity = Number(button.dataset.quantity);
      try { if (quantity < 1) await api(`/api/customers/${CUSTOMER_ID}/cart/items/${button.dataset.change}`, { method: 'DELETE' }); else await api(`/api/customers/${CUSTOMER_ID}/cart/items/${button.dataset.change}`, { method: 'PUT', body: JSON.stringify({ quantity }) }); await loadCart(); }
      catch (error) { showToast(error.message); }
    }));
    host.querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', async () => { try { await api(`/api/customers/${CUSTOMER_ID}/cart/items/${button.dataset.remove}`, { method: 'DELETE' }); await loadCart(); } catch (error) { showToast(error.message); } }));
    $('#cart-summary').innerHTML = `<h3>Order summary</h3><div class="summary-line"><span>Subtotal</span><span>${currency.format(cart.subtotal)}</span></div><div class="summary-line"><span>Discount</span><span>Applied at checkout</span></div><div class="summary-line total"><span>Total before discount</span><span>${currency.format(cart.subtotal)}</span></div><button class="primary" id="checkout">Place order <span>→</span></button>`;
    $('#checkout').addEventListener('click', checkout);
  } catch (error) { showToast(error.message); }
}
async function checkout() {
  const button = $('#checkout'); button.disabled = true; button.textContent = 'Placing order…';
  try { const order = await api(`/api/customers/${CUSTOMER_ID}/checkout`, { method: 'POST' }); showToast(`Order #${order.id} placed successfully`); await loadCart(); await loadProducts($('#search').value); showView('orders'); }
  catch (error) { showToast(error.message); button.disabled = false; button.innerHTML = 'Place order <span>→</span>'; await loadProducts($('#search').value); }
}
async function loadOrders() {
  try {
    const orders = await api(`/api/customers/${CUSTOMER_ID}/orders`);
    $('#order-list').innerHTML = orders.length ? orders.map(order => `<article class="order-card"><div><h3>Order #${order.id} <span class="availability" style="display:inline">· ${escapeHtml(order.status)}</span></h3><p>${new Date(order.createdAt).toLocaleString()}<br>${order.items.map(item => `${item.quantity} × ${escapeHtml(item.productName)}`).join(' · ')}</p></div><div class="order-total">${currency.format(order.total)}<small class="availability">${order.discountPercent}% discount · saved ${currency.format(order.discountAmount)}</small></div></article>`).join('') : '<div class="empty">No orders yet. Your first one will show up here.</div>';
  } catch (error) { showToast(error.message); }
}
async function loadAdminProducts() {
  try {
    const items = await api('/api/products');
    $('#admin-products').innerHTML = `<h3>Current products</h3>${items.map(p => `<div class="admin-product"><div><strong>${escapeHtml(p.name)}</strong><small>${currency.format(p.price)} · ${p.stock} in stock</small></div><button data-edit="${p.id}">Edit</button></div>`).join('')}`;
    document.querySelectorAll('[data-edit]').forEach(button => button.addEventListener('click', () => editProduct(Number(button.dataset.edit))));
  } catch (error) { showToast(error.message); }
}
function clearProductForm() { $('#product-form').reset(); $('#product-id').value = ''; $('#product-form-title').textContent = 'Add a product'; }
async function editProduct(id) {
  try { const p = await api(`/api/products/${id}`); $('#product-id').value = p.id; $('#product-name').value = p.name; $('#product-description').value = p.description; $('#product-price').value = p.price; $('#product-stock').value = p.stock; $('#product-form-title').textContent = 'Update product'; $('#product-name').focus(); }
  catch (error) { showToast(error.message); }
}
function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch])); }

document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => showView(button.dataset.view)));
$('#search').addEventListener('input', event => loadProducts(event.target.value.trim()));
$('#product-form').addEventListener('submit', async event => {
  event.preventDefault();
  const id = $('#product-id').value;
  const product = { name: $('#product-name').value, description: $('#product-description').value, price: Number($('#product-price').value), stock: Number($('#product-stock').value) };
  try { await api(id ? `/api/products/${id}` : '/api/products', { method: id ? 'PUT' : 'POST', body: JSON.stringify(product) }); showToast(id ? 'Product updated' : 'Product added'); clearProductForm(); await loadAdminProducts(); await loadProducts($('#search').value); }
  catch (error) { showToast(error.message); }
});
$('#cancel-edit').addEventListener('click', clearProductForm);
async function loadCustomer() { try { const c = await api(`/api/customers/${CUSTOMER_ID}`); $('#customer-name').textContent = c.name; $('#customer-email').textContent = c.email; $('#customer-name-input').value = c.name; $('#customer-email-input').value = c.email; $('#customer-phone-input').value = c.phone; } catch (error) { showToast(error.message); } }
$('#edit-customer').addEventListener('click', () => $('#customer-dialog').showModal());
$('#customer-form').addEventListener('submit', async event => {
  event.preventDefault();
  try { await api(`/api/customers/${CUSTOMER_ID}`, { method: 'PUT', body: JSON.stringify({ name: $('#customer-name-input').value, email: $('#customer-email-input').value, phone: $('#customer-phone-input').value }) }); $('#customer-dialog').close(); await loadCustomer(); showToast('Details saved'); }
  catch (error) { showToast(error.message); }
});
loadProducts(); loadCustomer(); updateCartCount();
