import express from "express";
import connectDB from "./lib/connectDB.js";
import userRouter from "./routes/user.route.js";
import postRouter from "./routes/post.route.js";
import commentRouter from "./routes/comment.route.js";
import webhookRouter from "./routes/webhook.route.js";
import { clerkMiddleware } from "@clerk/express";
import dotenv from "dotenv";
import bodyParser from "body-parser";

// ----------------------------------------------------
// 環境変数の読み込み (サーバーの起動前に必須)
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
// ミドルウェアの配置 (重要!)
// ----------------------------------------------------

// clerkMiddleware() を関数実行してミドルウェア関数を取得
const clerkAuthMiddleware = clerkMiddleware();

// 1. Webhooks/clerkルートはrawボディで受け取るため専用設定
app.use("/webhooks/clerk", bodyParser.raw({ type: 'application/json' }));

// 2. それ以外のwebhooksは通常のjsonパース
app.use("/webhooks", express.json());

// 3. Webhooksルートは認証スキップのため、先に配置
app.use("/webhooks", webhookRouter);

// 4. その他ルートはexpress.json()でJSONパース
app.use(express.json());

// 5. Clerk認証ミドルウェア（webhooks以外のルートにのみ適用）
app.use((req, res, next) => {
    if (req.originalUrl.startsWith('/webhooks')) {
        console.log("[Middleware] Skipping clerkMiddleware for webhooks.");
        return next();
    }
    console.log("[Middleware] Before clerkMiddleware");
    clerkAuthMiddleware(req, res, next);
});

// 6. カスタム認証チェック
app.use((req, res, next) => {
    if (req.originalUrl.startsWith('/webhooks')) {
        console.log("[Middleware] Skipping custom auth check for webhooks.");
        return next();
    }
    console.log("[Middleware] Entering custom auth check.");
    console.log("[Middleware] req.auth state:", req.auth ? "present" : "absent");
    if (!req.auth || !req.auth.userId) {
        console.log("[Middleware] Authentication failed: req.auth missing or userId null.");
        return res.status(401).json("Not authenticated!");
    }
    console.log("[Middleware] Authenticated user ID:", req.auth.userId);
    next();
});

// 7. 各ルートの設定
app.use("/users", userRouter);
app.use("/posts", postRouter);
app.use("/comments", commentRouter);

// ----------------------------------------------------
// 汎用ログとエラーハンドリング
// ----------------------------------------------------

// catch-all ログ用ミドルウェア
app.use((req, res, next) => {
    console.log(`[Middleware] No route matched for ${req.originalUrl}. Falling through to error handling/default.`);
    next();
});

// エラーハンドリングミドルウェア
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
        stack: process.env.NODE_ENV === 'production' ? '🥞' : error.stack,
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
