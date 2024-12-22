import { Database } from "@/web/database.types";
import UserForm from "./user-form";
import PageContainer from "@/web/components/layout/page-container";
import { User } from "@/web/lib/supabase-server";

export default function UserViewPage({ user }: { user: User }) {
  return (
    <PageContainer>
      <UserForm user={user} />
    </PageContainer>
  );
}
