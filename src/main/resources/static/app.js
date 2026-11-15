// Current active session (persisted in localStorage)
let currentUser = JSON.parse(localStorage.getItem('campus_cart_user')) || {
  id: 1,
  name: 'Demo Student',
  email: 'student@example.com',
  role: 'CUSTOMER'
};

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
const $ = (selector) => document.querySelector(selector);
let products = [];
let toastTimer;

async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'X-User-Role': currentUser.role || 'CUSTOMER',
    ...(options.headers || {})
  };
  const response = await fetch(path, { ...options, headers });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const errJson = await response.json();
      message = errJson.error || message;
    } catch (_) {}
    throw new Error(message);
  }
  if (response.status === 204) return null;
  return response.json();
}

function showToast(message) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function updateUserUI() {
  const isCustomer = currentUser.role === 'CUSTOMER';
  const isAdmin = currentUser.role === 'ADMIN';

  // Update navbar user pill
  const navUserName = $('#nav-user-name');
  if (navUserName) navUserName.textContent = currentUser.name || 'Account';

  const userRoleLabel = $('#user-role-label');
  if (userRoleLabel) {
    userRoleLabel.textContent = isAdmin ? 'Admin' : 'Student';
    userRoleLabel.classList.toggle('admin', isAdmin);
  }

  // Nav item visibility based on role
  const navAdmin = $('#nav-admin');
  if (navAdmin) navAdmin.style.display = isAdmin ? 'inline-block' : 'none';

  const navOrders = $('#nav-orders');
  if (navOrders) navOrders.style.display = isCustomer ? 'inline-block' : 'none';

  const navCart = $('#nav-cart');
  if (navCart) navCart.style.display = isCustomer ? 'inline-flex' : 'none';

  const heroOrdersBtn = $('#hero-orders-btn');
  if (heroOrdersBtn) heroOrdersBtn.style.display = isCustomer ? 'inline-block' : 'none';

  // Update customer status bar at the bottom
  const customerBarEyebrow = $('#customer-bar-eyebrow');
  const customerName = $('#customer-name');
  const customerEmail = $('#customer-email');
  const editCustomerBtn = $('#edit-customer');

  if (isAdmin) {
    if (customerBarEyebrow) customerBarEyebrow.textContent = 'ADMINISTRATOR MODE';
    if (customerName) customerName.textContent = `${currentUser.name} (Store Administrator)`;
    if (customerEmail) customerEmail.textContent = `${currentUser.email} · Full Product Catalog & Stock Controls`;
    if (editCustomerBtn) editCustomerBtn.style.display = 'none';
  } else {
    if (customerBarEyebrow) customerBarEyebrow.textContent = 'SHOPPING AS';
    if (customerName) customerName.textContent = currentUser.name;
    if (customerEmail) customerEmail.textContent = currentUser.email;
    if (editCustomerBtn) editCustomerBtn.style.display = 'inline-block';
  }
}

