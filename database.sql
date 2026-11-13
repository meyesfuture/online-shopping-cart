CREATE DATABASE IF NOT EXISTS online_shop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE online_shop;

CREATE TABLE IF NOT EXISTS products (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(500) NOT NULL DEFAULT '',
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS customers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  phone VARCHAR(30) NOT NULL DEFAULT '',
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

INSERT INTO products (name, description, price, stock)
SELECT 'Canvas Backpack','Everyday backpack with a padded laptop sleeve',1299.00,18 WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Canvas Backpack');
INSERT INTO products (name, description, price, stock)
SELECT 'Steel Water Bottle','Reusable insulated 750 ml bottle',499.00,35 WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Steel Water Bottle');
INSERT INTO products (name, description, price, stock)
SELECT 'Desk Lamp','Adjustable LED study lamp',899.00,12 WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Desk Lamp');
INSERT INTO products (name, description, price, stock)
SELECT 'Notebook Set','Three ruled notebooks for class notes',249.00,50 WHERE NOT EXISTS (SELECT 1 FROM products WHERE name='Notebook Set');
INSERT INTO customers (name,email,phone)
SELECT 'Demo Student','student@example.com','9876543210' WHERE NOT EXISTS (SELECT 1 FROM customers WHERE email='student@example.com');
