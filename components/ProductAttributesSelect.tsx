"use client";
import { useQuery } from "@supabase-cache-helpers/postgrest-react-query";
import { useSupabase } from "@/web/lib/supabase-client";
import { memo, useCallback } from "react";
import { GeneralOptionSelect } from "./GeneralOptionSelect";

const NO_PRODUCT_ATTRIBUTE_VALUE = "no-product-attribute" as const;

export const ProductAttributesSelect = memo(function ProductAttributesSelect({
  onChange,
  value,
  userId,
  disabledIds,
}: {
  userId: string;
  value: string | null | undefined;
  onChange: (id: string) => void;
  disabledIds?: (string | null | undefined)[];
}) {
  const supabase = useSupabase();
  const { data } = useQuery(
    supabase
      .from("product_attributes")
      .select("*")
      .eq("user", userId)
      .order("name", {
        ascending: true,
      }),
  );

  const handleChange = useCallback(
    (id: string | number) => {
      if (id !== NO_PRODUCT_ATTRIBUTE_VALUE) {
        onChange(String(id));
      }
    },
    [onChange],
  );

  const selectOptions = [
    {
      value: NO_PRODUCT_ATTRIBUTE_VALUE as string,
      label: "No product attribute",
    },
    ...(data ?? []).map((productCategory) => ({
      value: productCategory.id,
      label: productCategory.name ?? "",
    })),
  ];

  return (
    <GeneralOptionSelect
      defaultValue={value}
      options={selectOptions}
      placeholder="Select a product attribute"
      searchPlaceholder="Search for a product attribute"
      value={value}
      onChange={handleChange}
    />
  );
});
