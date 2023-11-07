 const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(bodyParser.json());

// const pool = new Pool({
//   host: process.env.PGHOST,
//   user: process.env.PGUSER,
//   password: process.env.PGPASSWORD,
//   database: process.env.PGDATABASE,
//   port: process.env.PGPORT,
// });

const pool = new Pool({
  
})

const secretKey = process.env.SECRET_KEY;

pool.connect((err) => {
  if (err) {
    console.error("PostgreSQL connection error:", err);
  } else {
    console.log("Connected to PostgreSQL database");
  }
});

app.get("/", (req, res) => {
  res.send("Server is running!");
});

app.post("/register", (req, res) => {
  const { firstname, lastname, username, password, confirmPassword, role } =
    req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  const userRole = role || "Employee";

  const sql =
    "INSERT INTO users (firstname, lastname, username, password, role) VALUES ($1, $2, $3, $4, $5)";
  pool.query(
    sql,
    [firstname, lastname, username, password, userRole],
    (err, result) => {
      if (err) {
        console.error("PostgreSQL query error:", err);
        return res.status(500).json({ message: "Internal server error" });
      } else {
        console.log("User registered:", result);
        return res.status(200).json({ message: "Registration successful" });
      }
    }
  );
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const query = "SELECT * FROM users WHERE username = $1 AND password = $2";

  pool.query(query, [username, password], (err, result) => {
    if (err) {
      console.error("PostgreSQL query error:", err);
      res.status(500).json({ message: "Internal server error" });
    } else {
      if (result.rows.length > 0) {
        const user = {
          username: result.rows[0].username,
          firstname: result.rows[0].firstname,
          lastname: result.rows[0].lastname,
          role: result.rows[0].role,
        };
        const token = jwt.sign(user, secretKey, { expiresIn: "24h" });

        res
          .status(200)
          .json({ message: "Login successful", token, role: user.role });
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    }
  });
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Failed to authenticate token" });
    }

    req.user = decoded;

    next();
  });
};

app.use(authenticateToken);

const allowRoles = (allowedRoles) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user || !user.role) {
      return res.status(403).json({ message: "Access denied" });
    }

    const role = user.role;
    if (allowedRoles.includes(role)) {
      next();
    } else {
      return res.status(403).json({ message: "Access denied" });
    }
  };
};

app.get("/protected-route", allowRoles(["Cashier"]), (req, res) => {
  const userId = req.user.id;

  res.json({ message: "Access granted to protected route", userId });
});

app.get("/transactions", (req, res) => {
  const sql = `
    SELECT
      t.id_transactions,
      t.name AS transaction_name,
      t.name_service AS transaction_name_service,
      t.price_service,
      t.quantity,
      t.issued_transactions,
      t.total_transactions,
      c.name AS customer_name,
      c.email AS customer_email,
      c.phone AS customer_phone,
      s.id_service,
      u.firstname AS user_firstname,
      u.lastname AS user_lastname
    FROM transactions t
    LEFT JOIN customers c ON t.id_customers = c.id_customers
    LEFT JOIN services s ON t.name_service = s.name_service
    LEFT JOIN users u ON t.id_users = u.id_users
  `;

  pool.query(sql, (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      res
        .status(500)
        .json({ error: "Internal Server Error", details: err.message });
    } else {
      const transactions = results.rows.map((row) => ({
        id_transactions: row.id_transactions,
        transaction_name: row.transaction_name,
        transaction_name_service: row.transaction_name_service,
        price_service: row.price_service,
        quantity: row.quantity,
        issued_transactions: row.issued_transactions,
        total_transactions: row.total_transactions,
        customer_name: row.customer_name,
        customer_email: row.customer_email,
        customer_phone: row.customer_phone,
        id_service: row.id_service,
        user_firstname: row.user_firstname,
        user_lastname: row.user_lastname,
      }));
      // console.log("Fetched data:", transactions);
      res.json(transactions);
    }
  });
});

