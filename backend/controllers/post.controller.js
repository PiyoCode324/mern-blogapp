// controllers/post.controller.js

import ImageKit from "imagekit";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";

export const getPosts = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 2;

  const posts = await Post.find()
    .limit(limit)
    .skip((page - 1) * limit);

  const totalPosts = await Post.countDocuments();
  const hasMore = page * limit < totalPosts;

  res.status(200).json({ posts, hasMore });
};

export const getPost = async (req, res) => {
  const post = await Post.findOne({ slug: req.params.slug }).populate(
    "user",
    "username img"
  );
  res.status(200).json(post);
};

export const createPost = async (req, res) => {
  const clerkUserId = req.auth.userId;

  // ⭐⭐⭐ デバッグログ: バックエンドで受け取ったリクエストボディを確認 ⭐⭐⭐
  console.log("---------------------------------------");
  console.log("[Backend: createPost] API called.");
  console.log("[Backend: createPost] Request Body (full):", req.body);
  console.log("[Backend: createPost] req.body.img value:", req.body.img);
  console.log("---------------------------------------");
  // ⭐⭐⭐ デバッグログここまで ⭐⭐⭐

  if (!clerkUserId) {
    return res.status(401).json("Not authenticated!");
  }

  const user = await User.findOne({ clerkUserId });

  if (!user) {
    return res.status(404).json("User not found!");
  }

  let slug = req.body.title.replace(/ /g, "-").toLowerCase();

  let existingPost = await Post.findOne({ slug });

  let counter = 2;

  while (existingPost) {
    slug = `${slug}-${counter}`;
    existingPost = await Post.findOne({ slug });
    counter++;
  }

  // ⭐⭐⭐ 修正箇所: req.body から img を明示的に抽出し、新しいオブジェクトを構築 ⭐⭐⭐
  // フロントエンドから 'img' というキーで完全なURLが送信されていることを期待します。
  const { title, desc, img, category, content, isFeatured } = req.body;

  const newPost = new Post({
    user: user._id,
    slug,
    title,
    desc,
    img, // ⭐ ここで完全なURLがDBに保存される
    category,
    content,
    isFeatured,
  });
  // ⭐⭐⭐ 修正箇所ここまで ⭐⭐⭐

  const post = await newPost.save();
  console.log("[Backend: createPost] Post created successfully:", post);
  res.status(201).json(post); // ステータスコードを201 (Created) に変更することも検討
};

export const deletePost = async (req, res) => {
  const clerkUserId = req.auth.userId;

  if (!clerkUserId) {
    return res.status(401).json("Not authenticated!");
  }

  const user = await User.findOne({ clerkUserId });

  const deletedPost = await Post.findOneAndDelete({
    _id: req.params.id,
    user: user._id,
  });

  if (!deletedPost) {
    return res.status(403).json("You can delete only your posts!");
  }

  res.status(200).json("Post has been deleted");
};

export const uploadAuth = async (req, res) => {
  const imagekit = new ImageKit({
    urlEndpoint: process.env.IK_URL_ENDPOINT,
    publicKey: process.env.IK_PUBLIC_KEY,
    privateKey: process.env.IK_PRIVATE_KEY,
  });

  console.log(
    "ImageKit publicKey:",
    process.env.IK_PUBLIC_KEY ? "Loaded" : "MISSING!"
  );
  console.log(
    "ImageKit privateKey:",
    process.env.IK_PRIVATE_KEY ? "Loaded" : "MISSING!"
  );
  console.log(
    "ImageKit urlEndpoint:",
    process.env.IK_URL_ENDPOINT ? "Loaded" : "MISSING!"
  );

  if (
    !process.env.IK_PUBLIC_KEY ||
    !process.env.IK_PRIVATE_KEY ||
    !process.env.IK_URL_ENDPOINT
  ) {
    console.error("ImageKit環境変数が正しく設定されていません。");
    return res
      .status(500)
      .json({ message: "ImageKit configuration error on server." });
  }

  const result = imagekit.getAuthenticationParameters();
  res.send(result);
};
