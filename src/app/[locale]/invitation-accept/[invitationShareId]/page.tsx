import { getMaybeUser } from "@/web/lib/supabase-server";
import SignInViewPage from "@/src/app/[locale]/(auth)/_components/sigin-view";
import UserRegisterForm from "@/src/app/[locale]/(auth)/_components/user-register-form";

export const metadata = {
  title: "Accept invitation",
};

export default async function Page({
  params: { invitationSharedId },
}: {
  params: { invitationSharedId: string };
}) {
  const user = await getMaybeUser();

  return (
    <SignInViewPage>
      <UserRegisterForm user={user} shareInvitationId={invitationSharedId} />
    </SignInViewPage>
  );
}