function showView(name) {
  // Guard admin view
  if (name === 'admin' && currentUser.role !== 'ADMIN') {
    showToast('Admin permission required. Please sign in as an Administrator.');
    openLoginDialog('ADMIN');
    return;
  }

  // Guard cart/orders for admin
  if ((name === 'cart' || name === 'orders') && currentUser.role === 'ADMIN') {
    showToast('Personal cart & checkout are for student accounts. Switch to Student mode to test.');
  }

  document.querySelectorAll('.view').forEach(view => {
    view.classList.toggle('active', view.id === name);
  });
  document.querySelectorAll('.nav-link').forEach(button => {
    button.classList.toggle('active', button.dataset.view === name);
  });

  if (name === 'cart') loadCart();
  if (name === 'orders') loadOrders();
  if (name === 'admin') loadAdminProducts();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function productIcon(name) {
  const value = name.toLowerCase();
  if (value.includes('bottle')) return '◉';
  if (value.includes('lamp')) return '☼';
  if (value.includes('notebook') || value.includes('book')) return '▤';
  if (value.includes('bag') || value.includes('backpack')) return '◒';
  return '✳';
}

function renderProductCard(p) {
  const isAdmin = currentUser.role === 'ADMIN';
  const actionButton = isAdmin
    ? `<button class="admin-card-action" data-edit-admin="${p.id}" title="Edit this product in Admin view">✏️ Edit</button>`
    : `<button class="add-button" data-add="${p.id}" ${p.stock < 1 ? 'disabled' : ''} aria-label="Add ${escapeHtml(p.name)} to cart">+</button>`;

  return `
    <article class="product-card">
      <div class="product-visual">${productIcon(p.name)}</div>
      <h3>${escapeHtml(p.name)}</h3>
      <p>${escapeHtml(p.description || 'A useful campus essential.')}</p>
      <div class="product-bottom">
        <div>
          <span class="price">${currency.format(p.price)}</span>
          <span class="availability">${p.stock > 0 ? `${p.stock} available` : 'Out of stock'}</span>
        </div>
        ${actionButton}
      </div>
    </article>
  `;
}

function bindProductActions() {
  // Bind standard add-to-cart buttons
  document.querySelectorAll('[data-add]').forEach(button => {
    button.onclick = () => addToCart(Number(button.dataset.add));
  });

  // Bind admin quick-edit buttons
  document.querySelectorAll('[data-edit-admin]').forEach(button => {
    button.onclick = () => {
      showView('admin');
      editProduct(Number(button.dataset.editAdmin));
    };
  });
}

async function loadProducts(search = '') {
  try {
    products = await api(`/api/products${search ? `?search=${encodeURIComponent(search)}` : ''}`);
    const host = $('#product-list');
    if (host) {
      host.innerHTML = products.length
        ? products.map(renderProductCard).join('')
        : '<div class="empty">No products match your search.</div>';
    }

    const featuredHost = $('#featured-product-list');
    if (featuredHost && !search) {
      featuredHost.innerHTML = products.slice(0, 4).map(renderProductCard).join('');
    }

    bindProductActions();
  } catch (error) {
    showToast(error.message);
  }
}

async function addToCart(productId) {
  if (currentUser.role === 'ADMIN') {
    showToast('Administrator accounts do not purchase. Switch to Student account to shop.');
    return;
  }
  try {
    await api(`/api/customers/${currentUser.id}/cart/items`, {
      method: 'POST',
      body: JSON.stringify({ productId, quantity: 1 })
    });
    showToast('Added to your cart');
    await updateCartCount();
  } catch (error) {
    showToast(error.message);
  }
}

async function updateCartCount() {
  if (currentUser.role !== 'CUSTOMER') {
    $('#cart-count').textContent = '0';
    return;
  }
  try {
    const cart = await api(`/api/customers/${currentUser.id}/cart`);
    const totalCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    $('#cart-count').textContent = totalCount;
  } catch (_) {
    $('#cart-count').textContent = '0';
  }
}

async function loadCart() {
  if (currentUser.role !== 'CUSTOMER') {
    $('#cart-items').innerHTML = '<div class="empty">Cart is available in Student / Customer mode.</div>';
    $('#cart-summary').innerHTML = '';
    return;
  }
  try {
    const cart = await api(`/api/customers/${currentUser.id}/cart`);
    const totalCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    $('#cart-count').textContent = totalCount;

    const host = $('#cart-items');
    if (!cart.items.length) {
      host.innerHTML = '<div class="empty">Your cart is empty. Pick something useful for your next class.</div>';
      $('#cart-summary').innerHTML = '';
      return;
    }

    host.innerHTML = cart.items.map(item => `
      <article class="cart-row">
        <div>
          <strong>${escapeHtml(item.productName)}</strong>
          <small>${currency.format(item.price)} each · ${item.availableStock} in stock</small>
        </div>
        <div class="quantity">
          <button data-change="${item.productId}" data-quantity="${item.quantity - 1}" aria-label="Decrease quantity">−</button>
          <span>${item.quantity}</span>
          <button data-change="${item.productId}" data-quantity="${item.quantity + 1}" aria-label="Increase quantity">+</button>
        </div>
        <div>
          <strong>${currency.format(item.lineTotal)}</strong>
          <button class="remove-button" data-remove="${item.productId}">Remove</button>
        </div>
      </article>
    `).join('');

    host.querySelectorAll('[data-change]').forEach(button => {
      button.addEventListener('click', async () => {
        const quantity = Number(button.dataset.quantity);
        try {
          if (quantity < 1) {
            await api(`/api/customers/${currentUser.id}/cart/items/${button.dataset.change}`, { method: 'DELETE' });
          } else {
            await api(`/api/customers/${currentUser.id}/cart/items/${button.dataset.change}`, {
              method: 'PUT',
              body: JSON.stringify({ quantity })
            });
          }
          await loadCart();
        } catch (error) {
          showToast(error.message);
        }
      });
    });

    host.querySelectorAll('[data-remove]').forEach(button => {
      button.addEventListener('click', async () => {
        try {
          await api(`/api/customers/${currentUser.id}/cart/items/${button.dataset.remove}`, { method: 'DELETE' });
          await loadCart();
        } catch (error) {
          showToast(error.message);
        }
      });
    });

    $('#cart-summary').innerHTML = `
      <h3>Order summary</h3>
      <div class="summary-line">
        <span>Subtotal</span>
        <span>${currency.format(cart.subtotal)}</span>
      </div>
      <div class="summary-line">
        <span>Student discount (10%)</span>
        <span>Applied at checkout</span>
      </div>
      <div class="summary-line total">
        <span>Total before discount</span>
        <span>${currency.format(cart.subtotal)}</span>
      </div>
      <button class="primary" id="checkout">Place order <span>→</span></button>
    `;

    $('#checkout').addEventListener('click', checkout);
  } catch (error) {
    showToast(error.message);
  }
}

async function checkout() {
  const button = $('#checkout');
  button.disabled = true;
  button.textContent = 'Placing order…';
  try {
    const order = await api(`/api/customers/${currentUser.id}/checkout`, { method: 'POST' });
    showToast(`Order #${order.id} placed successfully!`);
    await loadCart();
    await loadProducts($('#search').value);
    showView('orders');
  } catch (error) {
    showToast(error.message);
    button.disabled = false;
    button.innerHTML = 'Place order <span>→</span>';
    await loadProducts($('#search').value);
  }
}

async function loadOrders() {
  if (currentUser.role !== 'CUSTOMER') {
    $('#order-list').innerHTML = '<div class="empty">Orders are viewable in Student / Customer mode.</div>';
    return;
  }
  try {
    const orders = await api(`/api/customers/${currentUser.id}/orders`);
    $('#order-list').innerHTML = orders.length
      ? orders.map(order => `
        <article class="order-card">
          <div>
            <h3>Order #${order.id} <span class="availability" style="display:inline">· ${escapeHtml(order.status)}</span></h3>
            <p>${new Date(order.createdAt).toLocaleString()}<br>${order.items.map(item => `${item.quantity} × ${escapeHtml(item.productName)}`).join(' · ')}</p>
          </div>
          <div class="order-total">
            ${currency.format(order.total)}
            <small class="availability">${order.discountPercent}% discount · saved ${currency.format(order.discountAmount)}</small>
          </div>
        </article>
      `).join('')
      : '<div class="empty">No orders yet. Your first one will show up here.</div>';
  } catch (error) {
    showToast(error.message);
  }
}

async function loadAdminProducts() {
  if (currentUser.role !== 'ADMIN') {
    $('#admin-products').innerHTML = '<div class="empty">Administrator access required.</div>';
    return;
  }
  try {
    const items = await api('/api/products');
    $('#admin-products').innerHTML = `
      <h3>Current products (${items.length})</h3>
      ${items.map(p => `
        <div class="admin-product">
          <div>
            <strong>${escapeHtml(p.name)}</strong>
            <small>${currency.format(p.price)} · ${p.stock} units in stock</small>
          </div>
          <button data-edit="${p.id}">Edit</button>
        </div>
      `).join('')}
    `;
    document.querySelectorAll('[data-edit]').forEach(button => {
      button.addEventListener('click', () => editProduct(Number(button.dataset.edit)));
    });
  } catch (error) {
    showToast(error.message);
  }
}

function clearProductForm() {
  $('#product-form').reset();
  $('#product-id').value = '';
  $('#product-form-title').textContent = 'Add a product';
}

async function editProduct(id) {
  try {
    const p = await api(`/api/products/${id}`);
    $('#product-id').value = p.id;
    $('#product-name').value = p.name;
    $('#product-description').value = p.description;
    $('#product-price').value = p.price;
    $('#product-stock').value = p.stock;
    $('#product-form-title').textContent = 'Update product';
    $('#product-name').focus();
  } catch (error) {
    showToast(error.message);
  }
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));
}

