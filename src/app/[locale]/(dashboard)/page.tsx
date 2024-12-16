import { getUser } from "@/web/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const userWithRoles = await getUser();

  if (!userWithRoles) {
    return redirect("/login");
  } else {
    redirect("/overview");
  }
}
