"use client";
import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/web/components/ui/button";
import Image from "next/image";
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
import { Product, User } from "@/web/lib/supabase-server";
import { useUpdateMutation } from "@supabase-cache-helpers/postgrest-react-query";
import { useSupabase } from "@/web/lib/supabase-client";
import { toast } from "sonner";
import { MakeOptional } from "@/lib/ts-helpers";

const formSchema = z.object({
  title: z.string().min(1),
  imageUrl: z.string().url().min(1),
  description: z.string().min(1),
  link: z.string().url().nullable().optional(),
  buyLink: z.string().url().nullable().optional(),
  brand: z.string().min(1),
  available: z.boolean(),
});

const productToForm = (
  product: MakeOptional<Product> | null | undefined,
): z.infer<typeof formSchema> => {
  return {
    title: product?.title ?? "",
    imageUrl: product?.image_url ?? "",
    description: product?.description ?? "",
    link: product?.product_link ?? "",
    buyLink: product?.buy_link ?? "",
    brand: product?.brand ?? "",
    available: product?.available ?? false,
  };
};

export default function ProductForm({
  product,
  users,
}: {
  product: Product;
  users: User[];
}) {
  const supabase = useSupabase();

  const mutation = useUpdateMutation(supabase.from("products"), ["id"], null, {
    onSuccess: async (_, updatedEntity) => {
      toast.success("Product updated");
      form.reset(productToForm(updatedEntity));
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: productToForm(product),
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!product) {
      return;
    }

    mutation.mutate({
      id: product.id,
      title: values.title,
      image_url: values.imageUrl,
      description: values.description,
      buy_link: values.buyLink,
      brand: values.brand,
      available: values.available,
    });
  }

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-left text-2xl font-bold">Product</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          {product && (
            <>
              <div className="space-y-8">
                Category:{" "}
                <Link href={`/product-categories/xml-id/${product.xml_id}`}>
                  View
                </Link>
              </div>
            </>
          )}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your text" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem className="flex flex-row justify-between gap-2">
                    <div className="flex-1">
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your short name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </div>
                    <div>
                      {field.value && (
                        <Image
                          src={field.value}
                          alt="Product Image"
                          height={200}
                          width={200}
                        />
                      )}
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link to the product</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Link to the product"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/*<FormField
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
