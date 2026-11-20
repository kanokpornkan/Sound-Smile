// server.js (ESM)
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import fs from "fs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Server } from "socket.io";
import http from "http";
import cron from "node-cron";
import RedeemCode from "./models/RedeemCode.js";
import { swaggerServe, swaggerSetup } from "./swagger.js";

dotenv.config();
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ================= Middleware =================
app.use("/api-docs", swaggerServe, swaggerSetup);

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================= MongoDB =================
if (process.env.MONGO_URL) {
  mongoose
    .connect(process.env.MONGO_URL)
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("❌ MongoDB error:", err));
} else {
  console.error("❌ Missing MONGO_URL in backend/.env — upload API will return 503");
}

// ================= Models =================
const notificationSchema = new mongoose.Schema({
  type: { type: String, enum: ["upload", "download"], required: true },
  message: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  song: { type: mongoose.Schema.Types.ObjectId, ref: "Song" },
  createdAt: { type: Date, default: Date.now },
});
const Notification = mongoose.model("Notification", notificationSchema);

const userSchema = new mongoose.Schema(
  {
    username: String,
    email: String,
    password: String,
    googleId: String,
    picture: String,
    avatar: String,
    bio: String,
    // ✅ Social Media
    tiktok: { type: String, default: "", trim: true },
    instagram: { type: String, default: "", trim: true },
    facebook: { type: String, default: "", trim: true },
    // ฟิลด์เดิม
    downloadCount: { type: Number, default: 0 },
    uploadCount: { type: Number, default: 0 },
    maxUpload: { type: Number, default: 3 },
    maxDownload: { type: Number, default: 5 },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    lastActivity: { type: Date, default: Date.now },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Song" }],
    plan: { type: String, default: "FREE" }, // FREE, SOCOZY, SUPERCOZY, COZIEST
    planStart: { type: Date, default: null }, // วันเริ่มแพ็คเกจ
    planExpire: { type: Date, default: null }, // วันหมดอายุแพ็คเกจ
  },
  { timestamps: true } // ✅ เพิ่ม timestamps
);
const User = mongoose.model("User", userSchema);

const songSchema = new mongoose.Schema({
  title: String,
  artist: String,
  description: String,
  bpm: Number,
  key: String,
  mode: String,
  type: String,
  subtype: String,
  tags: [String],
  soundType: String,
  filePath: String,
  // ภาพปกเพลง (ไม่บังคับ; เพลงเดิมที่ไม่มีภาพยังใช้งานได้)
  coverPath: { type: String, default: "" },
  likes: { type: Number, default: 0 },
  downloads: { type: Number, default: 0 },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});
const Song = mongoose.model("Song", songSchema);

// ================= JWT Middleware =================
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });

  jwt.verify(token, process.env.JWT_SECRET || "secret", (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.userId = decoded.id;
    next();
  });
};

const isAdmin = async (req, res, next) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.role !== "admin")
    return res.status(403).json({ message: "Admin only" });
  next();
};

// ================= สร้างโฟลเดอร์ =================
const uploadsDir = path.join(__dirname, "uploads/music");
const avatarsDir = path.join(__dirname, "uploads/avatars");
const coversDir = path.join(__dirname, "uploads/covers");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("✅ Created music directory");
}

if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
  console.log("✅ Created avatars directory");
}

// สร้างโฟลเดอร์เก็บภาพปก โดยไม่แตะโฟลเดอร์เพลงและ Avatar เดิม
fs.mkdirSync(coversDir, { recursive: true });

// ================= Multer Config for Music =================
const musicStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const musicUpload = multer({ storage: musicStorage });

// ================= Multer Config for Song + Cover =================
// ตัวรับไฟล์นี้ใช้เฉพาะ POST /api/upload;
// musicUpload และ avatarUpload เดิมยังคงใช้งานเหมือนเดิม
const allowedAudioExtensions = new Set([
  ".mp3", ".wav", ".ogg", ".m4a", ".flac", ".aac", ".webm",
]);
const allowedImageMimeTypes = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

const songCoverStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, file.fieldname === "cover" ? coversDir : uploadsDir);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${extension}`);
  },
});

const songCoverUpload = multer({
  storage: songCoverStorage,
  // Multer ใช้เพดานต่อไฟล์; จำกัดภาพปก 5 MB เพิ่มเติมด้านล่าง
  limits: { fileSize: 50 * 1024 * 1024, files: 2, fields: 30 },
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const mime = (file.mimetype || "").toLowerCase();

    if (file.fieldname === "cover") {
      const correctMime = allowedImageMimeTypes[extension];
      if (correctMime && mime === correctMime) return cb(null, true);
      return cb(new Error("ไฟล์ภาพต้องเป็น JPG, PNG, WEBP หรือ GIF"));
    }

    if (file.fieldname === "music") {
      const correctExt = allowedAudioExtensions.has(extension);
      const correctMime =
        !mime ||
        mime.startsWith("audio/") ||
        mime === "application/ogg" ||
        mime === "application/octet-stream" ||
        (extension === ".webm" && mime === "video/webm");
      if (correctExt && correctMime) return cb(null, true);
      return cb(new Error("ไฟล์เพลงต้องเป็น MP3, WAV, OGG, M4A, FLAC, AAC หรือ WEBM"));
    }

    cb(new Error("ชื่อฟิลด์ไฟล์ไม่ถูกต้อง (ใช้ music และ cover)"));
  },
}).fields([
  { name: "music", maxCount: 1 },
  { name: "cover", maxCount: 1 },
]);

const removeSongUploadFiles = async (req) => {
  const files = Object.values(req.files || {}).flat();
  await Promise.all(
    files.map((file) => fs.promises.unlink(file.path).catch(() => {}))
  );
};

const parseSongUploadFiles = (req, res, next) => {
  songCoverUpload(req, res, async (err) => {
    if (!err) return next();
    await removeSongUploadFiles(req);
    console.error("❌ Upload parser error:", err);
    const fileTooLarge = err.code === "LIMIT_FILE_SIZE";
    res.status(fileTooLarge ? 413 : 400).json({
      message: fileTooLarge
        ? "ไฟล์มีขนาดเกิน 50 MB (ภาพปกไม่เกิน 5 MB)"
        : err.message || "ไม่สามารถอ่านไฟล์ที่อัปโหลดได้",
    });
  });
};

// ================= Multer Config for Avatar =================
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarsDir),
  filename: (req, file, cb) => {
    const uniqueName = `avatar-${
      req.userId || Date.now()
    }-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("รองรับเฉพาะไฟล์รูปภาพเท่านั้น (jpeg, jpg, png, gif, webp)"));
  },
});

// ================= Auth Routes =================
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (await User.findOne({ email }))
      return res.status(400).json({ message: "Email already registered" });

    const hash = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username, email, password: hash });
    res.json({ message: "Register success", user: newUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    if (!(await bcrypt.compare(password, user.password)))
      return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );
    res.json({ message: "Login success", token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= User Routes =================
app.get("/auth/user", async (req, res) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= Google OAuth =================
app.use(
  session({
    secret: process.env.JWT_SECRET || "mySecretKey",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

const hasGoogleOAuth = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);

if (hasGoogleOAuth) {
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = await User.create({
            username: profile.displayName,
            email: profile.emails?.[0]?.value,
            googleId: profile.id,
            picture: profile.photos?.[0]?.value,
            downloadCount: 0,
            uploadCount: 0,
            maxUpload: 3,
            maxDownload: 5,
            role: "user",
            lastActivity: new Date(),
          });
        }
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);
} else {
  console.warn("⚠️ Google OAuth disabled: GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET missing");
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) =>
  done(null, await User.findById(id))
);

app.get(
  "/auth/google",
  (req, res, next) => {
    if (!hasGoogleOAuth) return res.status(503).json({ message: "Google OAuth is not configured" });
    next();
  },
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  (req, res, next) => {
    if (!hasGoogleOAuth) return res.status(503).json({ message: "Google OAuth is not configured" });
    next();
  },
  passport.authenticate("google", { session: false, failureRedirect: "/" }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user._id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );
    res.redirect(`http://localhost:5173/?token=${token}`);
  }
);

// ================= Song Upload =================
// ตรวจสิทธิ์ก่อนรับไฟล์เข้าดิสก์ ลดปัญหาไฟล์ค้างจากผู้ใช้ที่ไม่มีสิทธิ์
const authorizeSongUpload = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message: "MongoDB ยังไม่เชื่อมต่อ กรุณาตรวจสอบ MONGO_URL ใน backend/.env",
      });
    }
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "user" && user.uploadCount >= user.maxUpload)
      return res.status(403).json({ message: "Upload limit reached" });

    req.uploadUser = user;
    next();
  } catch (err) {
    console.error("❌ Upload authorization error:", err);
    res.status(500).json({ message: err.message });
  }
};

