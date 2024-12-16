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
import ProductCategoriesTable from "./products-tables";
import {
  createSupabaseServerClient,
  getUser,
  ProductCategory,
  User,
} from "@/web/lib/supabase-server";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/database.types";
import ProductsTable from "./products-tables";
import { getTranslations } from "next-intl/server";

type TProductsListingPage = {};

const createProductsQuery = (
  supabase: SupabaseClient<Database>,
  filters: {
    page: number | undefined;
    limit: number | undefined;
    search?: string;
  },
  params: {
    user: User;
    count?: boolean;
    categoryId?: number;
  },
) => {
  const baseQuery = supabase
    .from("products")
    .select("*", { count: params.count ? "exact" : undefined })
    .eq("user", params.user.id);

  if (filters.search) {
    baseQuery.ilike("name", `%${filters.search}%`);
  }

  if (params.categoryId) {
    baseQuery.eq("category_xml_id", params.categoryId);
  }

  return baseQuery;
};

export default async function ProductsListingPage({}: TProductsListingPage) {
  const page = searchParamsCache.get("page");
  const search = searchParamsCache.get("q");
  const pageLimit = searchParamsCache.get("limit");
  const supabase = await createSupabaseServerClient();
  const user = await getUser();

  const [totalProducts, pageProducts, t] = await Promise.all([
    createProductsQuery(
      supabase,
      {
        page: Number(page || 1),
        limit: Number(pageLimit || 10),
        search: search ?? "",
      },
      {
        user,
        count: true,
      },
    ),
    createProductsQuery(
      supabase,
      {
        page: Number(page || 1),
        limit: Number(pageLimit || 10),
        search: search ?? "",
      },
      {
        user,
      },
    ),
    getTranslations(),
  ]);

  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <Heading
            title={`${t("products.listing.title")}  (${totalProducts.count})`}
            description={t("products.listing.description")}
          />

          <Link
            href={"/products/new"}
            className={cn(buttonVariants({ variant: "default" }))}
          >
            <Plus className="mr-2 h-4 w-4" /> {t("products.listing.addNew")}
          </Link>
        </div>
        <Separator />
        <ProductsTable
          data={pageProducts.data ?? []}
          totalData={totalProducts.count ?? 0}
        />
      </div>
    </PageContainer>
  );
}
