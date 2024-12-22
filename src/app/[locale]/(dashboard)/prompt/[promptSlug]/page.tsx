import { searchParamsCache } from "@/web/lib/searchparams";
import React from "react";
import { getTranslations } from "next-intl/server";
import { SearchParams } from "nuqs";
import { PromptQueryPage } from "../_components/PromptQueryPage";
import { notFound } from "next/navigation";
import {
  ARTICLE_SUMMARIZER,
  RANDOM_IMAGE_TOPICS,
  RANDOM_TOPICS,
  USED_PROMPTS,
} from "@/constants/data";
import { PromptImageQueryPage } from "../_components/PromptImageQueryPage";
import { createSupabaseServerClient, getUser } from "@/lib/supabase-server";
import { PromptArticleSummarizerPage } from "../_components/PromptArticleSummarizerPage";

type pageProps = {
  searchParams: Promise<SearchParams>;
  params: Promise<{ promptSlug: string }>;
};

export async function generateMetadata() {
  const t = await getTranslations("metadata");
  return {
    title: t("promptMetadataTitle"),
  };
}

export default async function Page({ searchParams, params }: pageProps) {
  // Allow nested RSCs to access the search params (in a type-safe way)
  searchParamsCache.parse(await searchParams);
  const t = await getTranslations();
  const user = await getUser();
  const supabase = await createSupabaseServerClient();

  const slug = (await params).promptSlug;
  const usedPrompt = USED_PROMPTS.find((p) => p.prompt === slug);
  if (!slug || !usedPrompt) {
    notFound();
  }

  const { data: lastResults } = await supabase
    .from("ai_results")
    .select("*")
    .eq("prompt_slug", slug)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const randomNumberFromImageTopics = Math.floor(
    Math.random() * RANDOM_IMAGE_TOPICS(t).length,
  );

  if (usedPrompt.image) {
    return (
      <PromptImageQueryPage
        aiResults={lastResults ?? []}
        prompt={usedPrompt}
        randomNumberFromImageTopics={randomNumberFromImageTopics}
      />
    );
  }

  const randomNumberFromTopics = Math.floor(
    Math.random() * RANDOM_TOPICS(t).length,
  );

  if (usedPrompt.id === ARTICLE_SUMMARIZER) {
    return (
      <PromptArticleSummarizerPage
        aiResults={lastResults ?? []}
        prompt={usedPrompt}
        randomNumberFromTopics={randomNumberFromTopics}
      />
    );
  }

  return (
    <PromptQueryPage
      aiResults={lastResults ?? []}
      prompt={usedPrompt}
      randomNumberFromTopics={randomNumberFromTopics}
    />
  );
}
