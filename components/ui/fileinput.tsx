import * as React from "react";
import { cn } from "@/web/lib/utils";

export interface FileInputProps {
  className?: string;
  currentImageUrl?: string;
  placeholder?: string;
  children?: React.ReactNode;
  value?: string | null;
  accept?: string;
  onFileSelect?: (file: File | null, base64: string) => void;
  onFileOnlySelect?: (file: File | null) => void;
}

export const FileInput = React.forwardRef<HTMLDivElement, FileInputProps>(
  (
    {
      accept = "image/*",
      className,
      currentImageUrl,
      value,
      placeholder,
      children,
      onFileSelect,
      onFileOnlySelect,
    },
    ref,
  ) => {
    const [isDragging, setIsDragging] = React.useState(false);

    const handleFile = React.useCallback(
      (file: File) => {
        const reader = new FileReader();
        onFileOnlySelect?.(file);
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          onFileSelect?.(file, base64);
        };
        reader.readAsDataURL(file);
      },
      [onFileSelect, onFileOnlySelect],
    );

    const onDrop = React.useCallback(
      (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
          handleFile(file);
        }
      },
      [handleFile],
    );

    const onFileChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
          handleFile(file);
        }
      },
      [handleFile],
    );

    return (
      <>
        <div
          ref={ref}
          className={cn(
            "relative flex h-[80px] w-full items-center rounded-md border border-dashed border-input bg-transparent p-4 text-sm shadow-sm transition-colors hover:border-accent",
            isDragging && "border-primary",
            className,
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
        >
          <input
            type="file"
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={onFileChange}
            accept={accept}
          />

          {currentImageUrl ||
            (value && (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    onClick={() => {
                      onFileSelect?.(null, "");
                      onFileOnlySelect?.(null);
                    }}
                    className="absolute -right-2 -top-2 z-10 rounded-full bg-destructive p-1 text-white hover:bg-destructive/90"
                    type="button"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                  <div
                    className="h-12 w-12 rounded-full bg-cover bg-center bg-gray-100"
                    style={{
                      backgroundImage: `url(${currentImageUrl})`,
                    }}
                  />
                  {value && (
                    <div className="text-ellipsis overflow-hidden text-sm font-medium">
                      {value.slice(0, 15)}
                      {value.length > 15 ? "..." : ""}
                    </div>
                  )}
                </div>
              </div>
            ))}
          <p className="text-muted-foreground w-full text-center">
            {placeholder ?? "Drag and drop an image or click to select"}
          </p>
        </div>
        {children}
      </>
    );
  },
);

FileInput.displayName = "FileInput";
