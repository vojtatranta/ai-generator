"use client";
import { Checkbox } from "@/web/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./cell-action";
import { Question } from "@/web/lib/supabase-server";
import { CopyableText } from "@/web/components/CopyableText";
import { useTranslations } from "next-intl";

export const useQuestionsColumns = (): ColumnDef<Question>[] => {
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
      accessorKey: "text",
      header: t("common.table.question"),
    },
    {
      accessorKey: "options",
      header: t("common.table.options"),
      cell: ({ row }) => (
        <CopyableText>{JSON.stringify(row.original.options)}</CopyableText>
      ),
    },
    {
      id: "actions",
      header: t("common.table.actions"),
      cell: ({ row }) => <CellAction data={row.original} />,
    },
  ];
};