app.post(
  "/api/upload",
  verifyToken,
  authorizeSongUpload,
  parseSongUploadFiles,
  async (req, res) => {
    let song = null;
    try {
      const musicFile = req.files?.music?.[0];
      const coverFile = req.files?.cover?.[0];
      if (!musicFile) {
        await removeSongUploadFiles(req);
        return res.status(400).json({ message: "No music file uploaded (music)" });
      }
      if (coverFile && coverFile.size > 5 * 1024 * 1024) {
        await removeSongUploadFiles(req);
        return res.status(413).json({ message: "ภาพปกต้องไม่เกิน 5 MB" });
      }

      const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
      const artist = typeof req.body.artist === "string" ? req.body.artist.trim() : "";
      if (!title || !artist) {
        await removeSongUploadFiles(req);
        return res.status(400).json({ message: "กรุณากรอกชื่อเพลงและชื่อศิลปิน" });
      }

      let tags = [];
      try {
        tags = typeof req.body.tags === "string"
          ? JSON.parse(req.body.tags)
          : Array.isArray(req.body.tags) ? req.body.tags : [];
      } catch {
        await removeSongUploadFiles(req);
        return res.status(400).json({ message: "แท็กไม่ใช่ JSON ที่ถูกต้อง" });
      }
      if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== "string")) {
        await removeSongUploadFiles(req);
        return res.status(400).json({ message: "tags ต้องเป็นรายการข้อความ" });
      }

      song = await Song.create({
        title,
        artist,
        description: req.body.description || "",
        bpm: Number(req.body.bpm) || 0,
        key: req.body.key || "",
        mode: req.body.mode || "",
        type: req.body.type || "",
        subtype: req.body.subtype || "",
        tags,
        soundType: req.body.soundType || "",
        filePath: `uploads/music/${musicFile.filename}`,
        coverPath: coverFile ? `uploads/covers/${coverFile.filename}` : "",
        user: req.userId,
      });

      req.uploadUser.uploadCount += 1;
      await req.uploadUser.save();

      // คงการแจ้งเตือน Socket.IO ของเดิมไว้
      io.emit("notification", {
        type: "upload",
        message: `${req.uploadUser.username} uploaded ${song.title}`,
        user: req.uploadUser._id,
        song: song._id,
        createdAt: new Date(),
      });

      res.json({ message: "Upload success", song });
    } catch (err) {
      console.error("❌ Song upload error:", err);
      if (song) await Song.findByIdAndDelete(song._id).catch(() => {});
      await removeSongUploadFiles(req);
      res.status(500).json({ message: err.message });
    }
  }
);

