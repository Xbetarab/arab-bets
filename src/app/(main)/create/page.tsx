import { createClient } from "@/lib/supabase/server";
import CreatePostForm from "@/components/create-post-form";

export const metadata = {
  title: "نشر جديد | arabtips",
};

export default async function CreatePostPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return (
    <div dir="rtl" className="space-y-4">
      <h1 className="text-xl font-bold text-white">نشر جديد</h1>
      <CreatePostForm userId={user.id} />
    </div>
  );
}
