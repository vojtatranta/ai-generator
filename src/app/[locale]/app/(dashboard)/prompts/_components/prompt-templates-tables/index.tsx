"use client";

import { DataTable } from "@/web/components/ui/table/data-table";
import { DataTableResetFilter } from "@/web/components/ui/table/data-table-reset-filter";
import { DataTableSearch } from "@/web/components/ui/table/data-table-search";
import { usePromptTemplatesColumns } from "./columns";
import { usePromptTemplatesTableFilters } from "./use-quiz-table-filters";
import { UsedPromptType } from "@/constants/data";

export default function PromptTemplatesTable({
  data,
  totalData,
}: {
  data: UsedPromptType[];
  totalData: number;
}) {
  const {
    isAnyFilterActive,
    resetFilters,
    searchQuery,
    setPage,
    setSearchQuery,
  } = usePromptTemplatesTableFilters();

  const columns = usePromptTemplatesColumns();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <DataTableSearch
          searchKey="name"
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
        <DataTableResetFilter
          isFilterActive={isAnyFilterActive}
          onReset={resetFilters}
        />
      </div>
      <DataTable columns={columns} data={data} totalItems={totalData} />
    </div>
  );
}
