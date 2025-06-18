import {useAuth, useUser} from "@clerk/clerk-react"
import 'react-quill-new/dist/quill.snow.css';
import ReactQuill from "react-quill-new";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Write = () => {

  const {isLoaded,isSignedIn} =useUser();
  const [value,setValue]=useState('');
  const navigate=useNavigate();
  const {getToken}=useAuth();

  const mutation=useMutation({
    mutationFn:async(newPost)=>{
      const token=await getToken({ template: 'backend' }); // ⭐ ClerkのJWTテンプレート名が'backend'であることを確認
      if (!token) {
        throw new Error("Authentication token missing.");
      }
      // ⭐ ここを修正: バックエンドのURLにVITE_API_URLを使用する
      return axios.post(`${import.meta.env.VITE_API_URL}/posts`, newPost, {
        headers:{
          Authorization:`Bearer ${token}`,
        }
      });
    },
    onSuccess:(res)=>{
      toast.success("Post has been created")
      navigate(`/${res.data.slug}`);
    },
    onError: (error) => { // エラーハンドリングも重要です
        console.error("Post creation failed:", error);
        toast.error(error.response?.data?.message || error.message || "Failed to create post.");
    }
  });

  if(!isLoaded){
    return <div className="">Loading...</div>;
  }

  if(isLoaded && !isSignedIn){
    return <div className="">You should login!</div>;
  }

  const handleSubmit=(e)=>{
    e.preventDefault();
    const formData=new FormData(e.target)

    const data={
    title: formData.get("title"), // ここがポイント！
    category:formData.get("category"),
    desc:formData.get("desc"),
    content:value,
    };
    // ★ ここにログを追加してください
    console.log("--- DEBUG: Data being sent to backend ---");
    console.log("data.title:", data.title);
    console.log("Full data object:", data);
    console.log("---------------------------------------");

    mutation.mutate(data);
  };

  return (
  <div className="h-[calc(100vh-64px)] md:h-[calc(100vh-80px)] flex flex-col gap-6">
      <h1 className="text-cl font-light">Create a New Post</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-red-100 flex-1 mb-6">
        <button className="w-max p-2 shadow-md rounded-xl text-sm text-gray-500 bg-white">Add a cover image</button>
        <input 
          className="text-4xl font-semibold bg-transparent outline-none" 
          type="text" 
          placeholder="My Awesome Story"
          name="title"
        />
        <div className="flex items-center gap-4">
          <label htmlFor="" className="text-sm">Choose a category:</label>
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
        <ReactQuill 
          theme="snow"
          className="flex-1 rounded-xl bg-white shadow-md"
          value={value}
          onChange={setValue}
        />
        <button 
          disabled={mutation.isPending} 
          className="bg-blue-800 text-white font-medium rounded-xl mt-4 p-2 w-36 disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? "Loading..." : "Send"}
        </button>
        {mutation.isError && <span>{mutation.error.message}</span>}
      </form>
    </div>
  );
};

export default Write;