// LOGIN / ROLE SWITCHING MODAL LOGIC
function openLoginDialog(preferredRole = 'CUSTOMER') {
  const dialog = $('#login-dialog');
  if (!dialog) return;
  setLoginRoleTab(preferredRole);
  dialog.showModal();
}

function closeLoginDialog() {
  const dialog = $('#login-dialog');
  if (dialog) dialog.close();
}

function setLoginRoleTab(role) {
  const isStudent = role === 'CUSTOMER';
  $('#tab-student').classList.toggle('active', isStudent);
  $('#tab-admin').classList.toggle('active', !isStudent);
  $('#student-login-form').style.display = isStudent ? 'grid' : 'none';
  $('#admin-login-form').style.display = !isStudent ? 'grid' : 'none';
}

async function handleLogin(payload) {
  try {
    const user = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    currentUser = user;
    localStorage.setItem('campus_cart_user', JSON.stringify(currentUser));
    updateUserUI();
    closeLoginDialog();
    showToast(`Signed in as ${user.name} (${user.role === 'ADMIN' ? 'Administrator' : 'Student'})`);

    // Reload state
    await loadProducts($('#search').value);
    if (currentUser.role === 'ADMIN') {
      showView('admin');
    } else {
      await updateCartCount();
      showView('shop');
    }
  } catch (error) {
    showToast(error.message);
  }
}

