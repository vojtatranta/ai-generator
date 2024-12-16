"use client";
import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/web/components/ui/button";
import { AdvancedMarker, APIProvider, Map } from "@vis.gl/react-google-maps";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/web/components/ui/form";
import { Input } from "@/web/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/web/components/ui/card";
import Link from "next/link";
import { ProductCategory, User } from "@/web/lib/supabase-server";
import { useUpdateMutation } from "@supabase-cache-helpers/postgrest-react-query";
import { useSupabase } from "@/web/lib/supabase-client";
import { toast } from "sonner";
import { MakeOptional } from "@/lib/ts-helpers";

const formSchema = z.object({
  name: z.string().min(1),
});

const productCategoryToForm = (
  productCategory: MakeOptional<ProductCategory> | null | undefined,
): z.infer<typeof formSchema> => {
  return {
    name: productCategory?.name ?? "",
  };
};

export default function ProductCategoryForm({
  productCategory,
  users,
}: {
  productCategory?: ProductCategory | null;
  users: User[];
}) {
  const supabase = useSupabase();

  const mutation = useUpdateMutation(
    supabase.from("product_categories"),
    ["id"],
    null,
    {
      onSuccess: async (_, updatedEntity) => {
        toast.success("Product category updated");
        form.reset(productCategoryToForm(updatedEntity));
      },
    },
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: productCategoryToForm(productCategory),
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!productCategory) {
      return;
    }

    mutation.mutate({
      id: productCategory.id,
      name: values.name ?? null,
    });
  }

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-left text-2xl font-bold">
          Socket Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          {productCategory && (
            <>
              <div className="space-y-8">
                Category ID in Eshop:{" "}
                <span className="font-bold">{String(productCategory.id)}</span>
              </div>
              <div className="space-y-8">
                Category products:{" "}
                <span className="font-bold">
                  <Link
                    href={`/products/?categoryId=${productCategory.xml_id}`}
                    target="_blank"
                  >
                    View
                  </Link>
                </span>
              </div>
            </>
          )}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Text</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter name of the category"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* <FormField
                control={form.control}
                name="shortName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Short name (bluetooth SSID - must be set on socket
                      firmware)
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your short name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="serviceUUID"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Service UUID (must be set on socket firmware)
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your service UUID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="characteristicRX"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Characteristic RX (must be set on socket firmware)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your characteristic RX"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="characteristicTX"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Characteristic TX (must be set on socket firmware)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your characteristic TX"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="providerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner</FormLabel>
                    <UsersSelect
                      value={field.value}
                      users={users}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div>
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter your address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div> */}
              {/* <div>
                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your longitude" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your latitude" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div> */}
            </div>
            <Button disabled={mutation.isLoading} type="submit">
              {mutation.isLoading ? "Updating..." : "Submit"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
