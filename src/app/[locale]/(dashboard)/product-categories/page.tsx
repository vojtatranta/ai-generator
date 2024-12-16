import { searchParamsCache } from "@/web/lib/searchparams";
import type { SearchParams } from "nuqs";
import React from "react";
import ProductCategoriesListingPage from "./_components/product-categories-listing-page";
import { getTranslations } from "next-intl/server";

type pageProps = {
  searchParams: Promise<SearchParams>;
};

export async function generateMetadata() {
  const t = await getTranslations("metadata.dashboard");
  return {
    title: t("productCategories"),
  };
}

export default async function Page({ searchParams }: pageProps) {
  // Allow nested RSCs to access the search params (in a type-safe way)
  searchParamsCache.parse(await searchParams);

  return <ProductCategoriesListingPage />;
}
