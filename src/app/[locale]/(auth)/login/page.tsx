import { Metadata } from "next";
import SignInViewPage from "../_components/sigin-view";
import UserAuthForm from "../_components/user-auth-form";
import { searchParams } from "@/web/lib/searchparams";

export const metadata: Metadata = {
  title: "Authentication | Sign In",
  description: "Sign In page for authentication.",
};

export default function Page({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  return (
    <SignInViewPage>
      <UserAuthForm />
    </SignInViewPage>
  );
}