app.post("/add-transaction", (req, res) => {
  const {
    name,
    name_service,
    price_service,
    quantity,
    total_transactions,
    issued_transactions,
    id_customers,
    id_users,
  } = req.body;

  if (
    name &&
    total_transactions &&
    issued_transactions &&
    id_customers &&
    name_service &&
    quantity
  ) {
    const nameServiceValue = Array.isArray(name_service)
      ? name_service.join("\n")
      : name_service;
    const priceServiceValue = Array.isArray(price_service)
      ? price_service.join("\n")
      : price_service;
    const quantityValue = Array.isArray(quantity) ? quantity : [quantity];

    if (quantityValue.some((qty) => qty <= 0)) {
      return res.status(400).json({ error: "Quantity must be greater than 0" });
    }

    pool.query("BEGIN", (err) => {
      if (err) {
        console.error("Error starting transaction:", err);
        return res
          .status(500)
          .json({ error: "Internal Server Error", details: err.message });
      }

      const checkProductQuery = `
        SELECT p.quantity_product
        FROM Products p
        JOIN ServiceProducts sp ON p.id_product = sp.product_id
        JOIN services s ON sp.service_id = s.id_service
        WHERE s.name_service = &#36;1
      `;

      Promise.all(
        name_service.map((serviceName) => {
          return new Promise((resolve, reject) => {
            pool.query(
              checkProductQuery,
              [serviceName],
              (err, productResult) => {
                if (err) {
                  reject(err);
                } else {
                  const productQuantity =
                    productResult.rows[0].quantity_product;
                  resolve(productQuantity);
                }
              }
            );
          });
        })
      )
        .then((productQuantities) => {
          if (productQuantities.some((qty) => qty <= 0)) {
            return pool.query("ROLLBACK", () => {
              res.status(400).json({
                error: "Please contact Admin to update product stock.",
              });
            });
          }

          const transactionInsertQuery = `
            INSERT INTO transactions (name, name_service, price_service, quantity, total_transactions, issued_transactions, id_customers, id_users)
            VALUES (&#36;1, &#36;2, &#36;3, &#36;4, &#36;5, &#36;6, &#36;7, &#36;8)
          `;
          pool.query(
            transactionInsertQuery,
            [
              name,
              nameServiceValue,
              priceServiceValue,
              quantityValue.join("\n"),
              total_transactions,
              issued_transactions,
              id_customers,
              id_users,
            ],
            (err, result) => {
              if (err) {
                console.error("Error adding transaction:", err);
                return pool.query("ROLLBACK", () => {
                  res.status(500).json({
                    error: "Internal Server Error",
                    details: err.message,
                  });
                });
              }

              for (let i = 0; i < name_service.length; i++) {
                const serviceName = name_service[i];
                const serviceQuantity = quantity[i];

                const productUpdateQuery = `
                  UPDATE Products
                  SET quantity_product = CASE
                    WHEN quantity_product - &#36;1 < -1 THEN -1  -- Set it to -1 to avoid going below -1
                    ELSE quantity_product - &#36;2
                    END
                  WHERE id_product IN (
                    SELECT product_id FROM ServiceProducts WHERE service_id = (
                      SELECT id_service FROM services WHERE name_service = &#36;3
                    )
                  )
                `;
                pool.query(
                  productUpdateQuery,
                  [serviceQuantity, serviceQuantity, serviceName],
                  (err, updateResult) => {
                    if (err) {
                      console.error("Error updating product quantity:", err);
                      return pool.query("ROLLBACK", () => {
                        res.status(500).json({
                          error: "Internal Server Error",
                          details: err.message,
                        });
                      });
                    }
                  }
                );
              }

              pool.query("COMMIT", (err) => {
                if (err) {
                  console.error("Error committing transaction:", err);
                  return pool.query("ROLLBACK", () => {
                    res.status(500).json({
                      error: "Internal Server Error",
                      details: err.message,
                    });
                  });
                }
                res
                  .status(200)
                  .json({ message: "Transaction added successfully" });
              });
            }
          );
        })
        .catch((err) => {
          console.error("Error checking product quantity:", err);
          return pool.query("ROLLBACK", () => {
            res
              .status(500)
              .json({ error: "Internal Server Error", details: err.message });
          });
        });
    });
  } else {
    res.status(400).json({ error: "Missing required fields" });
  }
});

app.get("/transactions/details/:id", (req, res) => {
  const id = parseInt(req.params.id);

  pool.query(
    "SELECT t.id_transactions, t.name, t.name_service, t.price_service, t.quantity, t.issued_transactions, t.total_transactions, t.id_customers, t.id_users, " +
      "c.name AS customer_name, c.email AS customer_email, c.phone AS customer_phone, " +
      "s.name_service AS service_name, " +
      "u.firstname AS user_firstname, u.lastname AS user_lastname " +
      "FROM transactions t " +
      "JOIN customers c ON t.id_customers = c.id_customers " +
      "LEFT JOIN services s ON t.name_service = s.name_service " +
      "LEFT JOIN users u ON t.id_users = u.id_users " +
      "WHERE t.id_transactions = $1",
    [id],
    (queryError, results) => {
      if (queryError) {
        console.error("Error fetching transaction details:", queryError);
        res.status(500).json({
          error: "Internal server error",
          details: queryError.message,
        });
      } else if (results.rows.length > 0) {
        res.json(results.rows[0]);
      } else {
        console.error("Transaction not found for id: ", id);
        res.status(404).json({ error: "Transaction not found" });
      }
    }
  );
});

