"use client";
import { Checkbox } from "@/web/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./cell-action";
import { CopyableText } from "@/web/components/CopyableText";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import { UsedPromptType } from "@/constants/data";

export const usePromptTemplatesColumns = () => {
  const t = useTranslations();

  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label={t("promptTemplates.listing.selectAll")}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={t("promptTemplates.listing.selectRow")}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: t("promptTemplates.listing.columns.title"),
      cell: ({ row }) => (
        <div className="text-nowrap">
          <CopyableText>{t(row.original.title)}</CopyableText>
        </div>
      ),
    },

    {
      accessorKey: "description",
      header: t("promptTemplates.listing.columns.description"),
      cell: ({ row }) => (
        <CopyableText>{t(row.original.description)}</CopyableText>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => <CellAction data={row.original} />,
    },
  ] as ColumnDef<UsedPromptType>[];
};
