"use client";
import { useTranslations } from "next-intl";
import { Button } from "../button";

type DataTableResetFilterProps = {
  isFilterActive: boolean;
  onReset: () => void;
};

export function DataTableResetFilter({
  isFilterActive,
  onReset,
}: DataTableResetFilterProps) {
  const t = useTranslations("common");
  return (
    <>
      {isFilterActive ? (
        <Button variant="outline" onClick={onReset}>
          {t("resetFilters")}
        </Button>
      ) : null}
    </>
  );
}
