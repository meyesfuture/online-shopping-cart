// Current active session (persisted in localStorage)
let currentUser = JSON.parse(localStorage.getItem('campus_cart_user')) || {
  id: 1,
  name: 'Demo Student',
  email: 'student@example.com',
  role: 'CUSTOMER',
  token: 'CUSTOMER_SESSION_TOKEN_1'
};

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
const $ = (selector) => document.querySelector(selector);
let products = [];
let toastTimer;

async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'X-User-Role': currentUser ? (currentUser.role || 'GUEST') : 'GUEST',
    'X-Auth-Token': currentUser ? (currentUser.token || '') : '',
    ...(options.headers || {})
  };
  const response = await fetch(path, { ...options, headers });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const errJson = await response.json();
      message = errJson.error || errJson.message || message;
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
  const isCustomer = currentUser && currentUser.role === 'CUSTOMER';
  const isAdmin = currentUser && currentUser.role === 'ADMIN';
  const isGuest = !currentUser || !currentUser.role;

  // Update navbar user pill
  const userBadge = $('#user-badge');
  const navLoginBtn = $('#nav-login');
  const navUserName = $('#nav-user-name');
  const userRoleLabel = $('#user-role-label');

  if (isGuest) {
    if (userBadge) userBadge.style.display = 'none';
    if (navLoginBtn) {
      navLoginBtn.style.display = 'inline-block';
      navLoginBtn.textContent = 'Login';
    }
  } else {
    if (userBadge) userBadge.style.display = 'inline-flex';
    if (navLoginBtn) {
      navLoginBtn.style.display = 'inline-block';
      navLoginBtn.textContent = 'Switch / Login';
    }
    if (navUserName) navUserName.textContent = currentUser.name || 'Account';
    if (userRoleLabel) {
      userRoleLabel.textContent = isAdmin ? 'Admin' : 'Student';
      userRoleLabel.classList.toggle('admin', isAdmin);
    }
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
  } else if (isCustomer) {
    if (customerBarEyebrow) customerBarEyebrow.textContent = 'SHOPPING AS';
    if (customerName) customerName.textContent = currentUser.name;
    if (customerEmail) customerEmail.textContent = `${currentUser.email} · 10% Student Discount Active`;
    if (editCustomerBtn) editCustomerBtn.style.display = 'inline-block';
  } else {
    if (customerBarEyebrow) customerBarEyebrow.textContent = 'GUEST VISITOR';
    if (customerName) customerName.textContent = 'Not signed in';
    if (customerEmail) customerEmail.textContent = 'Sign in as a student to access cart & checkout, or as admin to manage store.';
    if (editCustomerBtn) editCustomerBtn.style.display = 'none';
  }
}

