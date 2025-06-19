import { IKContext, IKUpload } from "imagekitio-react";
import { toast } from "react-toastify";
import { useAuth } from "@clerk/clerk-react";
import { useRef } from "react";

const Upload = ({ setProgress, setData, children }) => {
  const { getToken } = useAuth();
  const uploadRef = useRef(); // 👈 ref でIKUploadを制御

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
    console.log(err);
    toast.error("Image upload failed!");
  };

  const onSuccess = (res) => {
    console.log(res);
    setData(res.url); // 画像URLだけ渡す
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
      {/* 👇 ラッパー要素をクリックしたらIKUploadをトリガー */}
      <div
        onClick={() => uploadRef.current.click()}
        className="cursor-pointer hover:opacity-80"
      >
        {children}
      </div>

      {/* 👇 非表示にしてref経由でクリック可能に */}
      <IKUpload
        ref={uploadRef}
        useUniqueFileName
        folder="/blogapp"
        onError={onError}
        onSuccess={onSuccess}
        onUploadProgress={onUploadProgress}
        style={{ display: "none" }}
      />
    </IKContext>
  );
};

export default Upload;
