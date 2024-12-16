"use client";
import { Checkbox } from "@/web/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./cell-action";
import { CopyableText } from "@/web/components/CopyableText";
import { Product } from "@/web/lib/supabase-server";
import Link from "next/link";
import { useTranslations } from "next-intl";

export const useProductsColumns = (): ColumnDef<Product>[] => {
  const t = useTranslations();

  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label={t("common.selectAll")}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={t("common.selectRow")}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "id",
      header: t("common.table.id"),
    },
    {
      accessorKey: "title",
      header: t("common.table.title"),
    },
    {
      accessorKey: "price",
      header: t("common.table.price"),
    },
    {
      accessorKey: "product_link",
      header: t("common.table.link"),
      cell: ({ row }) => {
        return <CopyableText>{row.original.product_link ?? ""}</CopyableText>;
      },
    },
    {
      accessorKey: "category_xml_id",
      header: t("common.table.category"),
      cell: ({ row }) => {
        const category = row.original.category_xml_id;
        return <Link href={`/product-categories/${category}`}>{category}</Link>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => <CellAction data={row.original} />,
    },
  ];
};
