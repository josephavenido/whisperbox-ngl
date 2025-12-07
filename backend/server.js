// backend/server.js

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config(); // reads .env

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_only_for_local";

// Middleware to protect routes (requires valid JWT)
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";

  // Expecting header: Authorization: Bearer <token>
  const [, token] = authHeader.split(" ");

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error("❌ JWT error in requireAuth:", err);
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // decoded contains { id, username, iat, exp }
    req.user = decoded;
    next();
  });
}


const app = express();

app.use(cors());
app.use(express.json());

// 🔐 MySQL connection (we'll create this DB in Workbench)
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "2005",
  database: process.env.DB_NAME || "ngl_clone_db",
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error("❌ Error connecting to MySQL:", err);
  } else {
    console.log("✅ Connected to MySQL");
  }
});

// ================== AUTH ROUTES ================== //

// Register new user
app.post("/auth/register", async (req, res) => {
  const { username, email, password } = req.body;

  // 1) Basic validation
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  // Optional: limit length a bit
  if (username.length > 50) {
    return res.status(400).json({ error: "Username too long" });
  }

  try {
    // 2) Create a slug based on username (for URL like /u/username)
    const slug = username
      .toLowerCase()
      .replace(/\s+/g, "") // remove spaces
      .replace(/[^a-z0-9]/g, "") // keep only letters & numbers
      .slice(0, 30); // max length 30

    // 3) Hash the password
    const password_hash = await bcrypt.hash(password, 10);

    // 4) Insert into DB
    const sql =
      "INSERT INTO users (username, email, password_hash, slug) VALUES (?, ?, ?, ?)";

    db.query(sql, [username, email || null, password_hash, slug], (err, result) => {
      if (err) {
        console.error("❌ Error creating user:", err);

        // Handle unique constraint errors (username or email taken)
        if (err.code === "ER_DUP_ENTRY") {
          return res
            .status(409)
            .json({ error: "Username or email already exists" });
        }

        return res.status(500).json({ error: "Database error" });
      }

      // 5) Success: return basic user info (no password)
      return res.status(201).json({
        id: result.insertId,
        username,
        slug,
      });
    });
  } catch (err) {
    console.error("❌ Error in /auth/register:", err);
    return res.status(500).json({ error: "Server error" });
  }
});


// Login existing user
app.post("/auth/login", (req, res) => {
  const { username, password } = req.body;

  // 1) Basic validation
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  // 2) Find user by username
  const sql = "SELECT * FROM users WHERE username = ?";

  db.query(sql, [username], async (err, results) => {
    if (err) {
      console.error("❌ Error finding user in /auth/login:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      // No such user
      return res.status(400).json({ error: "Invalid username or password" });
    }

    const user = results[0];

    try {
      // 3) Compare password with stored hash
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return res.status(400).json({ error: "Invalid username or password" });
      }

      // 4) Create a JWT token
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
        },
        JWT_SECRET,
        { expiresIn: "7d" } // valid for 7 days
      );

      // 5) Respond with token + basic user info
      return res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          slug: user.slug,
        },
      });
    } catch (err2) {
      console.error("❌ Error in /auth/login:", err2);
      return res.status(500).json({ error: "Server error" });
    }
  });
});

// ================== PUBLIC USER MESSAGES (BY SLUG) ================== //

// Get all messages for a given user (by slug)
// Example: GET /user/domm/messages
app.get("/user/:slug/messages", (req, res) => {
  const { slug } = req.params;

  // 1) Find the user by slug
  const findUserSql =
    "SELECT id, username, slug FROM users WHERE slug = ?";

  db.query(findUserSql, [slug], (err, users) => {
    if (err) {
      console.error("❌ Error finding user in /user/:slug/messages:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (users.length === 0) {
      // No user with that slug
      return res.status(404).json({ error: "User not found" });
    }

    const user = users[0];

    // 2) Fetch that user's messages
    const findMessagesSql =
      "SELECT id, text, created_at FROM messages WHERE user_id = ? ORDER BY created_at DESC";

    db.query(findMessagesSql, [user.id], (err2, messages) => {
      if (err2) {
        console.error("❌ Error fetching messages:", err2);
        return res.status(500).json({ error: "Database error" });
      }

      // 3) Return user info + messages
      return res.json({
        user: {
          id: user.id,
          username: user.username,
          slug: user.slug,
        },
        messages,
      });
    });
  });
});

// Send a new anonymous message to a user (by slug)
// Example: POST /user/domm/messages  { "text": "hi domm" }
app.post("/user/:slug/messages", (req, res) => {
  const { slug } = req.params;
  const { text } = req.body;

  // 1) Validate message
  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Message text is required" });
  }

  if (text.length > 500) {
    return res.status(400).json({ error: "Message too long (max 500 chars)" });
  }

  // 2) Find user by slug
  const findUserSql = "SELECT id FROM users WHERE slug = ?";

  db.query(findUserSql, [slug], (err, users) => {
    if (err) {
      console.error("❌ Error finding user in POST /user/:slug/messages:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userId = users[0].id;

    // 3) Insert the new message
    const insertSql =
      "INSERT INTO messages (user_id, text, created_at) VALUES (?, ?, NOW())";

    db.query(insertSql, [userId, text], (err2, result) => {
      if (err2) {
        console.error("❌ Error inserting message:", err2);
        return res.status(500).json({ error: "Database error" });
      }

      return res.status(201).json({
        id: result.insertId,
        user_id: userId,
        text,
      });
    });
  });
});

// ================== PROTECTED: LOGGED-IN USER MESSAGES ================== //

// Get messages for the currently logged-in user
// Requires: Authorization: Bearer <token> header
app.get("/me/messages", requireAuth, (req, res) => {
  const userId = req.user.id;

  const sql =
    "SELECT id, text, created_at FROM messages WHERE user_id = ? ORDER BY created_at DESC";

  db.query(sql, [userId], (err, rows) => {
    if (err) {
      console.error("❌ Error in /me/messages:", err);
      return res.status(500).json({ error: "Database error" });
    }

    return res.json({
      user: {
        id: userId,
        username: req.user.username,
      },
      messages: rows,
    });
  });
});


// Simple test route
app.get("/", (req, res) => {
  res.json({ status: "NGL-style backend running" });
});

// Later we'll add:
// - /auth/register
// - /auth/login
// - /user/:slug/messages (GET/POST)

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
