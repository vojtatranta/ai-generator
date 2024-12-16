import { searchParamsCache } from "@/web/lib/searchparams";
import { SearchParams } from "nuqs/parsers";
import React from "react";
import QuestionsListingPage from "./_components/questions-listing-page";
import { getTranslations } from "next-intl/server";

type pageProps = {
  searchParams: SearchParams;
};

export async function generateMetadata() {
  const t = await getTranslations("metadata.dashboard");
  return {
    title: t("questions"),
  };
}

export default async function Page({ searchParams }: pageProps) {
  // Allow nested RSCs to access the search params (in a type-safe way)
  searchParamsCache.parse(searchParams);

  return <QuestionsListingPage />;
}
