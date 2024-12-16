import { createSupabaseServerClient, getUser } from "@/web/lib/supabase-server";
import { toast } from "sonner";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Confirm invitation acceptance",
};

export default async function ConfirmInvitationAcceptance({
  params: { invitationSharedId },
  searchParams,
}: {
  params: { invitationSharedId: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // const [supabase, userWithRoles] = await Promise.all([
  //   createSupabaseServerClient(),
  //   getUser(),
  // ]);
  // const invitation = await supabase
  //   .from("invitations")
  //   .select("*")
  //   .eq("slug", invitationSharedId)
  //   .single();
  // if (!invitation.data) {
  //   toast.error("Invitation not found");
  //   return redirect("/");
  // }
  // if (!userWithRoles || !userWithRoles.user) {
  //   toast.error("You are not logged in");
  //   return redirect("/");
  // }
  // if (invitation.data.accepted_at || invitation.data.accepted) {
  //   toast.error("Invitation already accepted");
  //   return redirect("/");
  // }
  // if (
  //   invitation.data.expires_at &&
  //   new Date(invitation.data.expires_at) < new Date()
  // ) {
  //   toast.error("Invitation expired");
  //   return redirect("/");
  // }
  // if (invitation.data.invite_email !== userWithRoles.user.email) {
  //   toast.error(
  //     "The e-mail you used for the sign in is not the same as the one used for the invitation",
  //   );
  //   return redirect("/");
  // }
  // const result = await supabase
  //   .from("invitations")
  //   .update({ accepted: true, accepted_at: new Date().toISOString() })
  //   .eq("id", invitation.data.id);
  // if (result.error) {
  //   toast.error("Error accepting invitation");
  //   return redirect("/");
  // }
  // toast.success("Invitation accepted");
  // return redirect("/");
}
