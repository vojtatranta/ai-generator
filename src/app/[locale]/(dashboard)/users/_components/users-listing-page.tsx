import PageContainer from "@/web/components/layout/page-container";
import { buttonVariants } from "@/web/components/ui/button";
import { Heading } from "@/web/components/ui/heading";
import { Separator } from "@/web/components/ui/separator";
import { searchParamsCache } from "@/web/lib/searchparams";
import { cn } from "@/web/lib/utils";
import { Plus } from "lucide-react";
import Link from "next/link";
import UsersTable from "./users-tables";
import { createSupabaseServerClient, User } from "@/web/lib/supabase-server";
import { getTranslations } from "next-intl/server";

type TUsersListingPage = {};

export default async function UsersListingPage({}: TUsersListingPage) {
  // Showcasing the use of search params cache in nested RSCs
  const page = searchParamsCache.get("page");
  const search = searchParamsCache.get("q");
  const pageLimit = searchParamsCache.get("limit");
  const supabase = await createSupabaseServerClient();
  const [totalUsers, pageUsers, t] = await Promise.all([
    supabase.auth.admin.listUsers().then((res) => res.data?.users.length),
    supabase.auth.admin.listUsers({
      page: Number(page || 1),
      perPage: Number(pageLimit || 10),
    }),
    getTranslations(),
  ]);

  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search }),
  };

  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <Heading
            title={`${t("users.listing.title")} (${totalUsers})`}
            description={t("users.listing.description")}
          />

          <Link
            href={"/users/new"}
            className={cn(buttonVariants({ variant: "default" }))}
          >
            <Plus className="mr-2 h-4 w-4" /> {t("users.listing.addNew")}
          </Link>
        </div>
        <Separator />
        <UsersTable
          data={pageUsers.data?.users ?? []}
          totalData={totalUsers ?? 0}
        />
      </div>
    </PageContainer>
  );
}
