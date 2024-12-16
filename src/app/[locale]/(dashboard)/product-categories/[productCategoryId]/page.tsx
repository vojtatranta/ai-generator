import { notFound } from "next/navigation";
import { createSupabaseServerClient, getUser } from "@/web/lib/supabase-server";
import ProductCategoryViewPage from "../_components/product-category-view-page";

export const metadata = {
  title: "Dashboard : Product Category View",
};

export default async function Page({
  params,
}: {
  params: { productCategoryId: string };
}) {
  const supabase = await createSupabaseServerClient();
  const user = await getUser();
  const productCategory = await supabase
    .from("product_categories")
    .select("*")
    .eq("id", params.productCategoryId)
    .eq("user", user.id)
    .single();

  if (!productCategory.data) {
    notFound();
  }

  return <ProductCategoryViewPage productCategory={productCategory.data} />;
}
