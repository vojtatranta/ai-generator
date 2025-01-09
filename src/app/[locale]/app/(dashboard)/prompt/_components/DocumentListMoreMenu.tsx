"use client";

import { memo, useState } from "react";
import { MoreHorizontal, MoreVertical, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "next-intl";
import { AlertModal } from "@/components/modal/alert-modal";

interface DocumentListMoreMenuProps {
  idToDelete: number;
  onDelete: (id: number) => Promise<unknown>;
  onRefetch?: () => void;
}

export const DocumentListMoreMenu = memo(function DocumentListMoreMenu({
  idToDelete,
  onDelete,
  onRefetch,
}: DocumentListMoreMenuProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const t = useTranslations();

  const onConfirm = async () => {
    try {
      setLoading(true);
      await onDelete(idToDelete);
      setOpen(false);
    } catch (error) {
      console.error("Error deleting document:", error);
    } finally {
      setLoading(false);
      onRefetch?.();
    }
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        loading={loading}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <span className="sr-only">{t("common.actions.open")}</span>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{t("common.actions.title")}</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => setOpen(true)}
            className="text-red-600"
          >
            <Trash className="mr-2 h-4 w-4" />
            {t("common.actions.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
});
