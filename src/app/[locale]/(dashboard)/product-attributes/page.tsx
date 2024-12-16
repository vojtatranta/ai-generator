import { searchParamsCache } from "@/web/lib/searchparams";
import type { SearchParams } from "nuqs";
import React from "react";
import ProductAttributesListingPage from "./_components/product-attributes-listing-page";
import { getTranslations } from "next-intl/server";

type pageProps = {
  searchParams: SearchParams;
};

export async function generateMetadata() {
  const t = await getTranslations("metadata.dashboard");
  return {
    title: t("productAttributes"),
  };
}

export default async function Page({ searchParams }: pageProps) {
  // Allow nested RSCs to access the search params (in a type-safe way)
  searchParamsCache.parse(await searchParams);

  return <ProductAttributesListingPage />;
}
