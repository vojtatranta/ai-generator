import ProductForm from "./product-form";
import PageContainer from "@/web/components/layout/page-container";
import {
  createSupabaseServerClient,
  Product,
  ProductCategory,
} from "@/web/lib/supabase-server";

export default async function ProductViewPage({
  product,
}: {
  product: Product;
}) {
  const supabase = await createSupabaseServerClient();
  const users = await supabase.auth.admin.listUsers();

  return (
    <PageContainer>
      <ProductForm product={product} users={users.data?.users ?? []} />
    </PageContainer>
  );
}
