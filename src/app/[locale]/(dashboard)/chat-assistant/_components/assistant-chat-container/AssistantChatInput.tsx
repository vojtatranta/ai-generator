import { memo } from "react";
import { Image, X } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

const maxSizeInBytes = 5 * 1024 * 1024;

export function promptForImage(): Promise<{
  imageBase64: string;
  type: string;
}> {
  return new Promise((resolve, reject) => {
    const id = `file-input-${uuidv4()}`;
    const input = document.createElement("input");
    input.id = id;
    input.type = "file";
    input.multiple = false;
    input.accept = "image/*";
    input.onchange = () => {
      const firstFile = input.files?.[0];
      if (firstFile) {
        if (firstFile.size > maxSizeInBytes) {
          reject(
            new Error(
              `File size exceeds ${Math.round(
                maxSizeInBytes / 1024 / 1024,
              )}MB limit`,
            ),
          );
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result !== "string") {
            reject(new Error("No data"));
            return;
          }

          const imageBase64 = reader.result?.split(",")[1];
          if (imageBase64) {
            const type = firstFile.type.split("/").at(-1) ?? "jpeg";
            resolve({ imageBase64, type });
            return;
          }
          reject(new Error("No data"));
        };
        reader.readAsDataURL(firstFile);
      }
    };
    input.click();
  });
}

export const AssistantImageInput = memo(function AssistantImageInput({
  image,
  imageSupport,
  setImage,
  className,
}: {
  image?: string;
  imageSupport: boolean;
  setImage: (base64Image: string) => void;
  className?: string;
}) {
  if (!imageSupport) {
    return null;
  }

  if (image) {
    return (
      <div
        className={cn(
          "absolute left-2 top-[14px] h-8 w-8 sm:left-4",
          className,
        )}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="group relative h-full w-full overflow-hidden rounded-full border bg-background"
              onClick={() => setImage("")}
            >
              <img
                src={image}
                className="h-full w-full object-cover opacity-60 group-hover:opacity-20"
                alt="Image to upload"
              />

              <div className="absolute inset-0 flex items-center justify-center">
                <X size={16} strokeWidth={1.5} />
                <span className="sr-only">Remove Image</span>
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent>Remove Image</TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="absolute left-2 top-[14px] w-8 rounded-full bg-background p-0 sm:left-4"
          onClick={() => {
            promptForImage()
              .then(({ imageBase64, type }) => {
                setImage(`data:image/${type};base64, ${imageBase64}`);
              })
              .catch((err) => {
                alert(`Couldn't get image data. ${err.message}`);
              });
          }}
        >
          <Image className="h-4 w-4" />
          <span className="sr-only">Add Image</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>Add Image</TooltipContent>
    </Tooltip>
  );
});
