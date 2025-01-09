"use client";
import { useEffect, useState } from "react";
import { Button } from "@/web/components/ui/button";
import { Modal } from "@/web/components/ui/modal";
import { useTranslations } from "next-intl";
import { Else, If, Then } from "../ui/condition";
import { Loader2, Trash } from "lucide-react";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const t = useTranslations("deleteModal");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <Modal
      title={t("title")}
      description={t("description")}
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="flex w-full items-center justify-end space-x-2 pt-6">
        <Button disabled={loading} variant="outline" onClick={onClose}>
          {t("cancel")}
        </Button>
        <Button disabled={loading} variant="destructive" onClick={onConfirm}>
          <If condition={loading}>
            <Then>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            </Then>
            <Else>
              <Trash className="mr-2 h-4 w-4" />
            </Else>
          </If>
          {t("confirm")}
        </Button>
      </div>
    </Modal>
  );
};
