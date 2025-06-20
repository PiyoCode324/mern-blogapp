// Image.jsx

const Image = ({ src, className, w, h, alt }) => {
  // ⭐ デバッグ用: Image コンポーネントに渡された src を確認
  console.log("--- DEBUG: Image Component received src ---");
  console.log("Image.jsx received src:", src);
  console.log("---------------------------------------");

  if (!src) {
    return null; // src がない場合は何も表示しない
  }

  return (
    <img
      src={src} // ⭐ DBから取得した完全なURLをそのまま使用
      alt={alt}
      className={className}
      loading="lazy"
      width={w}
      height={h}
    />
  );
};

export default Image;
