"use client";
import { Checkbox } from "@/web/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./cell-action";
import { CopyableText } from "@/web/components/CopyableText";
import { ProductAttribute } from "@/web/lib/supabase-server";
import Link from "next/link";
import { useTranslations } from "next-intl";

export const useProductAttributesColumns =
  (): ColumnDef<ProductAttribute>[] => {
    const t = useTranslations();

    return [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
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
        header: t("common.table.title"),
      },
      {
        accessorKey: "description",
        header: t("common.table.description"),
      },

      {
        id: "actions",
        cell: ({ row }) => <CellAction data={row.original} />,
      },
    ];
  };
