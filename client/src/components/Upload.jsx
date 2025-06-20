// Upload.jsx

import { IKContext, IKUpload } from "imagekitio-react";
import { toast } from "react-toastify";
import { useAuth } from "@clerk/clerk-react";
import { useRef } from "react";

const Upload = ({ children, type, setProgress, setData }) => {
  const { getToken } = useAuth();
  const uploadRef = useRef();

  const authenticator = async () => {
    try {
      const token = await getToken({ template: "backend" });
      if (!token) throw new Error("Clerk authentication token missing.");

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/posts/upload-auth`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Request failed: ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const {
        signature,
        expire,
        token: imageKitTokenFromBackend,
        publicKey,
      } = data;
      return { signature, expire, token: imageKitTokenFromBackend, publicKey };
    } catch (error) {
      console.error("Authentication error:", error);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  };

  const onError = (err) => {
    console.log("ImageKit Upload Error:", err); // より詳細なログ
    toast.error("画像のアップロードに失敗しました！");
  };

  const onSuccess = (res) => {
    console.log(
      "--- DEBUG: ImageKit Upload Success Response (from Upload.jsx) ---"
    );
    console.log("Full ImageKit Response:", res); // 成功時のレスポンス全体を確認
    console.log("Image URL (res.url):", res.url); // res.url を確認
    console.log("---------------------------------------");

    // ⭐ setData に res.url (完全な画像URL) を渡す
    setData(res.url);
    toast.success("画像を正常にアップロードしました！");
  };

  const onUploadProgress = (progress) => {
    setProgress(Math.round((progress.loaded / progress.total) * 100));
  };

  return (
    <IKContext
      publicKey={import.meta.env.VITE_IK_PUBLIC_KEY}
      urlEndpoint={import.meta.env.VITE_IK_URL_ENDPOINT}
      authenticator={authenticator}
    >
      <div
        onClick={() => uploadRef.current.click()}
        className="cursor-pointer hover:opacity-80"
      >
        {children}
      </div>

      <IKUpload
        useUniqueFileName
        folder="/blogapp"
        onError={onError}
        onSuccess={onSuccess}
        onUploadProgress={onUploadProgress}
        style={{ display: "none" }}
        ref={uploadRef}
        accept={`${type}/*`}
      />
    </IKContext>
  );
};

export default Upload;
