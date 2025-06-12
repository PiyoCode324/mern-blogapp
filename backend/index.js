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
    console.warn("WARNING: CLERK_SECRET_KEY is not set. Clerk middleware may fail.");
}
console.log("---------------------------------------");

const app = express();

// ----------------------------------------------------
// ミドルウェアの配置
// ----------------------------------------------------

// Clerkミドルウェアをaudience指定で初期化
const clerkAuthMiddleware = clerkMiddleware({
  apiKey: process.env.CLERK_SECRET_KEY,
  jwt: {
    audience: "http://localhost:3000", // ClerkのJWTテンプレートで設定したaudienceに合わせてください
  },
});

app.use(cors(process.env.CLIENT_URL));

// 1. Clerk Webhook は raw ボディ必要
app.use("/webhooks/clerk", bodyParser.raw({ type: "application/json" }));

// 2. 通常 Webhook は JSON
// app.use("/webhooks", express.json()); // ★この行を削除またはコメントアウト！★

// 3. Webhooksルートは認証スキップ
app.use("/webhooks", webhookRouter);

// 4. 通常ルート用 JSON パース
app.use(express.json());

// 5. Clerk 認証ミドルウェア（webhooks除く）
app.use((req, res, next) => {
    if (req.originalUrl.startsWith("/webhooks")) {
        console.log("[Middleware] Skipping clerkMiddleware for webhooks.");
        return next();
    }
    console.log("[Middleware] Before clerkMiddleware");
    // --- ★ここから追加★ ---
    console.log("[Middleware] Auth Header before clerkMiddleware:", req.headers.authorization);
    // --- ★ここまで追加★ ---
    clerkAuthMiddleware(req, res, next);
});

// 6. カスタム認証チェック
app.use((req, res, next) => {
    if (req.originalUrl.startsWith("/webhooks")) {
        console.log("[Middleware] Skipping custom auth check for webhooks.");
        return next();
    }

    console.log("[Middleware] Entering custom auth check.");

    const auth = req.auth(); // ← 正解
    console.log("[Middleware] req.auth() result:", auth);

    // --- ★ここから追加★ ---
    if (auth && typeof auth.userId === 'undefined') {
        console.warn("[Middleware] WARNING: req.auth() result object is present, but userId is undefined.");
    }
    // --- ★ここまで追加★ ---

    if (!auth || !auth.userId) {
        console.log("[Middleware] Authentication failed: req.auth() missing or userId null.");
        return res.status(401).json("Not authenticated!");
    }

    console.log("[Middleware] Authenticated user ID:", auth.userId);
    next();
});

// 7. 各ルートの設定
app.use("/users", userRouter);
app.use("/posts", postRouter);
app.use("/comments", commentRouter);

// ----------------------------------------------------
// 汎用ログとエラーハンドリング
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
// サーバー起動
// ----------------------------------------------------
app.listen(3000, async () => {
    console.log("Attempting to connect to DB...");
    try {
        await connectDB();
        console.log("Database connected successfully!");
    } catch (dbError) {
        console.error("ERROR: Database connection failed!", dbError);
    }
    console.log("Server is running on port 3000!");
    console.log("Ready to receive requests...");
    console.log("---------------------------------------");
});
