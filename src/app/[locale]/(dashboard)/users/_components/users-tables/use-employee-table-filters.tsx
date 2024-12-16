"use client";

import { searchParams } from "@/web/lib/searchparams";
import { useQueryState } from "nuqs";
import { useCallback, useMemo } from "react";

export const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

export function useSocketsTableFilters() {
  const [searchQuery, setSearchQuery] = useQueryState(
    "q",
    searchParams.q
      .withOptions({ shallow: false, throttleMs: 1000 })
      .withDefault(""),
  );

  const [page, setPage] = useQueryState(
    "page",
    searchParams.page.withDefault(1),
  );

  const resetFilters = useCallback(() => {
    setSearchQuery(null);

    setPage(1);
  }, [setSearchQuery, setPage]);

  const isAnyFilterActive = useMemo(() => {
    return !!searchQuery;
  }, [searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    resetFilters,
    isAnyFilterActive,
  };
}
