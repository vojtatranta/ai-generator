"use client";

import { DataTable } from "@/web/components/ui/table/data-table";
import { DataTableFilterBox } from "@/web/components/ui/table/data-table-filter-box";
import { DataTableResetFilter } from "@/web/components/ui/table/data-table-reset-filter";
import { DataTableSearch } from "@/web/components/ui/table/data-table-search";
import { ProductCategory } from "@/web/lib/supabase-server";
import { useProductCategoriesColumns } from "./columns";
import {
  GENDER_OPTIONS,
  useProductCategoriesTableFilters,
} from "./use-product-categories-table-filters";

export default function ProductCategoriesTable({
  data,
  totalData,
}: {
  data: ProductCategory[];
  totalData: number;
}) {
  const {
    isAnyFilterActive,
    resetFilters,
    searchQuery,
    setPage,
    setSearchQuery,
  } = useProductCategoriesTableFilters();

  const productCategoriesColumns = useProductCategoriesColumns();

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
      <DataTable
        columns={productCategoriesColumns}
        data={data}
        totalItems={totalData}
      />
    </div>
  );
}
