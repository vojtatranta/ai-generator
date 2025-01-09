import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
import { FileType } from "@/lib/supabase-server";
import { DocumentListMoreMenu } from "./DocumentListMoreMenu";
import { trpcApi } from "@/components/providers/TRPCProvider";
import { toast } from "sonner";
import { memo } from "react";

interface DocumentFileListProps {
  fileList: FileType[] | null;
  filesLoading: boolean;
  selectedFiles: Set<number>;
  onSelectedFilesChange: (selectedFiles: Set<number>) => void;
  onRefetch?: () => void;
}

export const DocumentFileList = memo(function DocumentFileList({
  fileList,
  filesLoading,
  selectedFiles,
  onSelectedFilesChange,
  onRefetch,
}: DocumentFileListProps) {
  const t = useTranslations();
  const deleteMutation = trpcApi.filesRouter.deleteFile.useMutation({
    onSuccess: () => {
      toast.success(t("common.messages.deleteSuccess"));
    },
    onError: () => {
      toast.error(t("common.messages.deleteError"));
    },
  });

  return (
    <ScrollArea className="h-[200px] w-full rounded-md border px-2">
      {[...(fileList ?? [])].reverse().map((file) => (
        <div key={file.id} className="flex items-center space-x-2">
          <Checkbox
            id={String(file.id)}
            checked={selectedFiles.has(file.id)}
            onCheckedChange={(checked) => {
              const newSet = new Set<number>([]);

              if (checked) {
                newSet.add(file.id);
              } else {
                newSet.delete(file.id);
              }
              onSelectedFilesChange(newSet);
            }}
          />
          <Label
            htmlFor={String(file.id)}
            className="text-sm  cursor-pointer max-w-[245px] truncate"
          >
            {file.filename}
          </Label>
          <span className="flex-1 text-right text-xs text-muted-foreground">
            {file.created_at
              ? new Intl.DateTimeFormat(undefined, {
                  dateStyle: "short",
                  timeStyle: "short",
                }).format(new Date(file.created_at))
              : ""}
          </span>
          <DocumentListMoreMenu
            idToDelete={file.id}
            onDelete={(idToDelete) =>
              deleteMutation.mutateAsync({
                id: idToDelete,
              })
            }
            onRefetch={onRefetch}
          />
        </div>
      ))}
      {filesLoading && !fileList && (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-center text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 mt-4 animate-spin" />
          </div>
        </div>
      )}

      {!fileList && !filesLoading && (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-center text-sm mt-4 text-muted-foreground max-w-[200px]">
            {t("prompt.documentChatNoFilesEmptyStateText")}
          </div>
        </div>
      )}
    </ScrollArea>
  );
});
