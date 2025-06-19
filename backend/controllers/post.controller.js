import ImageKit from "imagekit";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";

export const getPosts = async (req, res) => {
  const posts = await Post.find();
  res.status(200).json(posts);
};

export const getPost = async (req, res) => {
  const post = await Post.findOne({ slug: req.params.slug }).populate(
    "user",
    "username img" // username と img フィールドのみをpopulate
  );
  res.status(200).json(post);
};

export const createPost = async (req, res) => {
  const clerkUserId = req.auth.userId;

  console.log(req.headers);

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

  const newPost = new Post({ user: user._id, slug, ...req.body });

  const post = await newPost.save();
  res.status(200).json(post);
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

// ⭐ 修正箇所: imagekit の初期化を uploadAuth 関数の中に移動します。
// これにより、uploadAuth が呼び出される時には dotenv.config() で
// 環境変数が確実にロードされていることが保証されます。

export const uploadAuth = async (req, res) => {
  // ImageKitインスタンスを関数内で初期化
  const imagekit = new ImageKit({
    urlEndpoint: process.env.IK_URL_ENDPOINT,
    publicKey: process.env.IK_PUBLIC_KEY,
    privateKey: process.env.IK_PRIVATE_KEY,
  });

  // ⭐ 環境変数が正しくロードされているかデバッグログを追加
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

  // publicKeyが本当にない場合はエラーを返す
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
