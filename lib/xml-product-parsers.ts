import { Product, ProductAttributeConnectionInsert } from "./supabase-server";

export type ParsedProductCategory = {
  id: string;
  name: string;
  link?: string;
};

export type ParsedProduct = {
  id: string;
  name: string;
  brand: string;
  description: string;
  categoryId: string;
  link: string;
  categoryName: string;
  price: number;
  canonicalUrl: string;
  imageUrl: string;
  availableNow: boolean;
};

export type ExpectedParseResult = {
  productCategories: ParsedProductCategory[];
  products: ParsedProduct[];
  xmlUrl: string;
  currentDate: string;
  attributes: Map<string, Map<string, Set<string>>>;
};

const getValueFromJsonPathOrDefault = <T>(
  json: Record<string, any>,
  path: string,
  defaultValue: T,
): T => {
  return (path.split(".").reduce((acc, key) => acc && acc[key], json) ||
    defaultValue) as T;
};

// This is the parsed structuredClone
// <item>
// <g:id>17631</g:id>
// <g:title>SKIN1004 Madagascar Centella Soothing Cream</g:title>
// <g:description>SKIN1004 Madagascar Centella Soothing Cream je lehký gelový krém, který intenzivně hydratuje, zklidňuje a regeneruje pleť.</g:description>
// <g:item_group_id>17631</g:item_group_id>
// <link>https://koreanconcept.cz/produkt/skin1004-madagascar-centella-soothing-cream/</link>
// <g:product_type>7. Krémy</g:product_type>
// <g:google_product_category>47</g:google_product_category>
// <g:image_link>https://koreanconcept.cz/wp-content/uploads/2024/11/skin1004_madagascar_centella_soothing_cream_3.webp</g:image_link>
// <g:availability>in_stock</g:availability>
// <g:price>439,00 CZK</g:price>
// <g:sale_price>439,00 CZK</g:sale_price>
// <g:brand>SKIN1004</g:brand>
// <g:canonical_link>https://koreanconcept.cz/produkt/skin1004-madagascar-centella-soothing-cream/</g:canonical_link>
// <g:additional_image_link>https://koreanconcept.cz/wp-content/uploads/2024/11/skin1004_madagascar_centella_soothing_cream.webp</g:additional_image_link>
// <g:additional_image_link>https://koreanconcept.cz/wp-content/uploads/2024/11/skin1004_madagascar_centella_soothing_cream_2.webp</g:additional_image_link>
// <g:additional_image_link>https://koreanconcept.cz/wp-content/uploads/2024/11/skin1004_madagascar_centella_soothing_cream_4.webp</g:additional_image_link>
// <g:additional_image_link/>
// <g:additional_image_link/>
// <g:product_detail>
// <g:attribute_name>Typ pleti</g:attribute_name>
// <g:attribute_value>Citlivá pleť, Normální pleť, Suchá pleť</g:attribute_value>
// </g:product_detail>
// <g:identifier_exists>no</g:identifier_exists>
// </item>