app.put("/edit-transaction/:id", allowRoles(["Admin"]), (req, res) => {
  const id = parseInt(req.params.id);
  const {
    name,
    name_service,
    price_service,
    quantity,
    total_transactions,
    issued_transactions,
    id_customers,
    id_users,
  } = req.body;

  if (
    name &&
    total_transactions &&
    issued_transactions &&
    id_customers &&
    name_service
  ) {
    const nameServiceValue = Array.isArray(name_service)
      ? name_service.join("\n")
      : name_service;
    const priceServiceValue = Array.isArray(price_service)
      ? price_service.join("\n")
      : price_service;
    const quantityValue = Array.isArray(quantity)
      ? quantity.join("\n")
      : quantity;

    const sql = `
      UPDATE transactions 
      SET 
        name = &#36;1,
        name_service = &#36;2,
        price_service = &#36;3,
        quantity = &#36;4,
        total_transactions = &#36;5,
        issued_transactions = &#36;6,
        id_customers = &#36;7,
        id_users = &#36;8
      WHERE id_transactions = &#36;9
    `;

    pool.query(
      sql,
      [
        name,
        nameServiceValue,
        priceServiceValue,
        quantityValue,
        total_transactions,
        issued_transactions,
        id_customers,
        id_users,
        id,
      ],
      (err, result) => {
        if (err) {
          console.error("Error editing transaction:", err);
          res
            .status(500)
            .json({ error: "Internal Server Error", details: err.message });
        } else if (result.rowCount > 0) {
          res.status(200).json({ message: "Transaction updated successfully" });
        } else {
          res.status(404).json({ error: "Transaction not found" });
        }
      }
    );
  } else {
    res.status(400).json({ error: "Missing required fields" });
  }
});

app.delete("/delete-transaction/:id", allowRoles(["Admin"]), (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM transactions WHERE id_transactions = &#36;1";
  pool.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error deleting transaction:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      if (result.rowCount > 0) {
        res.status(200).json({ message: "Transaction deleted successfully" });
      } else {
        res.status(404).json({ error: "Transaction not found" });
      }
    }
  });
});

app.get("/customers", (req, res) => {
  const sql = "SELECT id_customers, name, email, phone FROM customers";
  pool.query(sql, (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.json(results.rows);
    }
  });
});

app.post("/add-customer", (req, res) => {
  const { name, email, phone } = req.body;

  const checkExistingCustomerSql =
    "SELECT * FROM customers WHERE name = &#36;1 OR email = &#36;2 OR phone = &#36;3";
  pool.query(checkExistingCustomerSql, [name, email, phone], (err, result) => {
    if (err) {
      console.error("Error checking existing customer:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      if (result.rows && result.rows.length > 0) {
        res.status(400).json({
          error: "Customer with the same name, email, or phone already exists",
        });
      } else {
        const insertCustomerSql =
          "INSERT INTO customers (name, email, phone) VALUES ($1, $2, $3)";
        pool.query(insertCustomerSql, [name, email, phone], (err, result) => {
          if (err) {
            console.error("Error adding customer:", err);
            res.status(500).json({ error: "Internal Server Error" });
          } else {
            res.status(200).json({ message: "Customer added successfully" });
          }
        });
      }
    }
  });
});

app.put("/edit-customer/:id", allowRoles(["Admin"]), (req, res) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;

  const sql =
    "UPDATE customers SET name = $1, email = $2, phone = $3 WHERE id_customers = $4";
  pool.query(sql, [name, email, phone, id], (err, result) => {
    if (err) {
      console.error("Error editing customer:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      if (result.rowCount > 0) {
        res.status(200).json({ message: "Customer updated successfully" });
      } else {
        res.status(404).json({ error: "Customer not found" });
      }
    }
  });
});

app.delete("/delete-customer/:id", allowRoles(["Admin"]), (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM customers WHERE id_customers = $1";
  pool.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error deleting customer:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      if (result.rowCount > 0) {
        res.status(200).json({ message: "Customer deleted successfully" });
      } else {
        res.status(404).json({ error: "Customer not found" });
      }
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
