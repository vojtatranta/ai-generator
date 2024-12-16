"use client";
import { useQuery } from "@supabase-cache-helpers/postgrest-react-query";
import { useSupabase } from "@/web/lib/supabase-client";
import { memo, useCallback } from "react";
import { GeneralOptionSelect } from "./GeneralOptionSelect";

const NO_PRODUCT_CATEGORY_VALUE = "no-product-category" as const;

export const ProductCategoriesSelect = memo(function ProductCategoriesSelect({
  disabledIds,
  userId,
  value,
  onChange,
}: {
  disabledIds?: (string | null | undefined)[];
  userId: string;
  value: string | null | undefined;
  onChange?: (id: string) => void;
}) {
  const supabase = useSupabase();
  const { data } = useQuery(
    supabase
      .from("product_categories")
      .select("*")
      .eq("user", userId)
      .order("name", {
        ascending: true,
      }),
  );

  const selectOptions = [
    {
      value: NO_PRODUCT_CATEGORY_VALUE as string,
      label: "No product category",
    },
    ...(data ?? []).map((productCategory) => ({
      value: productCategory.id,
      label: productCategory.name ?? "",
    })),
  ];

  return (
    <GeneralOptionSelect
      defaultValue={value}
      disabledIds={[NO_PRODUCT_CATEGORY_VALUE, ...(disabledIds ?? [])]}
      options={selectOptions}
      placeholder="Select a product category"
      searchPlaceholder="Search for a product category"
      value={value}
      onChange={useCallback(
        (id: string | number) => {
          if (id !== NO_PRODUCT_CATEGORY_VALUE) {
            onChange?.(String(id));
          }
        },
        [onChange],
      )}
    />
  );
});
