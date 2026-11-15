# Campus Cart — Online Shopping Cart and Order Management

A small college level project built with Java 17, Spring Boot, Spring JDBC/JdbcTemplate, MySQL, Maven, and plain HTML/CSS/JavaScript. It keeps the main flow in four easy to follow layers:

```text
Browser → Controller → Service → Repository → MySQL
```

There is no JPA/Hibernate, frontend framework, external payment service, or database password in Java source code.

## Requirements

- Java 17 or newer
- Maven 3.6+
- MySQL 8.0+

## Run locally

1. In MySQL Workbench or the MySQL command line, run `database.sql`. It creates `online_shop`, all six tables, four sample products, and the demo customer (`student@example.com`).
2. Copy `src/main/resources/application.properties.example` to `src/main/resources/application.properties`.
3. Set your MySQL connection details as environment variables (or leave defaults if using `root` with no password on localhost:3306). In PowerShell:

   ```powershell
   $env:DB_URL = "jdbc:mysql://localhost:3306/online_shop?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
   $env:DB_USERNAME = "your_mysql_user"
   $env:DB_PASSWORD = "your_mysql_password"
   $env:DISCOUNT_PERCENT = "10"
   ```

4. Run the project using the included Maven wrapper or helper scripts:

   - **Windows:** Double-click `run.bat` or run `.\run.ps1`
   - **Cross-platform Maven Wrapper:**
     ```sh
     ./mvnw spring-boot:run
     ```
   - **Or build and run the packaged jar:**
     ```sh
     ./mvnw clean package
     java -jar target/online-shopping-cart-1.0.0.jar
     ```

