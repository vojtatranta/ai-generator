"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/web/components/ui/button";
import { Modal } from "@/web/components/ui/modal";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { User } from "@/lib/supabase-server";
import { trpcApi } from "@/components/providers/TRPCProvider";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

const productCategorySchema = z.object({
  xmlFileUrl: z.string().url("Please enter a valid URL to your XML."),
});

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const form = useForm<z.infer<typeof productCategorySchema>>({
    resolver: zodResolver(productCategorySchema),
    defaultValues: {
      xmlFileUrl: "",
    },
  });

  const t = useTranslations("import.success");

  const importMutation = trpcApi.productCategories.import.useMutation({
    trpc: {
      abortOnUnmount: true,
    },
    onSuccess: (result) => {
      const dataImported = Object.entries(result.stats).some(
        ([key, value]) => value > 0,
      );
      const somethingImportedButNothingAdded =
        result.importSuccess && dataImported;

      if (somethingImportedButNothingAdded) {
        toast.success(t("noChanges"));
      } else if (dataImported) {
        toast.success(`
          ${t("summary")}
          ${result.stats.insertedProductCategories} product categories imported.
          ${result.stats.updatedProductCategories} product categories updated.
          ${result.stats.insertedProducts} products imported.
          ${result.stats.updatedProducts} products updated.
        `);
      }

      if (result.errors.length > 0) {
        toast.error(`
          ${t("error")}
          ${result.errors.join("\n")}
        `);
      }

      onClose();
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = async (data: z.infer<typeof productCategorySchema>) => {
    if (importMutation.isLoading) {
      return;
    }

    await importMutation.mutateAsync({
      xmlFileUrl: data.xmlFileUrl,
    });
  };

  return (
    <Modal
      title="Import Products from XML"
      description="Will overwrite existing products and update the data there."
      isOpen={isOpen}
      onClose={onClose}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="xmlFileUrl"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="text-sm">XML url:</FormLabel>
                <FormControl>
                  <Input placeholder="Paste in URL to your XML" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="m-2 text-sm text-muted-foreground">
            The process of import may take a while, be patient and don&apos;t
            close this modal.
          </div>
          <div className="flex w-full items-center justify-end space-x-2 pt-6">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              disabled={importMutation.isLoading}
              variant="default"
              type="submit"
            >
              {importMutation.isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Import
            </Button>
          </div>
        </form>
      </Form>
    </Modal>
  );
};

export const ImportModalContainer: React.FC<{
  user: User;
  children: React.ReactNode;
}> = ({ user, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div onClick={() => setIsOpen(true)}>{children}</div>
      {isOpen && (
        <ImportModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
};
