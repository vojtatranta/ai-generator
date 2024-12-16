"use client";

import { DataTable } from "@/web/components/ui/table/data-table";
import { DataTableResetFilter } from "@/web/components/ui/table/data-table-reset-filter";
import { DataTableSearch } from "@/web/components/ui/table/data-table-search";
import { Question, Quiz } from "@/web/lib/supabase-server";
import { useQuizzesColumns } from "./columns";
import { useQuizesTableFilters } from "./use-quiz-table-filters";

export default function QuizesTable({
  data,
  totalData,
}: {
  data: Quiz[];
  totalData: number;
}) {
  const {
    isAnyFilterActive,
    resetFilters,
    searchQuery,
    setPage,
    setSearchQuery,
  } = useQuizesTableFilters();

  const columns = useQuizzesColumns();

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
