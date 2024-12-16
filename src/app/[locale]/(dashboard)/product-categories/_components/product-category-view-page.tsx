import ProductCategoryForm from "./product-category-form";
import PageContainer from "@/web/components/layout/page-container";
import {
  createSupabaseServerClient,
  ProductCategory,
} from "@/web/lib/supabase-server";

export default async function ProductCategoryViewPage({
  productCategory,
}: {
  productCategory: ProductCategory;
}) {
  const supabase = await createSupabaseServerClient();
  const users = await supabase.auth.admin.listUsers();

  return (
    <PageContainer>
      <ProductCategoryForm
        productCategory={productCategory}
        users={users.data?.users ?? []}
      />
    </PageContainer>
  );
}
