import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Maybe } from "actual-maybe";
import Image from "next/image";
import { useState } from "react";

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
}

export function ImagePreviewModal({
  isOpen,
  onClose,
  imageUrl,
}: ImagePreviewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-0">
        <div className="relative flex w-full h-full min-h-[80vh] text-center items-center justify-center">
          <img
            src={imageUrl}
            alt="Preview"
            style={{ height: "100%", width: "auto" }}
            className="object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const WrappableImagePreviewModal = ({
  src,
  children,
}: {
  src: string | null | undefined;
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {Maybe.of(src)
        .andThen((realSrc) => (
          <ImagePreviewModal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            imageUrl={realSrc}
          />
        ))
        .getValue(null)}

      <div
        className="cursor-nesw-resize"
        onClick={() => {
          if (!src) return;
          setIsOpen(true);
        }}
      >
        {children}
      </div>
    </>
  );
};
