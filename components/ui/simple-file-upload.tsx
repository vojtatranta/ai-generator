"use client";
import { Maybe } from "actual-maybe";
import { Input } from "./input";
import { Label } from "./label";
import { Loader2, Upload } from "lucide-react";
import { memo, useState } from "react";
import { useTranslations } from "next-intl";
import EventEmitter from "events";
import { If, Then } from "./condition";

export interface ISimpleFileUploadEmitter {
  onStart: (cb: (opts: { totalSize: number }) => void) => void;
  onProgress: (
    cb: (opts: { progress: number; totalSize: number }) => void
  ) => void;
  emitProgress: (opts: { progress: number; totalSize: number }) => void;
  emitComplete: () => void;
  emitStart: (opts: { totalSize: number }) => void;
  onComplete: (cb: () => void) => void;
}

export class SimpleFileUploadEmitter
  extends EventEmitter
  implements ISimpleFileUploadEmitter
{
  emitProgress(opts: { progress: number; totalSize: number }) {
    this.emit("progress", opts);
  }

  emitComplete() {
    this.emit("complete");
    this.removeAllListeners();
  }

  emitStart(opts: { totalSize: number }) {
    this.emit("start", opts);
  }

  onStart(cb: (opts: { totalSize: number }) => void) {
    this.on("start", cb);
  }

  onProgress(cb: (opts: { progress: number; totalSize: number }) => void) {
    this.on("progress", cb);
  }

  onComplete(cb: () => void) {
    this.on("complete", cb);
  }
}

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
  onFile: (
    file: File
  ) => undefined | SimpleFileUploadEmitter | Promise<ISimpleFileUploadEmitter>;
}) {
  const t = useTranslations();
  const [state, setState] = useState<{
    total: number;
    progress: number;
  } | null>(null);

  return (
    <div className="mt-1 flex">
      <Input
        id="file-upload"
        type="file"
        accept={accept ?? ".txt,.pdf, .mp3"}
        onChange={(input) => {
          Maybe.fromFirst(Array.from(input.currentTarget.files ?? []))
            .andThen(onFile)
            .andThen((maybeEmitter) => {
              Promise.resolve(maybeEmitter).then((emitter) => {
                emitter.onStart((opts) => {
                  setState({
                    total: opts.totalSize,
                    progress: 0,
                  });
                });

                emitter.onProgress((opts) => {
                  setState((prev) =>
                    Maybe.of(
                      prev ?? {
                        total: 0,
                        progress: 0,
                      }
                    )
                      .andThen((prev) => ({
                        ...prev,
                        progress: opts.progress,
                      }))
                      .orNull()
                  );
                });

                emitter.onComplete(() => {
                  setState(null);
                  // onFile(opts.file);
                });
              });
            });
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
      <div className="flex-1 bg-background py-2 px-3 text-sm border border-l-0 rounded-r-md relative">
        <If condition={!state}>
          <Then>
            {fileToUpload ? fileToUpload.name : t("prompt.noFileSelected")}
          </Then>
        </If>
        {state && (
          <div
            className="bg-primary/5 absolute inset-0"
            style={{
              width: `${state.progress}%`,
            }}
          />
        )}
      </div>
    </div>
  );
});
