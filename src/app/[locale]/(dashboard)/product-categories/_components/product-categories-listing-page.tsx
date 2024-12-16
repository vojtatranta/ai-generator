import PageContainer from "@/web/components/layout/page-container";
import { Button, buttonVariants } from "@/web/components/ui/button";
import { Heading } from "@/web/components/ui/heading";
import { Separator } from "@/web/components/ui/separator";
import { Employee } from "@/web/constants/data";
import { fakeUsers } from "@/web/constants/mock-api";
import { searchParamsCache } from "@/web/lib/searchparams";
import { cn } from "@/web/lib/utils";
import { Plus } from "lucide-react";
import Link from "next/link";
import ProductCategoriesTable from "./product-categories-tables";
import {
  createSupabaseServerClient,
  getUser,
  ProductCategory,
  User,
} from "@/web/lib/supabase-server";
import { ImportModalContainer } from "./ImportModalContainer";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/database.types";

type TProductCategoriesListingPage = {};

const createProductCategoriesQuery = (
  supabase: SupabaseClient<Database>,
  filters: {
    page: number | undefined;
    limit: number | undefined;
    search?: string;
  },
  params: {
    user: User;
    count?: boolean;
  },
) => {
  const baseQuery = supabase
    .from("product_categories")
    .select("*", { count: params.count ? "exact" : undefined })
    .eq("user", params.user.id);

  if (filters.search) {
    return baseQuery.ilike("name", `%${filters.search}%`);
  }

  return baseQuery;
};

export default async function ProductCategoriesListingPage({}: TProductCategoriesListingPage) {
  // Showcasing the use of search params cache in nested RSCs
  const page = searchParamsCache.get("page");
  const search = searchParamsCache.get("q");
  const user = await getUser();
  const pageLimit = searchParamsCache.get("limit");
  const supabase = await createSupabaseServerClient();
  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search }),
  };

  const [totalAnswers, pageAnswers] = await Promise.all([
    createProductCategoriesQuery(supabase, filters, {
      user,
      count: true,
    }),
    createProductCategoriesQuery(supabase, filters, {
      user,
    }).range(
      (Number(page || 1) - 1) * Number(pageLimit || 10),
      Number(page || 1) * Number(pageLimit || 10) - 1,
    ),
  ]);

  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <Heading
            title={`Product categories (${totalAnswers.count ?? 0})`}
            description="Manage product categories"
          />

          <ImportModalContainer user={user}>
            <Button variant="default">
              <Plus className="mr-2 h-4 w-4" />
              Import Products from XML
            </Button>
          </ImportModalContainer>
          {/* <Link
            href={"/employee/new"}
            className={cn(buttonVariants({ variant: "default" }))}
          >
            <Plus className="mr-2 h-4 w-4" /> Add New
          </Link> */}
        </div>
        <Separator />
        <ProductCategoriesTable
          data={pageAnswers.data ?? []}
          totalData={totalAnswers.count ?? 0}
        />
      </div>
    </PageContainer>
  );
}
