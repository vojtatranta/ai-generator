"use client";

import { searchParams } from "@/web/lib/searchparams";
import { useQueryState } from "nuqs";
import { useCallback, useMemo } from "react";

export function useAnswersTableFilters() {
  const [searchQuery, setSearchQuery] = useQueryState(
    "q",
    searchParams.q
      .withOptions({ shallow: false, throttleMs: 1000 })
      .withDefault(""),
  );

  const [quizFilter, setQuizFilter] = useQueryState(
    "quizId",
    searchParams.quizId.withOptions({
      shallow: false,
      throttleMs: 1000,
    }),
  );

  const [page, setPage] = useQueryState(
    "page",
    searchParams.page.withDefault(1),
  );

  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setQuizFilter(null);
    setPage(1);
  }, [setSearchQuery, setQuizFilter, setPage]);

  const isAnyFilterActive = useMemo(() => {
    return !!searchQuery || !!quizFilter;
  }, [quizFilter, searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    resetFilters,
    setQuizFilter,
    quizFilter,
    isAnyFilterActive,
  };
}
