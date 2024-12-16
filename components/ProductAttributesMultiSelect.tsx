"use client";
import { useQuery } from "@supabase-cache-helpers/postgrest-react-query";
import { useSupabase } from "@/web/lib/supabase-client";
import { memo } from "react";
import { MultiSelect } from "./ui/multi-select";

export const ProductAttributesMultiSelect = memo(
  function ProductAttributesMultiSelect({
    onChange,
    values,
    userId,
    ...rest
  }: {
    userId: string;
    values: (number | string)[] | null | undefined;
  } & Omit<React.ComponentProps<typeof MultiSelect>, "options">) {
    const valuesSet = new Set(values ?? []);
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

    return (
      <MultiSelect
        {...rest}
        options={
          data?.map((productCategory) => ({
            label: String(productCategory.name),
            value: String(productCategory.id),
          })) ?? []
        }
        defaultValue={Array.from(valuesSet).map(String)}
      />
    );
  },
);
