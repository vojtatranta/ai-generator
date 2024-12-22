import { getSureUserPlan, getUserPlan } from "@/lib/stripe";
import KBar from "@/web/components/kbar";
import AppSidebar from "@/web/components/layout/app-sidebar";
import Header from "@/web/components/layout/header";
import { SidebarInset, SidebarProvider } from "@/web/components/ui/sidebar";
import { SupabaseAuthContextProvider } from "@/web/lib/supabase-client";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations();
  return {
    title:
      "AIstein.cz -AI-generated content for social media, blogs, and e-shops.",
    description:
      "AIstein.cz - Create AI-generated content for social media, blogs, and e-shops. Set up your AIstein profile, choose an AI template, and write your content. With AIstein, you can generate content with just one click on the 'Generate content' button and you're done! AIstein is here for you to create content as quickly and efficiently as possible. With AIstein, you can generate content with just one click on the 'Generate content' button and you're done!",
  };
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Persisting the sidebar state in the cookie.
  const cookieStore = await cookies();
  const data = await getSureUserPlan();

  // const auth = auth;
  const defaultOpen = cookieStore.get("sidebar:state")?.value === "true";

  return (
    <SupabaseAuthContextProvider user={data?.user}>
      <KBar>
        <SidebarProvider defaultOpen={defaultOpen}>
          <AppSidebar user={data?.user} />
          <SidebarInset>
            <Header />
            {/* page main content */}
            {children}
            {/* page main content ends */}
          </SidebarInset>
        </SidebarProvider>
      </KBar>
    </SupabaseAuthContextProvider>
  );
}
