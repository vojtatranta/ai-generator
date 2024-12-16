"use client";
import { Checkbox } from "@/web/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./cell-action";
import { Quiz } from "@/web/lib/supabase-server";
import { CopyableText } from "@/web/components/CopyableText";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

export const useQuizzesColumns = () => {
  const t = useTranslations();

  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label={t("quiz.listing.selectAll")}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={t("quiz.listing.selectRow")}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "id",
      header: t("quiz.listing.columns.id"),
    },
    {
      accessorKey: "created_at",
      header: t("quiz.listing.columns.createdAt"),
      cell: ({ row }) => (
        <CopyableText>
          {new Date(row.original.created_at).toLocaleString()}
        </CopyableText>
      ),
    },
    {
      accessorKey: "published",
      header: t("quiz.listing.columns.published"),
      cell: ({ row }) => (
        <Badge variant={row.original.published ? "default" : "secondary"}>
          {row.original.published
            ? t("quiz.listing.columns.yes")
            : t("quiz.listing.columns.no")}
        </Badge>
      ),
    },
    {
      accessorKey: "uuid",
      header: t("quiz.listing.columns.uuid"),
    },
    {
      accessorKey: "name",
      header: t("quiz.listing.columns.name"),
    },
    {
      accessorKey: "description",
      header: t("quiz.listing.columns.description"),
    },
    {
      id: "actions",
      cell: ({ row }) => <CellAction data={row.original} />,
    },
  ] as ColumnDef<Quiz>[];
};
