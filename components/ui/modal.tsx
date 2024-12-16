"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/web/components/ui/dialog";

interface ModalProps {
  title?: string;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  dialogContentClassName?: string;
}

export const Modal: React.FC<ModalProps> = ({
  title,
  description,
  isOpen,
  dialogContentClassName,
  onClose,
  children,
}) => {
  const onChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onChange}>
      <DialogContent className={dialogContentClassName}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div>{children}</div>
      </DialogContent>
    </Dialog>
  );
};