export const koreanConceptXmlParser = (
  json: Record<string, any>,
  xmlUrl: string,
  currentDate: Date,
): ExpectedParseResult => {
  const xmlProducts = getValueFromJsonPathOrDefault<Record<string, any>[]>(
    json,
    "rss.channel.item",
    [],
  );

  const productAttributes: Map<string, Map<string, Set<string>>> = new Map();

  const productCategories = new Map<string, ParsedProductCategory>();
  const products = new Map<string, ParsedProduct>();

  xmlProducts.forEach((xmlProduct) => {
    const categoryId = getValueFromJsonPathOrDefault(
      xmlProduct,
      "g:google_product_category._text",
      "",
    );

    const productType = getValueFromJsonPathOrDefault(
      xmlProduct,
      "g:product_type._text",
      "",
    );
    if (categoryId && !productCategories.has(categoryId)) {
      productCategories.set(categoryId, {
        id: categoryId,
        name: productType,
      });
    }

    const productId = getValueFromJsonPathOrDefault<string>(
      xmlProduct,
      "g:id._text",
      "",
    );

    if (productId && categoryId && !products.has(productId)) {
      const attributeName =
        getValueFromJsonPathOrDefault<string | null>(
          xmlProduct,
          "g:product_detail.g:attribute_name._text",
          null,
        )?.trim() ?? null;

      const attributes = getValueFromJsonPathOrDefault<string>(
        xmlProduct,
        "g:product_detail.g:attribute_value._text",
        "",
      )
        .split(",")
        .map((s) => s.trim());

      if (attributeName) {
        const prevMap = productAttributes.get(attributeName);

        if (prevMap) {
          attributes.forEach((attribute) => {
            if (!attribute) {
              return;
            }

            const nextSet = prevMap.get(productId);
            if (nextSet) {
              nextSet.add(attribute);
            } else {
              prevMap.set(productId, new Set([attribute]));
            }

            productAttributes.set(attributeName, prevMap);
          });
        } else {
          productAttributes.set(
            attributeName,
            new Map([[productId, new Set(attributes)]]),
          );
        }
      }

      products.set(productId, {
        id: productId,
        name: getValueFromJsonPathOrDefault<string>(
          xmlProduct,
          "g:title._text",
          "",
        ),
        description: getValueFromJsonPathOrDefault<string>(
          xmlProduct,
          "g:description._text",
          "",
        ),
        brand: getValueFromJsonPathOrDefault<string>(
          xmlProduct,
          "g:brand._text",
          "",
        ),
        categoryId,
        link: getValueFromJsonPathOrDefault<string>(
          xmlProduct,
          "link._text",
          "",
        ),
        categoryName: productType,
        price: parseFloat(
          getValueFromJsonPathOrDefault<string>(
            xmlProduct,
            "g:price._text",
            "0",
          ),
        ),
        canonicalUrl: getValueFromJsonPathOrDefault<string>(
          xmlProduct,
          "g:canonical_link._text",
          "",
        ),
        imageUrl: getValueFromJsonPathOrDefault<string>(
          xmlProduct,
          "g:image_link._text",
          "",
        ),
        availableNow:
          getValueFromJsonPathOrDefault<string>(
            xmlProduct,
            "g:availability._text",
            "",
          ) === "in_stock",
      });
    }
  });

  return {
    attributes: productAttributes,
    productCategories: Array.from(productCategories.values()),
    products: Array.from(products.values()),
    xmlUrl,
    currentDate: currentDate.toISOString(),
  };
};

export const parsedKoreanConceptProductToDbProduct = (
  parsedProduct: ParsedProduct,
  params: {
    userId: string;
    xmlFileUrl: string;
    currentDate?: string;
    dbId?: number;
    categoryDbId?: number;
  },
):
  | Omit<Product, "created_at" | "buy_link">
  | Omit<Product, "id" | "created_at" | "buy_link"> => {
  let dbProduct: Omit<Product, "id" | "created_at" | "buy_link"> = {
    xml_id: Number(parsedProduct.id),
    title: parsedProduct.name,
    category_xml_id: Number(parsedProduct.categoryId),
    category_id: params.categoryDbId ?? null,
    user: params.userId,
    product_link: parsedProduct.link,
    description: parsedProduct.description,
    image_url: parsedProduct.imageUrl,
    price: parseFloat(parsedProduct.price.toFixed(2)),
    available: parsedProduct.availableNow,
    brand: parsedProduct.brand,
    xml_url: params.xmlFileUrl,
    updated_at: params.currentDate ?? null,
  };

  if (params.dbId) {
    const completeProduct: Omit<Product, "created_at" | "buy_link"> = {
      ...dbProduct,
      id: params.dbId,
    };

    return completeProduct;
  }

  return dbProduct;
};

export const PRODUCT_PARSERS = {
  koreanConceptXmlParser: {
    parser: koreanConceptXmlParser,
    dbProductMapper: parsedKoreanConceptProductToDbProduct,
  },
} as const;

export const createProductAttributeConnectionHash = (entityToInsert: {
  product_id: number;
  attribute_id: number;
}) => {
  return `${entityToInsert.product_id}-${entityToInsert.attribute_id}`;
};
