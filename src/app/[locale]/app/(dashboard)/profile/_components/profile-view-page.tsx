import PageContainer from "@/web/components/layout/page-container";
import ProfileCreateForm from "./profile-create-form";
import { getUser } from "@/lib/supabase-server";

export default async function ProfileViewPage() {
  const user = await getUser();
  return (
    <PageContainer>
      <div className="space-y-4">
        <ProfileCreateForm
          categories={[]}
          initialData={{
            name: user.user_metadata?.name ?? "",
            email: user.email ?? "",
          }}
        />
      </div>
    </PageContainer>
  );
}
