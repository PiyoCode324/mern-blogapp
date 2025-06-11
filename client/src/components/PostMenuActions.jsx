import { useUser, useAuth } from "@clerk/clerk-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const PostMenuActions = ({ post }) => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    isPending,
    error,
    data: savedPosts,
  } = useQuery({
    queryKey: ["savedPosts"],
    queryFn: async () => {
      const token = await getToken({ template: "backend" }); // ✅
      return axios.get(`${import.meta.env.VITE_API_URL}/users/saved`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
  });

  const isAdmin = user?.publicMetadata?.role === "admin" || false;
  const savedPostIds = savedPosts?.data;
  const isSaved = Array.isArray(savedPostIds) && savedPostIds.includes(post._id);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken({ template: "backend" }); // ✅
      return axios.delete(`${import.meta.env.VITE_API_URL}/posts/${post._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    onSuccess: () => {
      toast.success("Post deleted successfully!");
      navigate("/");
    },
    onError: (error) => {
      toast.error(error.response?.data || "Delete failed");
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken({ template: "backend" }); // ✅
      return axios.patch(
        `${import.meta.env.VITE_API_URL}/users/save`,
        { postId: post._id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedPosts"] });
    },
    onError: (error) => {
      toast.error(error.response?.data || "Save failed");
    },
  });

  const featureMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken({ template: "backend" }); // ✅
      return axios.patch(
        `${import.meta.env.VITE_API_URL}/posts/feature`,
        { postId: post._id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post", post.slug] });
    },
    onError: (error) => {
      toast.error(error.response?.data || "Feature failed");
    },
  });

  const handleDelete = () => deleteMutation.mutate();
  const handleFeature = () => featureMutation.mutate();
  const handleSave = () => {
    if (!user) return navigate("/login");
    saveMutation.mutate();
  };

  return (
    <div>
      <h1 className="mt-8 mb-4 text-sm font-medium">Actions</h1>

      {isPending ? (
        "Loading..."
      ) : error ? (
        "Saved post fetching failed!"
      ) : (
        <div
          className="flex items-center gap-2 py-2 text-sm cursor-pointer"
          onClick={handleSave}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px">
            <path
              d="M12 4C10.3 4 9 5.3 9 7v34l15-9 15 9V7c0-1.7-1.3-3-3-3H12z"
              stroke="black"
              strokeWidth="2"
              fill={
                saveMutation.isPending
                  ? isSaved
                    ? "none"
                    : "black"
                  : isSaved
                  ? "black"
                  : "none"
              }
            />
          </svg>
          <span>Save this Post</span>
          {saveMutation.isPending && <span className="text-xs">(in progress)</span>}
        </div>
      )}

      {isAdmin && (
        <div
          className="flex items-center gap-2 py-2 text-sm cursor-pointer"
          onClick={handleFeature}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px">
            <path
              d="M24 2L29.39 16.26L44 18.18L33 29.24L35.82 44L24 37L12.18 44L15 29.24L4 18.18L18.61 16.26L24 2Z"
              stroke="black"
              strokeWidth="2"
              fill={
                featureMutation.isPending
                  ? post.isFeatured
                    ? "none"
                    : "black"
                  : post.isFeatured
                  ? "black"
                  : "none"
              }
            />
          </svg>
          <span>Feature</span>
          {featureMutation.isPending && <span className="text-xs">(in progress)</span>}
        </div>
      )}

      {user && (post.user.username === user.username || isAdmin) && (
        <div
          className="flex items-center gap-2 py-2 text-sm cursor-pointer"
          onClick={handleDelete}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" fill="red" width="20px" height="20px">
            <path d="M 21 2 C 19.354545 2 18 3.3545455 18 5 L 18 7 L 10.154297 7 ... (略) ... z" />
          </svg>
          <span>Delete this Post</span>
          {deleteMutation.isPending && <span className="text-xs">(in progress)</span>}
        </div>
      )}
    </div>
  );
};

export default PostMenuActions;