function showView(name) {
  const isAdmin = currentUser && currentUser.role === 'ADMIN';
  const isCustomer = currentUser && currentUser.role === 'CUSTOMER';

  // Guard admin view
  if (name === 'admin') {
    const adminDenied = $('#admin-access-denied');
    const adminContent = $('#admin-content');

    if (!isAdmin) {
      if (adminDenied) adminDenied.style.display = 'block';
      if (adminContent) adminContent.style.display = 'none';
      showToast('Access Denied: Customer accounts cannot access Administrator tools.');
    } else {
      if (adminDenied) adminDenied.style.display = 'none';
      if (adminContent) adminContent.style.display = 'block';
      loadAdminProducts();
    }
  }

  // Guard cart/orders for non-customer
  if (name === 'cart' || name === 'orders') {
    if (isAdmin) {
      showToast('Personal cart & checkout are for Student accounts. Switch to Student mode to test.');
    } else if (!isCustomer) {
      showToast('Please sign in as a student to access cart & orders.');
      showView('login');
      return;
    }
  }

  document.querySelectorAll('.view').forEach(view => {
    view.classList.toggle('active', view.id === name);
  });
  document.querySelectorAll('.nav-link').forEach(button => {
    button.classList.toggle('active', button.dataset.view === name);
  });

  if (name === 'cart') loadCart();
  if (name === 'orders') loadOrders();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function productIcon(name) {
  const value = (name || '').toLowerCase();
  if (value.includes('bottle')) return '◉';
  if (value.includes('lamp') || value.includes('light')) return '☼';
  if (value.includes('notebook') || value.includes('book') || value.includes('pad')) return '▤';
  if (value.includes('bag') || value.includes('backpack') || value.includes('tote')) return '◒';
  if (value.includes('headphone') || value.includes('audio') || value.includes('ear')) return '🎧';
  if (value.includes('stand') || value.includes('laptop')) return '💻';
  if (value.includes('calculator') || value.includes('fx-')) return '🖩';
  if (value.includes('mug') || value.includes('coffee') || value.includes('tumbler')) return '☕';
  if (value.includes('hub') || value.includes('adapter') || value.includes('usb-c')) return '🔌';
  if (value.includes('pencil') || value.includes('pen') || value.includes('marker')) return '✏️';
  if (value.includes('drive') || value.includes('flash') || value.includes('usb')) return '💾';
  return '✳';
}

function renderProductCard(p) {
  const isAdmin = currentUser && currentUser.role === 'ADMIN';
  const actionButton = isAdmin
    ? `<button class="admin-card-action" data-edit-admin="${p.id}" title="Edit this product in Admin view">✏️ Edit</button>`
    : `<button class="add-button" data-add="${p.id}" ${p.stock < 1 ? 'disabled' : ''} aria-label="Add ${escapeHtml(p.name)} to cart">+</button>`;

  const imageMarkup = p.imageUrl
    ? `<img class="product-img" src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='grid';"><div class="product-fallback-icon" style="display:none">${productIcon(p.name)}</div>`
    : `<div class="product-fallback-icon">${productIcon(p.name)}</div>`;

  return `
    <article class="product-card">
      <div class="product-visual">${imageMarkup}</div>
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
  if (currentUser && currentUser.role === 'ADMIN') {
    showToast('Administrator accounts do not purchase. Switch to Student account to shop.');
    return;
  }
  if (!currentUser || currentUser.role !== 'CUSTOMER') {
    showToast('Please sign in as a student to add items to your cart.');
    openLoginDialog('CUSTOMER');
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
  if (!currentUser || currentUser.role !== 'CUSTOMER') {
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
  if (!currentUser || currentUser.role !== 'CUSTOMER') {
    $('#cart-items').innerHTML = '<div class="empty">Cart is available for Student / Customer accounts. Please sign in as a student.</div>';
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
  if (!currentUser || currentUser.role !== 'ADMIN') {
    $('#admin-products').innerHTML = '<div class="empty">Administrator access required.</div>';
    return;
  }
  try {
    const items = await api('/api/products');
    $('#admin-products').innerHTML = `
      <h3>Current products (${items.length})</h3>
      ${items.map(p => `
        <div class="admin-product">
          <div class="admin-product-info">
            ${p.imageUrl ? `<img src="${escapeHtml(p.imageUrl)}" alt="" class="admin-product-thumb" onerror="this.style.display='none';this.nextElementSibling.style.display='grid';"><div class="admin-product-thumb-placeholder" style="display:none">${productIcon(p.name)}</div>` : `<div class="admin-product-thumb-placeholder">${productIcon(p.name)}</div>`}
            <div>
              <strong>${escapeHtml(p.name)}</strong>
              <small>${currency.format(p.price)} · ${p.stock} units in stock</small>
            </div>
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
  if ($('#product-image-url')) $('#product-image-url').value = '';
  $('#product-form-title').textContent = 'Add a product';
}

async function editProduct(id) {
  try {
    const p = await api(`/api/products/${id}`);
    $('#product-id').value = p.id;
    $('#product-name').value = p.name;
    $('#product-description').value = p.description || '';
    $('#product-price').value = p.price;
    $('#product-stock').value = p.stock;
    if ($('#product-image-url')) $('#product-image-url').value = p.imageUrl || '';
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

function handleLogout() {
  localStorage.removeItem('campus_cart_user');
  currentUser = null;
  updateUserUI();
  updateCartCount();
  showToast('Signed out successfully.');
  showView('login');
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
    showToast(`Signed in as ${user.name} (${user.role === 'ADMIN' ? 'Store Administrator' : 'Student Customer'})`);

    // Reload state
    await loadProducts($('#search') ? $('#search').value : '');
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

const searchInput = $('#search');
if (searchInput) {
  searchInput.addEventListener('input', event => loadProducts(event.target.value.trim()));
}

$('#product-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (!currentUser || currentUser.role !== 'ADMIN') {
    showToast('Permission denied: Only administrators can modify products');
    return;
  }
  const id = $('#product-id').value;
  const product = {
    name: $('#product-name').value,
    description: $('#product-description').value,
    price: Number($('#product-price').value),
    stock: Number($('#product-stock').value),
    imageUrl: $('#product-image-url') ? $('#product-image-url').value.trim() : ''
  };
  try {
    await api(id ? `/api/products/${id}` : '/api/products', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(product)
    });
    showToast(id ? 'Product updated successfully' : 'Product added successfully');
    clearProductForm();
    await loadAdminProducts();
    await loadProducts(searchInput ? searchInput.value : '');
  } catch (error) {
    showToast(error.message);
  }
});

$('#cancel-edit').addEventListener('click', clearProductForm);

// Customer details editing
async function loadCustomer() {
  if (!currentUser || currentUser.role !== 'CUSTOMER') return;
  try {
    const c = await api(`/api/customers/${currentUser.id}`);
    $('#customer-name-input').value = c.name;
    $('#customer-email-input').value = c.email;
    $('#customer-phone-input').value = c.phone || '';
  } catch (_) {}
}

$('#edit-customer').addEventListener('click', () => {
  if (!currentUser || currentUser.role !== 'CUSTOMER') {
    showToast('Edit profile is available for Student accounts.');
    return;
  }
  loadCustomer();
  $('#customer-dialog').showModal();
});

$('#customer-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (!currentUser || currentUser.role !== 'CUSTOMER') return;
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
const openLoginBtn = $('#open-login-btn');
if (openLoginBtn) {
  openLoginBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openLoginDialog(currentUser && currentUser.role === 'ADMIN' ? 'CUSTOMER' : 'ADMIN');
  });
}

const footerSwitchBtn = $('#footer-switch-btn');
if (footerSwitchBtn) {
  footerSwitchBtn.addEventListener('click', () => {
    openLoginDialog(currentUser && currentUser.role === 'ADMIN' ? 'CUSTOMER' : 'ADMIN');
  });
}

const closeLoginDialogBtn = $('#close-login-dialog');
if (closeLoginDialogBtn) {
  closeLoginDialogBtn.addEventListener('click', closeLoginDialog);
}

$('#tab-student').addEventListener('click', () => setLoginRoleTab('CUSTOMER'));
$('#tab-admin').addEventListener('click', () => setLoginRoleTab('ADMIN'));

$('#quick-student-btn').addEventListener('click', () => {
  handleLogin({ role: 'CUSTOMER', email: 'student@example.com', password: 'student123' });
});

$('#quick-admin-btn').addEventListener('click', () => {
  handleLogin({ role: 'ADMIN', email: 'admin@campuscart.edu', password: 'admin123' });
});

$('#student-login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = $('#login-student-email').value.trim();
  const password = $('#login-student-password') ? $('#login-student-password').value.trim() : 'student123';
  handleLogin({ role: 'CUSTOMER', email, password });
});

$('#admin-login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = $('#login-admin-email').value.trim();
  const password = $('#login-admin-password').value.trim();
  handleLogin({ role: 'ADMIN', email, password });
});

// Full page Login View bindings
const pageStudentForm = $('#page-student-login-form');
if (pageStudentForm) {
  pageStudentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = $('#page-student-email').value.trim();
    const password = $('#page-student-password').value.trim();
    handleLogin({ role: 'CUSTOMER', email, password });
  });
}

const pageAdminForm = $('#page-admin-login-form');
if (pageAdminForm) {
  pageAdminForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = $('#page-admin-email').value.trim();
    const password = $('#page-admin-password').value.trim();
    handleLogin({ role: 'ADMIN', email, password });
  });
}

const pageQuickStudentBtn = $('#page-quick-student-btn');
if (pageQuickStudentBtn) {
  pageQuickStudentBtn.addEventListener('click', () => {
    handleLogin({ role: 'CUSTOMER', email: 'student@example.com', password: 'student123' });
  });
}

const pageQuickAdminBtn = $('#page-quick-admin-btn');
if (pageQuickAdminBtn) {
  pageQuickAdminBtn.addEventListener('click', () => {
    handleLogin({ role: 'ADMIN', email: 'admin@campuscart.edu', password: 'admin123' });
  });
}

const deniedLoginAdminBtn = $('#denied-login-admin-btn');
if (deniedLoginAdminBtn) {
  deniedLoginAdminBtn.addEventListener('click', () => {
    openLoginDialog('ADMIN');
  });
}

const logoutBtn = $('#logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    handleLogout();
  });
}

// INITIAL SETUP ON PAGE LOAD
updateUserUI();
loadProducts();
updateCartCount();
