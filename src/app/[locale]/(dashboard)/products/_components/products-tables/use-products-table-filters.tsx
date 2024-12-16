"use client";

import { searchParams } from "@/web/lib/searchparams";
import { useQueryState } from "nuqs";
import { useCallback, useMemo } from "react";

export const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

export function useProductsTableFilters() {
  const [searchQuery, setSearchQuery] = useQueryState(
    "q",
    searchParams.q
      .withOptions({ shallow: false, throttleMs: 1000 })
      .withDefault(""),
  );

  const [categoryId, setCategoryId] = useQueryState(
    "categoryId",
    searchParams.categoryId,
  );

  const [page, setPage] = useQueryState(
    "page",
    searchParams.page.withDefault(1),
  );

  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setCategoryId(null);
    setPage(1);
  }, [setSearchQuery, setCategoryId, setPage]);

  const isAnyFilterActive = useMemo(() => {
    return !!searchQuery || !!categoryId;
  }, [searchQuery, categoryId]);

  return {
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    resetFilters,
    isAnyFilterActive,
  };
}
