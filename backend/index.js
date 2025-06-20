import express from "express";
import connectDB from "./lib/connectDB.js";
import userRouter from "./routes/user.route.js";
import postRouter from "./routes/post.route.js";
import commentRouter from "./routes/comment.route.js";
import webhookRouter from "./routes/webhook.route.js";
import { clerkMiddleware } from "@clerk/express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";

// ----------------------------------------------------
// 環境変数の読み込み
// ----------------------------------------------------
dotenv.config();
console.log("---------------------------------------");
console.log("Server Startup Logs:");
console.log("CLERK_SECRET_KEY is set:", !!process.env.CLERK_SECRET_KEY);
if (!process.env.CLERK_SECRET_KEY) {
  console.warn(
    "WARNING: CLERK_SECRET_KEY is not set. Clerk middleware may fail."
  );
}
console.log("---------------------------------------");

const app = express();
const port = process.env.PORT || 3000;

// ----------------------------------------------------
// CORS設定（ローカルと本番を許可）
// ----------------------------------------------------
const allowedOrigins = [
  "http://localhost:5173", // ✅ Viteのデフォルトポート
  "https://mern-blogapp-client.onrender.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// ----------------------------------------------------
// Clerkミドルウェア初期化
// ----------------------------------------------------
const clerkAuthMiddleware = clerkMiddleware({
  apiKey: process.env.CLERK_SECRET_KEY,
  jwt: {
    audience: process.env.CLIENT_URL || "http://localhost:3000",
  },
});

// ----------------------------------------------------
// ヘルスチェックルート
// ----------------------------------------------------
app.get("/", (req, res) => {
  res.send("Hello, this is the root!");
});

// ----------------------------------------------------
// Webhook（raw body必須）
// ----------------------------------------------------
app.use("/webhooks/clerk", bodyParser.raw({ type: "application/json" }));

// Webhookは認証スキップ
app.use("/webhooks", webhookRouter);

// 通常ルート用 JSON パーサー
app.use(express.json());

// ----------------------------------------------------
// Clerk認証ミドルウェア（webhooksを除く）
// ----------------------------------------------------
app.use((req, res, next) => {
  if (req.originalUrl.startsWith("/webhooks")) {
    console.log("[Middleware] Skipping clerkMiddleware for webhooks.");
    return next();
  }
  console.log("[Middleware] Before clerkMiddleware");
  console.log(
    "[Middleware] Auth Header before clerkMiddleware:",
    req.headers.authorization
  );
  clerkAuthMiddleware(req, res, next);
});

// ----------------------------------------------------
// カスタム認証チェック（webhooksを除く）
// ----------------------------------------------------
app.use((req, res, next) => {
  if (req.originalUrl.startsWith("/webhooks")) {
    console.log("[Middleware] Skipping custom auth check for webhooks.");
    return next();
  }

  console.log("[Middleware] Entering custom auth check.");
  const auth = req.auth();
  console.log("[Middleware] req.auth() result:", auth);

  if (!auth || !auth.userId) {
    console.log(
      "[Middleware] Authentication failed: req.auth() missing or userId null."
    );
    return res.status(401).json("Not authenticated!");
  }

  console.log("[Middleware] Authenticated user ID:", auth.userId);
  next();
});

// ----------------------------------------------------
// ImageKit用 CORSヘッダー（すでにCORS対応してるのでここは不要でもOK）
// ----------------------------------------------------
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// ----------------------------------------------------
// ルート設定
// ----------------------------------------------------
app.use("/users", userRouter);
app.use("/posts", postRouter);
app.use("/comments", commentRouter);

// ----------------------------------------------------
// 未マッチルートとエラー処理
// ----------------------------------------------------
app.use((req, res, next) => {
  console.log(`[Middleware] No route matched for ${req.originalUrl}.`);
  next();
});

app.use((error, req, res, next) => {
  console.error("---------------------------------------");
  console.error("[ERROR HANDLER] Caught an error!");
  console.error("Error Message:", error.message);
  console.error("Error Status:", error.status);
  console.error("Error Stack:", error.stack);
  console.error("Request Path:", req.originalUrl);
  console.error("---------------------------------------");

  res.status(error.status || 500).json({
    message: error.message || "Something went wrong!",
    status: error.status,
    stack: process.env.NODE_ENV === "production" ? "🥞" : error.stack,
  });
});

// ----------------------------------------------------
// サーバー起動（Render対応の 0.0.0.0）
// ----------------------------------------------------
app.listen(port, "0.0.0.0", async () => {
  console.log(`Attempting to connect to DB...`);
  try {
    await connectDB();
    console.log("Database connected successfully!");
  } catch (dbError) {
    console.error("ERROR: Database connection failed!", dbError);
  }
  console.log(`Server is running on http://0.0.0.0:${port}`);
  console.log("Ready to receive requests...");
  console.log("---------------------------------------");
});
