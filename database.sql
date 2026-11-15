CREATE DATABASE IF NOT EXISTS online_shop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE online_shop;

CREATE TABLE IF NOT EXISTS products (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(500) NOT NULL DEFAULT '',
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url VARCHAR(500) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL DEFAULT 'student123',
  phone VARCHAR(30) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(60) NOT NULL UNIQUE,
  email VARCHAR(180) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS carts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  customer_id BIGINT NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_carts_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cart_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  cart_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  CONSTRAINT uq_cart_product UNIQUE (cart_id, product_id),
  CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  customer_id BIGINT NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  discount_percent DECIMAL(5,2) NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'PLACED',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  product_name VARCHAR(120) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  line_total DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Seed initial campus products with images
INSERT INTO products (name, description, price, stock, image_url)
SELECT 'Canvas Backpack','Everyday water-resistant canvas backpack with a 15-inch padded laptop sleeve and quick-access pockets.',1299.00,18,'/images/backpack.jpg'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Canvas Backpack');

INSERT INTO products (name, description, price, stock, image_url)
SELECT 'Steel Water Bottle','Double-wall vacuum insulated 750 ml stainless steel bottle keeping drinks cold for 24 hours.',499.00,35,'/images/water-bottle.jpg'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Steel Water Bottle');

INSERT INTO products (name, description, price, stock, image_url)
SELECT 'Desk Lamp','Adjustable LED study lamp with 3 color temperatures and touch brightness controls.',899.00,12,'/images/desk-lamp.jpg'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Desk Lamp');

INSERT INTO products (name, description, price, stock, image_url)
SELECT 'Notebook Set','Pack of 3 hardbound college-ruled notebooks with 100gsm ink-bleed resistant paper.',249.00,50,'/images/notebook-set.jpg'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Notebook Set');

INSERT INTO products (name, description, price, stock, image_url)
SELECT 'Scientific Calculator','Advanced FX-991EX non-programmable scientific calculator approved for university exams.',1499.00,25,'/images/calculator.jpg'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Scientific Calculator');

INSERT INTO products (name, description, price, stock, image_url)
SELECT 'Wireless Noise-Canceling Headphones','Comfortable over-ear Bluetooth headphones with 30-hour battery life for distraction-free library study.',2999.00,15,'/images/headphones.jpg'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Wireless Noise-Canceling Headphones');

INSERT INTO products (name, description, price, stock, image_url)
SELECT 'Ergonomic Aluminum Laptop Stand','Foldable heat-dissipating riser for comfortable ergonomic typing and posture during long lectures.',799.00,22,'/images/laptop-stand.jpg'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Ergonomic Aluminum Laptop Stand');

INSERT INTO products (name, description, price, stock, image_url)
SELECT 'Stainless Steel Travel Coffee Mug','Leak-proof 450 ml thermal tumbler with flip lid for hot coffee or tea between early morning classes.',599.00,30,'/images/coffee-mug.jpg'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Stainless Steel Travel Coffee Mug');

INSERT INTO products (name, description, price, stock, image_url)
SELECT 'Multi-Port 6-in-1 USB-C Hub','Compact aluminum hub with 4K HDMI, 3x USB 3.0 ports, SD card reader, and 100W Power Delivery.',1199.00,16,'/images/usb-hub.jpg'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Multi-Port 6-in-1 USB-C Hub');

INSERT INTO products (name, description, price, stock, image_url)
SELECT 'Mechanical Pencil Drafting Set','Precision metal drafting pencils (0.5mm & 0.7mm) with polymer leads and eraser refills.',349.00,40,'/images/pencil-set.jpg'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Mechanical Pencil Drafting Set');

INSERT INTO products (name, description, price, stock, image_url)
SELECT 'Minimalist Canvas Tote Bag','Heavy-duty 100% organic cotton carryall bag for textbooks, groceries, and daily campus essentials.',399.00,45,'/images/tote-bag.jpg'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Minimalist Canvas Tote Bag');

INSERT INTO products (name, description, price, stock, image_url)
SELECT 'High-Speed 128GB USB 3.2 Flash Drive','Ultra-compact metal thumb drive for safe backups of term papers, code repos, and class projects.',699.00,28,'/images/usb-drive.jpg'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='High-Speed 128GB USB 3.2 Flash Drive');

-- Seed demo customer (password: student123)
INSERT INTO customers (name, email, password, phone)
SELECT 'Demo Student','student@example.com','student123','9876543210' WHERE NOT EXISTS (SELECT 1 FROM customers WHERE email='student@example.com');

-- Seed demo administrator (username: admin, password: admin123)
INSERT INTO admins (username, email, password, full_name)
SELECT 'admin','admin@campuscart.edu','admin123','Store Administrator' WHERE NOT EXISTS (SELECT 1 FROM admins WHERE username='admin');
