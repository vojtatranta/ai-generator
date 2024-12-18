"use client";

import { DataTable } from "@/web/components/ui/table/data-table";
import { DataTableResetFilter } from "@/web/components/ui/table/data-table-reset-filter";
import { DataTableSearch } from "@/web/components/ui/table/data-table-search";
import { usePromptTemplatesColumns } from "./columns";
import { usePromptTemplatesTableFilters } from "./use-quiz-table-filters";
import { UsedPromptType } from "@/constants/data";
import { useLocale } from "next-intl";

export default function AssistantChatContainer() {
  const locale = useLocale();
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <iframe
          src={`https://app.langtail.com/shared-assistant/cm4u2myqo000hetqu4gom1gnz?embed=1#language=${locale}`}
          width="500px"
          height="100%"
          style={{ minHeight: "620px" }}
          frameBorder="0"
        />
      </div>
    </div>
  );
}
