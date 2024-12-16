"use client";

import { DataTable } from "@/web/components/ui/table/data-table";
import { DataTableFilterBox } from "@/web/components/ui/table/data-table-filter-box";
import { DataTableResetFilter } from "@/web/components/ui/table/data-table-reset-filter";
import { DataTableSearch } from "@/web/components/ui/table/data-table-search";
import { Answer } from "@/web/lib/supabase-server";
import { getAnswerColumns } from "./columns";
import { useAnswersTableFilters } from "./use-answers-table-filters";
import { useTranslations } from "next-intl";

export default function AnswersTable({
  data,
  totalData,
  quizIds,
}: {
  data: Answer[];
  totalData: number;
  quizIds: { value: string | number; label: string }[];
}) {
  const t = useTranslations("answers");
  const {
    isAnyFilterActive,
    resetFilters,
    searchQuery,
    setPage,
    setSearchQuery,
    quizFilter,
    setQuizFilter,
  } = useAnswersTableFilters();
  const answerColumns = getAnswerColumns(t);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <DataTableSearch
          searchKey="name"
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
        <DataTableFilterBox
          filterKey="quiz"
          options={quizIds.map(({ value, label }) => ({
            value: value.toString(),
            label,
          }))}
          title={t("quizFilterTitle")}
          setFilterValue={setQuizFilter}
          filterValue={quizFilter}
        />
        <DataTableResetFilter
          isFilterActive={isAnyFilterActive}
          onReset={resetFilters}
        />
      </div>
      <DataTable columns={answerColumns} data={data} totalItems={totalData} />
    </div>
  );
}
