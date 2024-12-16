import PageContainer from "@/web/components/layout/page-container";
import { buttonVariants } from "@/web/components/ui/button";
import { Heading } from "@/web/components/ui/heading";
import { Separator } from "@/web/components/ui/separator";
import { searchParamsCache } from "@/web/lib/searchparams";
import { cn } from "@/web/lib/utils";
import { Plus } from "lucide-react";
import Link from "next/link";
import PromptTemplatesTable from "./prompt-templates-tables";
import { getTranslations } from "next-intl/server";
import { USED_PROMPTS } from "@/constants/data";

type TSocketsListingPage = {};

export default async function PromptTemplatesListingPage({}: TSocketsListingPage) {
  // Showcasing the use of search params cache in nested RSCs
  const page = searchParamsCache.get("page");
  const search = searchParamsCache.get("q");
  const pageLimit = searchParamsCache.get("limit");
  const t = await getTranslations();

  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search }),
  };
  const promptTemplates = USED_PROMPTS.filter((p) => {
    if (filters.search) {
      return (
        p.prompt.toLowerCase().includes(filters.search) ||
        t(p.description).toLowerCase().includes(filters.search) ||
        t(p.title).toLowerCase().includes(filters.search)
      );
    }

    return true;
  });
  const totalPromptTemplates = promptTemplates.length;

  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <Heading
            title={`${t("promptTemplates.listing.title")} (${totalPromptTemplates})`}
            description={t("promptTemplates.listing.description")}
          />

          {/* <Link
            href={"/quizes/new"}
            className={cn(buttonVariants({ variant: "default" }))}
          >
            <Plus className="mr-2 h-4 w-4" />{" "}
            {t("promptTemplate.listing.addNew")}
          </Link> */}
        </div>
        <Separator />
        <PromptTemplatesTable
          data={promptTemplates}
          totalData={totalPromptTemplates}
        />
      </div>
    </PageContainer>
  );
}
