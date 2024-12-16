"use client";

import { DataTable } from "@/web/components/ui/table/data-table";
import { DataTableFilterBox } from "@/web/components/ui/table/data-table-filter-box";
import { DataTableResetFilter } from "@/web/components/ui/table/data-table-reset-filter";
import { DataTableSearch } from "@/web/components/ui/table/data-table-search";
import { userColumns } from "./columns";
import {
  GENDER_OPTIONS,
  useSocketsTableFilters,
} from "./use-employee-table-filters";
import { type User } from "@/web/lib/supabase-server";
import { Database } from "@/web/database.types";
import { useMemo } from "react";

export default function UsersTable({
  data,
  totalData,
}: {
  data: User[];
  totalData: number;
}) {
  const {
    isAnyFilterActive,
    resetFilters,
    searchQuery,
    setPage,
    setSearchQuery,
  } = useSocketsTableFilters();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <DataTableSearch
          searchKey="name"
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
        {/* <DataTableFilterBox
          filterKey="gender"
          title="Gender"
          options={GENDER_OPTIONS}
          setFilterValue={setGenderFilter}
          filterValue={genderFilter}
        /> */}
        <DataTableResetFilter
          isFilterActive={isAnyFilterActive}
          onReset={resetFilters}
        />
      </div>
      <DataTable columns={userColumns} data={data} totalItems={totalData} />
    </div>
  );
}
