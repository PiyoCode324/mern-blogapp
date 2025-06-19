import { useAuth, useUser } from "@clerk/clerk-react";
import "react-quill-new/dist/quill.snow.css";
import ReactQuill from "react-quill-new";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
// IKContext, IKUpload は Upload.jsx に移動したので、ここからは削除
// import { IKContext, IKUpload } from "imagekitio-react";

import Upload from "../components/Upload"; // ⭐ 分離した Upload コンポーネントをインポート

const Write = () => {
  const { isLoaded, isSignedIn } = useUser();
  const [value, setValue] = useState("");
  const [cover, setCover] = useState(""); // カバー画像用
  const [img, setImg] = useState(""); // 本文中の画像用（例として追加）
  const [video, setVideo] = useState(""); // 動画用（例として追加）

  // 現在の進捗度を管理するstate。Uploadコンポーネントから更新される。
  const [progress, setProgress] = useState(0);

  const navigate = useNavigate();
  const { getToken } = useAuth();

  // ⭐ ここにあった空のauthenticator関数ブロックは削除します
  // };

  const mutation = useMutation({
    mutationFn: async (newPost) => {
      const token = await getToken({ template: "backend" });
      if (!token) {
        throw new Error("Authentication token missing.");
      }
      return axios.post(`${import.meta.env.VITE_API_URL}/posts`, newPost, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    onSuccess: (res) => {
      toast.success("Post has been created");
      navigate(`/${res.data.slug}`);
    },
    onError: (error) => {
      console.error("Post creation failed:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to create post."
      );
    },
  });

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (isLoaded && !isSignedIn) {
    return <div>You should login!</div>;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const data = {
      title: formData.get("title"),
      category: formData.get("category"),
      desc: formData.get("desc"),
      content: value,
      // ⭐ アップロードされた画像のURLを投稿データに含めます
      // coverが主要な画像、imgやvideoはテキストエディタ内で使われるかもしれない画像のURLを想定
      img: cover || img || video, // どの画像を使うかはアプリケーションのロジックに合わせる
    };

    console.log("--- DEBUG: Data being sent to backend ---");
    console.log("data.title:", data.title);
    console.log("data.img (uploaded file URL):", data.img); // 追加
    console.log("Full data object:", data);
    console.log("---------------------------------------");

    mutation.mutate(data);
  };

  return (
    <div className="h-[calc(100vh-64px)] md:h-[calc(100vh-80px)] flex flex-col gap-6">
      <h1 className="text-cl font-light">Create a New Post</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 flex-1 mb-6">
        <Upload type="image" setProgress={setProgress} setData={setCover}>
          <button className="w-max p-2 shadow-md rounded-xl text-sm text-gray-500 bg-white">
            Add a cover image
          </button>
        </Upload>
        <input
          className="text-4xl font-semibold bg-transparent outline-none"
          type="text"
          placeholder="My Awesome Story"
          name="title"
        />
        <div className="flex items-center gap-4">
          <label htmlFor="" className="text-sm">
            Choose a category:
          </label>
          <select
            name="category"
            id=""
            className="p-2 rounded-xl bg-white shadow-md"
          >
            <option value="general">General</option>
            <option value="web-design">Web Design</option>
            <option value="development">Development</option>
            <option value="databases">Databases</option>
            <option value="seo">Search Engines</option>
            <option value="marketing">Marketing</option>
          </select>
        </div>
        <textarea
          className="p-4 rounded-xl bg-white shadow-md"
          name="desc"
          placeholder="A Short Description"
        />
        <div className="flex flex-1 ">
          <div className="flex flex-col gap-2 mr-2">
            <Upload type="image" setProgress={setProgress} setData={setImg}>
              🌆
            </Upload>
            <Upload type="video" setProgress={setProgress} setData={setVideo}>
              ▶️
            </Upload>
          </div>
          <ReactQuill
            theme="snow"
            className="flex-1 rounded-xl bg-white shadow-md"
            value={value}
            onChange={setValue}
            readOnly={0 < progress && progress < 100}
          />
        </div>
        <button
          disabled={mutation.isPending || (0 < progress && progress < 100)}
          className="bg-blue-800 text-white font-medium rounded-xl mt-4 p-2 w-36 disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? "Loading..." : "Send"}
        </button>
        {"Progress:" + progress}
        {/* {mutation.isError && <span>{mutation.error.message}</span>} */}
      </form>
    </div>
  );
};

export default Write;
