import { useQuery } from '@tanstack/react-query';
import PostListItem from './PostListItem';
import axios from "axios";
import { useAuth } from '@clerk/clerk-react'; // ⭐ 1. Clerkの useAuth フックをインポート

const PostList = () => {
  // ⭐ 2. useAuth フックをコンポーネント内で呼び出す
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const { isPending, error, data } = useQuery({
    queryKey: ['repoData'],
    queryFn: async () => { // ⭐ queryFn を async 関数にする
      // Clerk SDKがまだロードされていない、またはユーザーがサインインしていない場合は、
      // APIリクエストを実行せずにエラーを投げ、useQuery の error ステータスに反映させます。
      if (!isLoaded || !isSignedIn) {
        console.warn("Clerk not fully loaded or user not signed in. Skipping API call.");
        throw new Error("Authentication required."); // エラーとして処理させる
      }

      // ⭐ 3. getToken() を使って認証トークンを取得する
      // ここで、Clerkダッシュボードで設定したJWTテンプレートの名前を指定します。
      // もしカスタムテンプレートを作成していない、またはデフォルトのテンプレートで audience のみを設定している場合は、
      // getToken() の引数は空のオブジェクト `{}` で試してください。
      // 例: const token = await getToken();
      const token = await getToken({ template: 'backend' }); // <-- 'your_jwt_template_name' を実際のテンプレート名に置き換え

      if (!token) {
        console.error("JWT token not found after login.");
        throw new Error("Authentication token missing.");
      }

      // ⭐ 4. axios.get の呼び出しに await を追加し、Authorization ヘッダーを含める
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/posts`, {
        headers: {
          Authorization: `Bearer ${token}`, // JWTトークンをヘッダーに設定
        },
      });
      return res.data; // ⭐ 5. 取得したデータを返す
    },
    // ⭐ 6. (Optional but recommended) enabledオプションを追加
    // Clerkがロードされ、ユーザーがサインインしている場合のみクエリを実行する
    enabled: isLoaded && isSignedIn,
    // エラー時に自動リトライを停止したい場合 (オプション)
    // retry: false,
  });

  // ⭐ 7. 認証状態のローディングとエラーハンドリングを強化
  if (!isLoaded) {
    return 'Loading authentication...'; // Clerk SDKの初期化を待つ
  }

  if (!isSignedIn) {
    return 'Please sign in to view posts.'; // ユーザーがログインしていない場合
  }

  if (isPending) return 'Loading posts...'; // APIリクエスト中

  if (error) {
    console.error("Error fetching posts:", error); // デバッグ用に詳細なエラーをコンソールに出力
    return 'An error has occurred: ' + error.message;
  }

  console.log(data); // 取得したデータはログに出力されたままになります
  return (
    <div className='flex flex-col gap-12 mb-8'>
      {/* ⭐ ここは変更せず、既存の PostListItem の羅列をそのまま維持します */}
      <PostListItem/>
      <PostListItem/>
      <PostListItem/>
      <PostListItem/>
      <PostListItem/>
      <PostListItem/>
      <PostListItem/>
      <PostListItem/>
      <PostListItem/>
      <PostListItem/>
      <PostListItem/>
    </div>
  );
};

export default PostList;