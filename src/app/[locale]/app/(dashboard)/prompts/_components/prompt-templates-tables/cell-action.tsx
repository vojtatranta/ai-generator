"use client";
import { UsedPromptType } from "@/constants/data";
import { getPromptLink } from "@/lib/private-links";
import { useSupabase } from "@/lib/supabase-client";
import { AlertModal } from "@/web/components/modal/alert-modal";
import { Button } from "@/web/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/web/components/ui/dropdown-menu";
import { useDeleteMutation } from "@supabase-cache-helpers/postgrest-react-query";
import { Edit, MoreHorizontal, Trash } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface CellActionProps {
  data: UsedPromptType;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const t = useTranslations("promptTemplates");
  const commontT = useTranslations();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  // const supabase = useSupabase();

  // const deleteMutation = useDeleteMutation(supabase.from("quizes"), ["id"]);

  // const onConfirm = async () => {
  //   setLoading(true);
  //   try {
  //     await deleteMutation.mutateAsync({ id: data.id });
  //     toast.success("Quiz deleted");
  //   } catch (error) {
  //     toast.error("Something went wrong");
  //   } finally {
  //     router.refresh();
  //     setLoading(false);
  //     setOpen(false);
  //   }
  // };

  return (
    <>
      {/* <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        loading={loading}
      /> */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">{t("openActionMenu")}</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{commontT("common.actions")}</DropdownMenuLabel>

          <DropdownMenuItem
            onClick={() => router.push(getPromptLink(data.prompt))}
          >
            <Edit className="mr-2 h-4 w-4" /> {t("tryPrompt")}
          </DropdownMenuItem>
          {/* <DropdownMenuItem onClick={() => setOpen(true)}>
            <Trash className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem> */}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
