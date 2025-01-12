"use client";
import { Maybe } from "actual-maybe";
import { Input } from "./input";
import { Label } from "./label";
import { Loader2, Upload } from "lucide-react";
import { memo } from "react";
import { useTranslations } from "next-intl";

export const SimpleFileUpload = memo(function SimpleFileUpload({
  fileUploading,
  fileToUpload,
  accept,
  onFile,
}: {
  fileToUpload?: File;
  fileUploading?: boolean;
  accept?: string;
  className?: string;
  onFile: (file: File) => void;
}) {
  const t = useTranslations();
  return (
    <div className="mt-1 flex">
      <Input
        id="file-upload"
        type="file"
        accept={accept ?? ".txt,.pdf, .mp3"}
        onChange={(input) => {
          Maybe.fromFirst(Array.from(input.currentTarget.files ?? [])).andThen(
            onFile,
          );
        }}
        className="sr-only"
      />
      <Label
        htmlFor="file-upload"
        className="cursor-pointer bg-background flex flex-row items-center py-2 px-3 border rounded-l-md shadow-sm text-sm font-medium text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      >
        {fileUploading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Upload className="w-4 h-4 mr-2 inline-block" />
        )}
        {t("prompt.uploadFileInputLabel")}
      </Label>
      <span className="flex-1 bg-background py-2 px-3 text-sm border border-l-0 rounded-r-md">
        {fileToUpload ? fileToUpload.name : t("prompt.noFileSelected")}
      </span>
    </div>
  );
});
