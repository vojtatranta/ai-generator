import { searchParamsCache } from "@/web/lib/searchparams";
import { SearchParams } from "nuqs/parsers";
import React from "react";
import ProfileViewPage from "./_components/profile-view-page";
import { getTranslations } from "next-intl/server";

type pageProps = {
  searchParams: SearchParams;
};

export async function generateMetadata() {
  const t = await getTranslations("metadata.dashboard");
  return {
    title: t("profile"),
  };
}

export default async function Page({ searchParams }: pageProps) {
  return <ProfileViewPage />;
}
