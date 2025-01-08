import { Badge } from "@/components/ui/badge";
import { Maybe } from "actual-maybe";
import { memo } from "react";
import { FileType } from "@/lib/supabase-server";

interface SelectedFilesDisplayProps {
  selectedFiles: Set<number>;
  fileList: FileType[] | undefined;
}

export const SelectedFilesDisplay = memo(function SelectedFilesDisplay({
  selectedFiles,
  fileList,
}: SelectedFilesDisplayProps) {
  return (
    <div>
      {Array.from(selectedFiles).map((fileId) =>
        Maybe.of(fileList?.find((f) => f.id === fileId))
          .andThen((file) => (
            <Badge key={file.id} variant="secondary" className="ml-2">
              {file.filename}
            </Badge>
          ))
          .orNull(),
      )}
    </div>
  );
});