// ================= Songs Routes =================
app.get("/api/songs", async (req, res) => {
  try {
    const songs = await Song.find().sort({ createdAt: -1 });
    res.json(songs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/songs/top-likes", async (req, res) => {
  try {
    const songs = await Song.find().sort({ likes: -1 }).limit(5);
    res.json(songs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/songs/top-downloads", async (req, res) => {
  try {
    const songs = await Song.find().sort({ downloads: -1 }).limit(5);
    res.json(songs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ แก้ไข endpoint นี้ให้ return ข้อมูลเพลงแทน
app.get("/api/songs/:id", async (req, res) => {
  try {
    const song = await Song.findById(req.params.id).populate("user", "username picture");
    
    if (!song) {
      return res.status(404).json({ message: "Song not found" });
    }
    
    res.json(song);
  } catch (err) {
    console.error("Fetch song error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ================= Tags =================
app.get("/api/tags", async (req, res) => {
  try {
    const tags = await Song.find().distinct("tags");
    res.json(tags.filter((t) => t && t.trim() !== ""));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= Search =================
app.get("/api/songs/search", async (req, res) => {
  try {
    const { q, tag } = req.query;
    let query = {};

    if (q) {
      query = {
        $or: [
          { title: { $regex: q, $options: "i" } },
          { artist: { $regex: q, $options: "i" } },
          { description: { $regex: q, $options: "i" } },
          { tags: { $regex: q, $options: "i" } },
        ],
      };
    }

    if (tag) {
      query = { tags: tag };
    }

    const songs = await Song.find(query);
    res.json(songs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= Favorites System =================
app.post("/api/songs/:id/favorite", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const songId = req.params.id;

    if (user.favorites?.includes(songId)) {
      return res.status(400).json({ message: "Already in favorites" });
    }

    await User.findByIdAndUpdate(req.userId, {
      $push: { favorites: songId },
    });

    await Song.findByIdAndUpdate(songId, {
      $inc: { likes: 1 },
    });

    res.json({ message: "Added to favorites" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete("/api/songs/:id/favorite", verifyToken, async (req, res) => {
  try {
    const songId = req.params.id;

    await User.findByIdAndUpdate(req.userId, {
      $pull: { favorites: songId },
    });

    await Song.findByIdAndUpdate(songId, {
      $inc: { likes: -1 },
    });

    res.json({ message: "Removed from favorites" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/user/:id/favorites", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate({
      path: "favorites",
      populate: { path: "user", select: "username picture" },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user.favorites || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= Download System =================
// ================= Recommendation API =================

app.get("/api/recommendations", async (req, res) => {
  try {
    let favoriteIds = [];
    let favoriteSongs = [];

    // 1. ตรวจสอบ Token ของผู้ใช้
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    // 2. ดึงเพลง Favorite ของผู้ใช้
    if (token) {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || "secret"
        );

        const user = await User.findById(decoded.id);

        if (user) {
          favoriteIds = (user.favorites || []).map(
            (id) => id.toString()
          );

          favoriteSongs = await Song.find({
            _id: { $in: favoriteIds },
          }).select("type subtype tags");
        }
      } catch (tokenError) {
        console.log("Recommendation: Guest user or invalid token");
      }
    }

    // 3. ดึงเพลงทั้งหมด ยกเว้นเพลงที่ Favorite แล้ว
    const allSongs = await Song.find({
      _id: { $nin: favoriteIds },
    }).lean();

    const normalize = (value) =>
      String(value || "").trim().toLowerCase();

    // 4. ถ้ายังไม่มีเพลง Favorite ให้แนะนำเพลงยอดนิยม
    if (favoriteSongs.length === 0) {
      const popularSongs = allSongs
        .sort((a, b) => {
          const scoreA =
            (Number(a.likes) || 0) * 2 +
            (Number(a.downloads) || 0);

          const scoreB =
            (Number(b.likes) || 0) * 2 +
            (Number(b.downloads) || 0);

          return scoreB - scoreA;
        })
        .slice(0, 8);

      return res.json(popularSongs);
    }

    // 5. วิเคราะห์ประเภทเพลงที่ผู้ใช้ชอบ
    const preferences = {
      types: new Map(),
      subtypes: new Map(),
      tags: new Map(),
    };

    favoriteSongs.forEach((song) => {
      const type = normalize(song.type);
      const subtype = normalize(song.subtype);

      if (type) {
        preferences.types.set(
          type,
          (preferences.types.get(type) || 0) + 1
        );
      }

      if (subtype) {
        preferences.subtypes.set(
          subtype,
          (preferences.subtypes.get(subtype) || 0) + 1
        );
      }

      (song.tags || []).forEach((tag) => {
        const normalizedTag = normalize(tag);

        if (normalizedTag) {
          preferences.tags.set(
            normalizedTag,
            (preferences.tags.get(normalizedTag) || 0) + 1
          );
        }
      });
    });

    // 6. คำนวณคะแนนเพลงที่เหมาะกับผู้ใช้
    const recommendedSongs = allSongs
      .map((song) => {
        let score = 0;

        const type = normalize(song.type);
        const subtype = normalize(song.subtype);

        // ประเภทเพลงตรงกัน +5 คะแนน
        score +=
          (preferences.types.get(type) || 0) * 5;

        // ประเภทย่อยตรงกัน +3 คะแนน
        score +=
          (preferences.subtypes.get(subtype) || 0) * 3;

        // Tags ตรงกัน +1 คะแนนต่อ Tag
        (song.tags || []).forEach((tag) => {
          score +=
            preferences.tags.get(normalize(tag)) || 0;
        });

        // คะแนนเสริมจากยอด Like และ Download
        score += (Number(song.likes) || 0) * 0.1;
        score += (Number(song.downloads) || 0) * 0.05;

        return {
          ...song,
          recommendationScore: score,
        };
      })
      .sort(
        (a, b) =>
          b.recommendationScore - a.recommendationScore
      )
      .slice(0, 8)
      .map(({ recommendationScore, ...song }) => song);

    // 7. ส่งเพลงแนะนำกลับไปยัง Frontend
    res.json(recommendedSongs);

  } catch (error) {
    console.error("Recommendation Error:", error);

    res.status(500).json({
      message: "ไม่สามารถแนะนำเพลงได้",
      error: error.message,
    });
  }
});
app.post("/api/songs/:id/download", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === "user" && user.downloadCount >= user.maxDownload)
      return res.status(403).json({ message: "Download limit reached" });

    const song = await Song.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloads: 1 } },
      { new: true }
    );

    if (!song) return res.status(404).json({ message: "Song not found" });

    user.downloadCount += 1;
    await user.save();

    const notification = await Notification.create({
      type: "download",
      message: `${user.username} downloaded ${song.title}`,
      user: user._id,
      song: song._id,
    });

    io.emit("notification", notification);

    res.json({
      message: "Download recorded successfully",
      song,
      notification,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/songs/:id/download-check", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const allowed = user.role === "admin" || user.downloadCount < user.maxDownload;

    if (!allowed) {
      return res.json({
        allowed: false,
        message: "คุณใช้สิทธิ์ดาวน์โหลดหมดแล้ว",
      });
    }

    res.json({ allowed: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/songs/:id/file", verifyToken, async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ message: "Song not found" });
    }

    const filePath = path.join(__dirname, song.filePath);

    if (!fs.existsSync(filePath)) {
      console.error("❌ File not found:", filePath);
      return res.status(404).json({
        message: "File not found on server",
        path: song.filePath,
      });
    }

    console.log("✅ Sending file:", filePath);

    res.download(filePath, `${song.title}.mp3`, (err) => {
      if (err) {
        console.error("❌ Download error:", err);
        if (!res.headersSent) {
          res.status(500).json({ message: "Error downloading file" });
        }
      }
    });
  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/users/download-quota", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const allowed =
      user.role === "admin" || user.downloadCount < user.maxDownload;

    res.json({
      allowed,
      current: user.downloadCount,
      max: user.maxDownload,
      remaining: Math.max(0, user.maxDownload - user.downloadCount),
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/user/:id/downloads", verifyToken, async (req, res) => {
  try {
    if (req.userId !== req.params.id) {
      return res
        .status(403)
        .json({ message: "Forbidden: You can only view your own downloads." });
    }

    const downloads = await Notification.find({
      user: req.params.id,
      type: "download",
    })
      .sort({ createdAt: -1 })
      .populate("song");

    res.json(downloads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/songs/:id/check", verifyToken, async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.json({ exists: false, message: "Song not found in DB" });
    }

    const filePath = path.join(__dirname, song.filePath);
    const fileExists = fs.existsSync(filePath);

    res.json({
      exists: fileExists,
      song: song.title,
      filePath: song.filePath,
      fullPath: filePath,
      message: fileExists ? "File exists ✅" : "File not found ❌",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= User Routes =================
app.get("/api/user/:id/uploads", async (req, res) => {
  try {
    const songs = await Song.find({ user: req.params.id }).sort({
      createdAt: -1,
    });
    res.json(songs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/user/:id/limits", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "uploadCount downloadCount maxUpload maxDownload"
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= Update User Profile =================
app.put(
  "/api/user/:id",
  verifyToken,
  avatarUpload.single("avatar"),
  async (req, res) => {
    try {
      console.log("📝 Update request received for user:", req.params.id);
      console.log("📋 Body:", req.body);
      console.log("📷 File:", req.file);

      if (req.userId !== req.params.id) {
        return res
          .status(403)
          .json({ message: "คุณไม่มีสิทธิ์แก้ไขโปรไฟล์นี้" });
      }

      const { username, email, bio, tiktok, instagram, facebook } = req.body;

      const updateData = {
        username,
        email,
        bio: bio || "",
        tiktok: tiktok || "",
        instagram: instagram || "",
        facebook: facebook || "",
      };

      if (req.file) {
        updateData.avatar = `http://localhost:5000/uploads/avatars/${req.file.filename}`;
        updateData.picture = updateData.avatar;
        console.log("📷 New avatar path:", updateData.avatar);

        const oldUser = await User.findById(req.params.id);
        if (oldUser.avatar && oldUser.avatar.includes("uploads/avatars")) {
          const oldPath = path.join(
            __dirname,
            oldUser.avatar.replace("http://localhost:5000/", "")
          );
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
            console.log("🗑️ Old avatar deleted");
          }
        }
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select("-password");

      if (!updatedUser) {
        return res.status(404).json({ message: "ไม่พบผู้ใช้" });
      }

      console.log("✅ Profile updated successfully:", updatedUser.username);
      console.log("🌐 Social Media updated:", {
        tiktok: updatedUser.tiktok,
        instagram: updatedUser.instagram,
        facebook: updatedUser.facebook,
      });

      res.json({
        message: "อัพเดทโปรไฟล์สำเร็จ",
        user: updatedUser,
      });
    } catch (err) {
      console.error("❌ Update profile error:", err);
      res.status(500).json({
        message: "เกิดข้อผิดพลาดในการอัพเดทโปรไฟล์",
        error: err.message,
      });
    }
  }
);

// ================= Notifications =================
app.get("/api/notifications", async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("user", "username picture")
      .populate("song", "title artist");
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/notifications", async (req, res) => {
  try {
    const { type, message, userId, songId } = req.body;
    const notif = await Notification.create({
      type,
      message,
      user: userId,
      song: songId,
    });

    io.emit("notification", notif);
    res.json(notif);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= Admin Routes =================
app.get("/api/admin/users", verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put("/api/admin/users/:id/role", verifyToken, isAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role))
      return res.status(400).json({ message: "Invalid role" });
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");
    res.json({ message: "Role updated", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= Static Files =================
app.use(
  "/uploads",
  (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    next();
  },
  express.static(path.join(__dirname, "uploads"))
);

// ================= Socket.IO =================
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174",
    ],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("✅ Socket connected:", socket.id);
  socket.on("disconnect", () =>
    console.log("❌ Socket disconnected:", socket.id)
  );
});

// ================= Admin Reset Quota =================
app.put(
  "/api/admin/users/:id/reset-quota",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });

      user.uploadCount = 0;
      user.downloadCount = 0;
      await user.save();

      res.json({ message: "Quota reset", user });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

app.delete("/api/admin/users/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= Admin Songs =================
app.get("/api/admin/songs", verifyToken, isAdmin, async (req, res) => {
  try {
    const songs = await Song.find().sort({ createdAt: -1 });
    res.json(songs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put(
  "/api/admin/songs/:id",
  verifyToken,
  isAdmin,
  musicUpload.single("music"),
  async (req, res) => {
    try {
      const song = await Song.findById(req.params.id);
      if (!song) return res.status(404).json({ message: "Song not found" });

      const fields = [
        "title",
        "artist",
        "description",
        "bpm",
        "key",
        "mode",
        "type",
        "subtype",
        "tags",
        "soundType",
      ];

      fields.forEach((field) => {
        if (req.body[field] !== undefined) {
          if (field === "tags" && typeof req.body[field] === "string") {
            try {
              song[field] = JSON.parse(req.body[field]);
            } catch {
              song[field] = req.body[field]
                .split(",")
                .map((t) => t.trim())
                .filter((t) => t);
            }
          } else if (field === "bpm") {
            song[field] = Number(req.body[field]);
          } else {
            song[field] = req.body[field];
          }
        }
      });

      if (req.file) {
        if (
          song.filePath &&
          fs.existsSync(path.join(__dirname, song.filePath))
        ) {
          fs.unlinkSync(path.join(__dirname, song.filePath));
        }
        song.filePath = `uploads/music/${req.file.filename}`;
      }

      await song.save();
      res.json({ message: "Song updated", song });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  }
);

app.delete("/api/admin/songs/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) return res.status(404).json({ message: "Song not found" });

    if (song.filePath && fs.existsSync(path.join(__dirname, song.filePath))) {
      fs.unlinkSync(path.join(__dirname, song.filePath));
    }

    // เมื่อ Admin ลบเพลง ให้ลบไฟล์ภาพปกของเพลงนั้นด้วย
    if (song.coverPath && fs.existsSync(path.join(__dirname, song.coverPath))) {
      fs.unlinkSync(path.join(__dirname, song.coverPath));
    }

    await song.deleteOne();
    res.json({ message: "Song deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= Admin Analytics =================
app.get(
  "/api/admin/analytics/users-growth",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const users = await User.find().sort({ createdAt: 1 });
      const data = users.map((u, idx) => ({
        date: u.createdAt ? u.createdAt.toISOString().split("T")[0] : "N/A",
        totalUsers: idx + 1,
      }));
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  }
);

app.get(
  "/api/admin/analytics/uploads-downloads",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const users = await User.find();
      const data = users.map((u) => ({
        username: u.username || "Unknown",
        uploads: u.uploadCount || 0,
        downloads: u.downloadCount || 0,
      }));
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  }
);

app.get(
  "/api/admin/analytics/top-songs",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const songs = await Song.find().sort({ downloads: -1 }).limit(5);
      const data = songs.map((s) => ({
        title: s.title || "Untitled",
        downloads: s.downloads || 0,
        likes: s.likes || 0,
      }));
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  }
);

// ================= Redeem Code System =================
app.post("/api/admin/gencode", verifyToken, isAdmin, async (req, res) => {
  try {
    const { plan } = req.body;
    const txt = plan.toUpperCase().replace(" ", "");

    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const code = `${txt}-${random}`;

    await RedeemCode.create({ code, plan });

    res.json({ success: true, code });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/redeem", verifyToken, async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.userId;

    const findCode = await RedeemCode.findOne({ code });

    if (!findCode)
      return res.json({ success: false, message: "โค้ดไม่ถูกต้อง" });
    if (findCode.used)
      return res.json({ success: false, message: "โค้ดถูกใช้แล้ว" });

    const user = await User.findById(userId);
    if (!user) return res.json({ success: false, message: "ไม่พบผู้ใช้" });

    let upload = 0,
      download = 0;

    if (findCode.plan === "SOCOZY") {
      upload = 100;
      download = 300;
    }
    if (findCode.plan === "SUPERCOZY") {
      upload = 200;
      download = 600;
    }
    if (findCode.plan === "COZIEST") {
      upload = 999999;
      download = 999999;
    }

    const now = new Date();
    const expire = new Date(now);
    expire.setDate(expire.getDate() + 30);

    user.maxUpload = upload;
    user.maxDownload = download;
    user.plan = findCode.plan;
    user.planStart = now;
    user.planExpire = expire;
    await user.save();

    findCode.used = true;
    findCode.usedBy = user._id;
    await findCode.save();

    res.json({ success: true, message: "ใช้โค้ดสำเร็จ" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/user/:id/code", verifyToken, async (req, res) => {
  try {
    if (req.userId !== req.params.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const now = new Date();
    const remainingDays =
      user.planExpire && user.planExpire > now
        ? Math.ceil((user.planExpire - now) / (1000 * 60 * 60 * 24))
        : 0;

    res.json({
      plan: user.plan,
      expire: user.planExpire,
      remainingDays,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/admin/codes", verifyToken, isAdmin, async (req, res) => {
  try {
    const codes = await RedeemCode.find()
      .sort({ createdAt: -1 })
      .populate("usedBy", "username email");

    res.json(codes);
  } catch (err) {
    console.error("❌ Error fetching redeem codes:", err);
    res.status(500).json({ message: err.message });
  }
});

// ================= Health Check =================
// เปิด http://localhost:5000/api/health เพื่อดูสถานะ Backend / MongoDB
app.get("/api/health", (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    server: "running",
    mongodb: connected ? "connected" : "disconnected",
  });
});

// ================= Start Server =================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
console.log("📚 Swagger docs: http://localhost:5000/api-docs");