5. Open [http://localhost:8080](http://localhost:8080). The UI starts on the editorial campus landing page and uses the demo customer with ID `1`.

## Features

- **Campus Landing Page:** Editorial hero with custom art, value highlights, curated top picks preview with instant add-to-cart, 3-step checkout guide, student testimonials, and CTA banners.
- **Product Catalog & Search:** Name search, dynamic pricing, and stock badge.
- **Customer Management:** Customer registration and profile editing through the REST API and demo UI dialog.
- **Shopping Cart:** Per-customer cart with quantity changes, line removal, subtotal calculation, and stock validation.
- **Checkout & Student Discounts:** Atomic transaction checkout with automatic percentage discount calculation and point-in-time order history.
- **Order History:** Detailed order receipts preserving purchased product names and prices.
- **Admin Tools:** Add and update products with validation.
- **Traditional JDBC vs Spring JDBC:** Side-by-side comparison endpoints.

## API reference

All request and response bodies use JSON. Errors return `{"error":"message"}`. Product and customer request fields are validated; duplicate customer email returns HTTP 409.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/products` | List products |
| `GET` | `/api/products?search=lamp` | Search by product name |
| `GET` | `/api/products/{id}` | Get one product |
| `POST` | `/api/products` | Add `{ "name", "description", "price", "stock" }` |
| `PUT` | `/api/products/{id}` | Replace product fields |
| `PATCH` | `/api/products/{id}/stock` | Set stock with `{ "stock": 12 }` |
| `GET` | `/api/customers` | List customers |
| `GET` | `/api/customers/{id}` | Get one customer |
| `POST` | `/api/customers` | Register `{ "name", "email", "phone" }` |
| `PUT` | `/api/customers/{id}` | Update customer details |
| `GET` | `/api/customers/{id}/cart` | View cart and subtotal |
| `POST` | `/api/customers/{id}/cart/items` | Add `{ "productId": 1, "quantity": 2 }` |
| `PUT` | `/api/customers/{id}/cart/items/{productId}` | Set `{ "quantity": 3 }` |
| `DELETE` | `/api/customers/{id}/cart/items/{productId}` | Remove a cart line |
| `POST` | `/api/customers/{id}/checkout` | Place order (atomic transaction) |
| `GET` | `/api/customers/{id}/orders` | List a customer's orders |
| `GET` | `/api/orders/{orderId}` | Get order and saved line item details |
| `GET` | `/api/jdbc-demo/traditional-search?search=lamp` | Same style of search using manual JDBC |
| `PATCH` | `/api/jdbc-demo/traditional-stock` | Manual JDBC stock update with `{ "productId": 1, "stock": 12 }` and explicit commit/rollback |
| `GET` | `/api/jdbc-demo/spring-count` | Product count using JdbcTemplate |

Example product body:

```json
{ "name": "Desk Lamp", "description": "LED study lamp", "price": 899.00, "stock": 12 }
```

## Database overview

- `products`: current name, description, current price and available stock.
- `customers`: customer contact data; email is unique.
- `carts`: one cart per customer.
- `cart_items`: one row per product in a cart; `(cart_id, product_id)` is unique.
- `orders`: customer, subtotal, discount percentage and amount, total, status and timestamp.
- `order_items`: order lines with a copied `product_name` and `unit_price`. These preserve what the customer bought even if the current product price or name later changes. The product foreign key also retains referential integrity.

Prices and totals use `DECIMAL`; IDs are generated primary keys; foreign keys connect each dependent record to its owner.

## Java OOP and JDBC viva guide

- **Classes/objects and encapsulation:** `Product`, `Customer`, `Cart`, `CartItem`, `Order`, and `OrderItem` hold state in private fields and expose getters. `CustomerRequest` and `ProductRequest` are small validated request records.
- **Inheritance and overriding:** `Customer` extends the abstract `Person` base class and overrides `getRole()`.
- **Interface and polymorphism:** checkout uses the `DiscountPolicy` interface, instantiated with `PercentageDiscountPolicy`; a different policy can be substituted without changing the checkout steps.
- **Constructors and overloads:** `Product` has a full constructor and a shorter name/price constructor. Services and controllers use constructors for dependency injection.
- **Static/final:** `ShopApplication.main` is static; IDs/model state references and the `CUSTOMER_ID` demo constant are final; constants are not used to hold mutable shared application state.
- **Collections and exceptions:** repository results and cart/order lines use `List`; domain errors are handled centrally by `ApiExceptionHandler` and mapped to suitable HTTP responses.
- **Packages and access:** code is separated into `controller`, `service`, `repository`, `model`, `exception`, and `jdbc`. Classes use package-level or public visibility based on whether Spring or another package needs them.
- **Spring JDBC:** repositories use `JdbcTemplate` with parameter placeholders, `RowMapper`, `query()`, `queryForObject()`, and `update()`. `OrderService.checkout()` uses `@Transactional`.
- **Traditional JDBC:** `TraditionalJdbcDemo` uses `DataSource`, `Connection`, `PreparedStatement`, `ResultSet`, and nested try-with-resources to search product names. The search endpoint provides a direct comparison with `ProductRepository.search()`.

### Traditional JDBC vs Spring JDBC

Traditional JDBC makes the connection, statement, result iteration, resource cleanup and SQL exception handling visible. Spring JDBC still uses JDBC underneath, but `JdbcTemplate` handles connection/resource management and translates SQL exceptions; a `RowMapper` makes the result-to-object step explicit. `TraditionalJdbcDemo` includes both an equivalent product search and a stock update that manually disables auto-commit, commits on success, and rolls back on failure. The regular stock API and checkout use JdbcTemplate and Spring's JDBC transaction manager.

## Suggested demonstration test cases

| Case | Steps | Expected result |
|---|---|---|
| Product search | Search `lamp` in the shop or call `/api/products?search=lamp` | Matching name appears; search ignores case according to MySQL collation |
| Add and change cart | Add a product, increment quantity, then remove it | Cart rows and subtotal update; removed line disappears |
| Successful checkout | Add an in-stock product and place order | Order appears in history, includes discount and saved line price, cart empties, stock decreases by purchased quantity |
| Insufficient stock | Add more units than currently available, then attempt checkout | HTTP 400 error; transaction leaves stock, cart and order history unchanged |
| Stock race safety | With two browser sessions, attempt to buy the last unit at once | Product rows are locked during checkout; only the checkout that can satisfy stock commits |
| Traditional vs Spring search | Call `/api/jdbc-demo/traditional-search?search=book` and compare `/api/products?search=book` | Same matching names, two JDBC styles |
| Customer validation | Register invalid email or repeat the demo email | Invalid body returns 400; unique email conflict returns 409 |

## Tests and verification status

- Unit tests cover discount calculation and edge cases under `src/test/java/edu/college/shop/model/PercentageDiscountPolicyTest.java`.
- Run all project tests with `./mvnw test` (or `mvn test`).
- Compile and build runnable package with `./mvnw clean package`.
