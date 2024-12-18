import { searchParamsCache } from "@/web/lib/searchparams";
import React from "react";
import PromptTemplatesListingPage from "./_components/assistant-chat-page";
import { getTranslations } from "next-intl/server";
import { SearchParams } from "nuqs";
import AssistantChatPage from "./_components/assistant-chat-page";

type pageProps = {
  searchParams: Promise<SearchParams>;
};

export async function generateMetadata() {
  const t = await getTranslations("metadata.assistantChat");
  return {
    title: t("assistantChatMetaTitle"),
  };
}

export default async function Page({ searchParams }: pageProps) {
  // Allow nested RSCs to access the search params (in a type-safe way)
  searchParamsCache.parse(await searchParams);

  return <AssistantChatPage />;
}
