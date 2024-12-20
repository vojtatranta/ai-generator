import { searchParamsCache } from "@/web/lib/searchparams";
import { SearchParams } from "nuqs";
import React from "react";
import ProfileViewPage from "./_components/profile-view-page";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("metadata.dashboard");
  return {
    title: t("profile"),
  };
}

export default async function Page() {
  return <ProfileViewPage />;
}