// BINDINGS
document.querySelectorAll('[data-view]').forEach(button => {
  button.addEventListener('click', (e) => {
    e.preventDefault();
    showView(button.dataset.view);
  });
});

$('#search').addEventListener('input', event => loadProducts(event.target.value.trim()));

$('#product-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (currentUser.role !== 'ADMIN') {
    showToast('Permission denied: Only administrators can modify products');
    return;
  }
  const id = $('#product-id').value;
  const product = {
    name: $('#product-name').value,
    description: $('#product-description').value,
    price: Number($('#product-price').value),
    stock: Number($('#product-stock').value)
  };
  try {
    await api(id ? `/api/products/${id}` : '/api/products', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(product)
    });
    showToast(id ? 'Product updated successfully' : 'Product added successfully');
    clearProductForm();
    await loadAdminProducts();
    await loadProducts($('#search').value);
  } catch (error) {
    showToast(error.message);
  }
});

$('#cancel-edit').addEventListener('click', clearProductForm);

// Customer details editing
async function loadCustomer() {
  if (currentUser.role !== 'CUSTOMER') return;
  try {
    const c = await api(`/api/customers/${currentUser.id}`);
    $('#customer-name-input').value = c.name;
    $('#customer-email-input').value = c.email;
    $('#customer-phone-input').value = c.phone || '';
  } catch (_) {}
}

$('#edit-customer').addEventListener('click', () => {
  if (currentUser.role !== 'CUSTOMER') {
    showToast('Edit profile is available for Student accounts.');
    return;
  }
  loadCustomer();
  $('#customer-dialog').showModal();
});

$('#customer-form').addEventListener('submit', async event => {
  event.preventDefault();
  try {
    await api(`/api/customers/${currentUser.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: $('#customer-name-input').value,
        email: $('#customer-email-input').value,
        phone: $('#customer-phone-input').value
      })
    });
    currentUser.name = $('#customer-name-input').value;
    currentUser.email = $('#customer-email-input').value;
    localStorage.setItem('campus_cart_user', JSON.stringify(currentUser));
    $('#customer-dialog').close();
    updateUserUI();
    showToast('Student details updated');
  } catch (error) {
    showToast(error.message);
  }
});

// Login dialog tab & submission bindings
$('#open-login-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  openLoginDialog(currentUser.role === 'ADMIN' ? 'CUSTOMER' : 'ADMIN');
});
$('#footer-switch-btn').addEventListener('click', () => {
  openLoginDialog(currentUser.role === 'ADMIN' ? 'CUSTOMER' : 'ADMIN');
});
$('#close-login-dialog').addEventListener('click', closeLoginDialog);

$('#tab-student').addEventListener('click', () => setLoginRoleTab('CUSTOMER'));
$('#tab-admin').addEventListener('click', () => setLoginRoleTab('ADMIN'));

$('#quick-student-btn').addEventListener('click', () => {
  handleLogin({ role: 'CUSTOMER', email: 'student@example.com', name: 'Demo Student' });
});

$('#quick-admin-btn').addEventListener('click', () => {
  handleLogin({ role: 'ADMIN', email: 'admin@campuscart.edu', password: 'admin123' });
});

$('#student-login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = $('#login-student-email').value.trim();
  const name = $('#login-student-name').value.trim();
  handleLogin({ role: 'CUSTOMER', email, name });
});

$('#admin-login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = $('#login-admin-email').value.trim();
  const password = $('#login-admin-password').value.trim();
  handleLogin({ role: 'ADMIN', email, password });
});

// INITIAL SETUP ON PAGE LOAD
updateUserUI();
loadProducts();
updateCartCount();
