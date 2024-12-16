import { getSureUserPlan, getUserPlan } from "@/lib/stripe";
import KBar from "@/web/components/kbar";
import AppSidebar from "@/web/components/layout/app-sidebar";
import Header from "@/web/components/layout/header";
import { SidebarInset, SidebarProvider } from "@/web/components/ui/sidebar";
import { SupabaseAuthContextProvider } from "@/web/lib/supabase-client";
import type { Metadata } from "next";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Perfect Pick - Pick perfect products for your needs",
  description:
    "Perfect Pick is a product recommendation service that uses AI to suggest the best products for your needs. Create a quiz, answer a few questions, and get matched with products that are tailored to your preferences.",
};

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
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
