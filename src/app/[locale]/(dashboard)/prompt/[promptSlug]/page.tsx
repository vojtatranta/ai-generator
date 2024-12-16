import { searchParamsCache } from "@/web/lib/searchparams";
import React from "react";
import { getTranslations } from "next-intl/server";
import { SearchParams } from "nuqs";
import { PromptQueryPage } from "../_components/PromptQueryPage";
import { PROMPTS, PROMPTS_UNION } from "@/constants/data";
import { notFound } from "next/navigation";

type pageProps = {
  searchParams: Promise<SearchParams>;
  params: Promise<{ promptSlug: string }>;
};

export async function generateMetadata() {
  const t = await getTranslations("metadata.dashboard");
  return {
    title: t("quizes"),
  };
}

export default async function Page({ searchParams, params }: pageProps) {
  // Allow nested RSCs to access the search params (in a type-safe way)
  searchParamsCache.parse(await searchParams);

  const slug = (await params).promptSlug;
  if (!slug || !Object.entries(PROMPTS).some(([_, value]) => value === slug)) {
    notFound();
  }

  return <PromptQueryPage promptSlug={slug as PROMPTS_UNION} />;
}
