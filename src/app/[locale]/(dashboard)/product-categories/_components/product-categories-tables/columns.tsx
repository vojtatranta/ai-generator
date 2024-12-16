"use client";
import { Checkbox } from "@/web/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./cell-action";
import { CopyableText } from "@/web/components/CopyableText";
import { ProductCategory } from "@/web/lib/supabase-server";
import { useTranslations } from "next-intl";

export const useProductCategoriesColumns = (): ColumnDef<ProductCategory>[] => {
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
      accessorKey: "name",
      header: t("common.table.name"),
    },
    {
      accessorKey: "xml_id",
      header: t("common.table.xmlId"),
    },
    {
      id: "actions",
      cell: ({ row }) => <CellAction data={row.original} />,
    },
  ];
};
