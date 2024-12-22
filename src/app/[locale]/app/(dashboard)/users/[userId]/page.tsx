import { notFound } from "next/navigation";
import UserViewPage from "../_components/socket-view-page";
import { createSupabaseServerClient } from "@/web/lib/supabase-server";

export const metadata = {
  title: "Dashboard : User View",
};

export default async function Page({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const user = await supabase.auth.admin.getUserById((await params).userId);

  if (!user.data.user) {
    notFound();
    return;
  }

  return <UserViewPage user={user.data.user} />;
}
