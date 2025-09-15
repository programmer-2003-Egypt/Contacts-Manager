const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Post = require("./models/Posts"); // Make sure it's Posts.js (no .mjs)


dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// === Middleware ===
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads")); // Serve media files

// === Multer config ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});
const upload = multer({ storage });

// === MongoDB ===
mongoose
  .connect("mongodb://localhost:27017/blog")
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// === Routes ===

// Get all posts
app.get("/api/posts", async (req, res) => {
  const posts = await Post.find().sort({ _id: -1 });
  res.json(posts);
});

// Get one post
app.get("/api/posts/:id", async (req, res) => {
  const post = await Post.findById(req.params.id);
  res.json(post);
});

// Create new post
app.post("/api/posts", upload.single("file"), async (req, res) => {
  const { title, content } = req.body;
  const media = req.file?.filename || null;
  const post = new Post({ title, content, media });
  await post.save();
  res.json({ message: "Post created", post });
});

// Update post
app.put("/api/posts/:id", upload.single("file"), async (req, res) => {
  const { title, content } = req.body;
  const media = req.file?.filename;
  const existing = await Post.findById(req.params.id);

  if (media && existing.media) {
    // Delete old file
    fs.unlinkSync(`uploads/${existing.media}`);
  }

  existing.title = title;
  existing.content = content;
  if (media) existing.media = media;

  await existing.save();
  res.json({ message: "Post updated", post: existing });
});

// Delete post
app.delete("/api/posts/:id", async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (post.media) fs.unlinkSync(`uploads/${post.media}`);
  await Post.findByIdAndDelete(req.params.id);
  res.json({ message: "Post deleted" });
});

// === Start server ===
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
