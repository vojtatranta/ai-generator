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

// This is the parsed structuredClone for Koreanconcept xml
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

  if (
    xmlProducts.length === 0 &&
    !getValueFromJsonPathOrDefault<Record<string, any>[] | null>(
      json,
      "rss.channel.item",
      null,
    )
  ) {
    throw new Error("This does not look like a valid KoreanConcept XML");
  }

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

// UPGATES XML STRUCTURE
// <PRODUCTS version="2.0">
// <PRODUCT>
// <CODE>P00001</CODE>
// <PRODUCT_ID>9</PRODUCT_ID>
// <ACTIVE_YN>1</ACTIVE_YN>
// <ARCHIVED_YN>0</ARCHIVED_YN>
// <REPLACEMENT_PRODUCT_CODE/>
// <CAN_ADD_TO_BASKET_YN>1</CAN_ADD_TO_BASKET_YN>
// <ADULT_YN>0</ADULT_YN>
// <LABELS>
// <LABEL>
// <NAME>Akce</NAME>
// <ACTIVE_YN>1</ACTIVE_YN>
// <ACTIVE_FROM/>
// <ACTIVE_TO/>
// </LABEL>
// <LABEL>
// <NAME>Výprodej</NAME>
// <ACTIVE_YN>1</ACTIVE_YN>
// <ACTIVE_FROM/>
// <ACTIVE_TO/>
// </LABEL>
// </LABELS>
// <DESCRIPTIONS>
// <DESCRIPTION language="cz">
// <TITLE>Šaty řasené</TITLE>
// <URL>https://perfect-pick.t3.upgates.shop/p/saty-rasene</URL>
// <SHORT_DESCRIPTION>
// <![CDATA[ Toto je krátký popis. Měl by obsahovat 2-3 základní věty s představením produktu zákazníkovi. Podrobnější informace se vkládají do dlouhého popisu níže. ]]>
// </SHORT_DESCRIPTION>
// <LONG_DESCRIPTION>
// <![CDATA[ <p>Dlouhý popis se zobrazuje zde, pod hlavním obrázkem produktu. Spolu s dlouhým popisem se zobrazují také parametry, soubory ke stažení a další související informace.</p> <ul> <li>V textu uvádějte, v rozumné míře, <strong>klíčová slova</strong> určená nejen pro zákazníky, ale také pro vyhledávače.</li> <li>V případě, že je text delší, čleňte jej do <strong>podnadpisů</strong> a <strong>odstavců</strong>.</li> <li><strong>Tučně</strong> označujte důležitá a klíčová slova.</li> </ul> <p>Podrobnější informace, jak pracovat s <strong>textovým editorem</strong> najdete <a href="https://www.upgates.cz/textovy-editor" target="_blank" rel="noopener">zde</a>.</p> <h2>Kvalitní materiál</h2> <p>Text by měl být originální, pokud jej však vkládáte z jiného zdroje, vložte ho zde jako <strong>prostý text</strong> a následně proveďte jeho dodatečné formátování. V opačném případě se může stát, že zde vložíte přebytečné informace a kusy kódu, které způsobí pomalé načítání nebo rozhození celé struktury stránky.</p> <p>Čtenář se pak lépe orientuje a vyhledávače obsah <strong>snáze</strong> <strong>indexují</strong>. Je třeba si uvědomit, že obecně na internetu se nečte, ale skenuje. Tzn. čtenář projíždí pohledem nadpisy a zvýrazněná slova a pokud ho něco zaujme, přečte si více v běžném textu.</p> <p>Kromě samotného textu, tabulek a dalších prvků zde můžete vložit také <a href="https://www.upgates.cz/a/obrazky-a-fotogalerie#0brazek-uvnitr-textu" target="_blank" rel="noopener">obrázky</a>, <a href="https://www.upgates.cz/a/spravce-souboru#pridani-souboru-do-spravce" target="_blank" rel="noopener">PDF přílohy</a>, <a href="https://www.upgates.cz/a/nahrani-videa-na-eshop#video-soubor" target="_blank" rel="noopener">vlastní video</a>, <a href="https://www.upgates.cz/a/nahrani-videa-na-eshop#youtube-vimeo" target="_blank" rel="noopener">přehrávač s youtube videem</a>, <a href="https://www.upgates.cz/a/odkazy#jak-psat-odkazy" target="_blank" rel="noopener">odkazy</a> a další.</p> ]]>
// </LONG_DESCRIPTION>
// </DESCRIPTION>
// </DESCRIPTIONS>
// <SEO_OPTIMALIZATION>
// <SEO language="cz">
// <SEO_URL>saty-rasene</SEO_URL>
// <SEO_TITLE/>
// <SEO_META_DESCRIPTION/>
// </SEO>
// </SEO_OPTIMALIZATION>
// <MANUFACTURER>Upgates</MANUFACTURER>
// <SUPPLIER_CODE/>
// <EAN>1234567890</EAN>
// <AVAILABILITY>Skladem</AVAILABILITY>
// <STOCK/>
// <STOCK_POSITION/>
// <LIMIT_ORDERS/>
// <WEIGHT>1200</WEIGHT>
// <UNIT>ks</UNIT>
// <SHIPMENT_GROUP/>
// <VATS>
// <VAT language="cz"/>
// </VATS>
// <LENGTH>
// <ACTIVE_YN>0</ACTIVE_YN>
// </LENGTH>
// <PRIVATE_YN>0</PRIVATE_YN>
// <PRIVATE_CUSTOMERS_ONLY_YN>0</PRIVATE_CUSTOMERS_ONLY_YN>
// <EXCLUDE_FROM_SEARCH_YN>0</EXCLUDE_FROM_SEARCH_YN>
// <GROUPS/>
// <CATEGORIES>
// <CATEGORY>
// <CODE>K00036</CODE>
// <NAME>Oblečení</NAME>
// <PRIMARY_YN>0</PRIMARY_YN>
// <POSITION>4</POSITION>
// </CATEGORY>
// <CATEGORY>
// <CODE>K00037</CODE>
// <NAME>Dámské</NAME>
// <PRIMARY_YN>1</PRIMARY_YN>
// <POSITION>3</POSITION>
// </CATEGORY>
// </CATEGORIES>
// <PRICES_FORMULAS/>
// <RECYCLING_FEE/>
// <PRICES>
// <PRICE language="cz">
// <PRICELISTS>
// <PRICELIST>
// <NAME>Výchozí</NAME>
// <PRICE_ORIGINAL>2490</PRICE_ORIGINAL>
// <PRODUCT_DISCOUNT/>
// <PRODUCT_DISCOUNT_REAL>0</PRODUCT_DISCOUNT_REAL>
// <PRICE_SALE>1890</PRICE_SALE>
// <PRICE_WITH_VAT>1890</PRICE_WITH_VAT>
// <PRICE_WITHOUT_VAT>1890</PRICE_WITHOUT_VAT>
// </PRICELIST>
// </PRICELISTS>
// <PRICE_PURCHASE/>
// <PRICE_COMMON/>
// <CURRENCY>CZK</CURRENCY>
// </PRICE>
// </PRICES>
// <IMAGES>
// <IMAGE>
// <URL>https://perfect-pick.t3.cdn-upgates.com/n/n626651a62294b-aty-zlute.webp</URL>
// <MAIN_YN>0</MAIN_YN>
// <LIST_YN>0</LIST_YN>
// </IMAGE>
// <IMAGE>
// <URL>https://perfect-pick.t3.cdn-upgates.com/o/o626651a69664d-aty-bile-2.webp</URL>
// <MAIN_YN>0</MAIN_YN>
// <LIST_YN>0</LIST_YN>
// </IMAGE>
// <IMAGE>
// <URL>https://perfect-pick.t3.cdn-upgates.com/b/b626651a57d4f1-aty-sede.webp</URL>
// <MAIN_YN>0</MAIN_YN>
// <LIST_YN>0</LIST_YN>
// </IMAGE>
// <IMAGE>
// <URL>https://perfect-pick.t3.cdn-upgates.com/7/7626651a5e88c7-aty-fialove.webp</URL>
// <MAIN_YN>1</MAIN_YN>
// <LIST_YN>1</LIST_YN>
// </IMAGE>
// </IMAGES>
// <FILES>
// <FILE>
// <URL>https://perfect-pick.t3.cdn-upgates.com/v/v60a4cf8fce6cc-tabulka-bez-nazvu.xlsx</URL>
// <TITLES>
// <TITLE language="cz">Excel soubor</TITLE>
// </TITLES>
// </FILE>
// </FILES>
// <BENEFITS/>
// <PARAMETERS>
// <PARAMETER>
// <NAME language="cz">Barva</NAME>
// <VALUE language="cz">Žlutá</VALUE>
// </PARAMETER>
// <PARAMETER>
// <NAME language="cz">Barva</NAME>
// <VALUE language="cz">Purpurová</VALUE>
// </PARAMETER>
// <PARAMETER>
// <NAME language="cz">Barva</NAME>
// <VALUE language="cz">Šedá</VALUE>
// </PARAMETER>
// <PARAMETER>
// <NAME language="cz">Barva</NAME>
// <VALUE language="cz">Bílá</VALUE>
// </PARAMETER>
// <PARAMETER>
// <NAME language="cz">Velikost</NAME>
// <VALUE language="cz">M</VALUE>
// </PARAMETER>
// </PARAMETERS>
// <CONFIGURATIONS/>
// <VARIANTS>
// <VARIANT>
// <CODE>P00001-1</CODE>
// <VARIANT_ID>93</VARIANT_ID>
// <MAIN_YN>0</MAIN_YN>
// <ACTIVE_YN>1</ACTIVE_YN>
// <CAN_ADD_TO_BASKET_YN/>
// <LABELS/>
// <SUPPLIER_CODE/>
// <EAN/>
// <AVAILABILITY_NOTES/>
// <AVAILABILITY>Skladem</AVAILABILITY>
// <STOCK/>
// <STOCK_POSITION/>
// <WEIGHT/>
// <IMAGE_URL>https://perfect-pick.t3.cdn-upgates.com/n/n626651a62294b-aty-zlute.webp</IMAGE_URL>
// <PARAMETERS>
// <PARAMETER>
// <NAME language="cz">Barva</NAME>
// <VALUE language="cz">Žlutá</VALUE>
// </PARAMETER>
// </PARAMETERS>
// <PRICES>
// <PRICE language="cz">
// <PRICELISTS>
// <PRICELIST>
// <NAME>Výchozí</NAME>
// <PRICE_ORIGINAL>2490</PRICE_ORIGINAL>
// <PRODUCT_DISCOUNT/>
// <PRODUCT_DISCOUNT_REAL>0</PRODUCT_DISCOUNT_REAL>
// <PRICE_SALE>1890</PRICE_SALE>
// <PRICE_WITH_VAT>1890</PRICE_WITH_VAT>
// <PRICE_WITHOUT_VAT>1890</PRICE_WITHOUT_VAT>
// </PRICELIST>
// </PRICELISTS>
// <PRICE_PURCHASE/>
// <PRICE_COMMON>0</PRICE_COMMON>
// <CURRENCY>CZK</CURRENCY>
// </PRICE>
// </PRICES>
// <METAS>
// <META type="input">
// <META_KEY>col</META_KEY>
// <META_VALUES/>
// </META>
// <META type="input">
// <META_KEY>cont</META_KEY>
// <META_VALUES/>
// </META>
// </METAS>
// </VARIANT>
// <VARIANT>
// <CODE>P00001-2</CODE>
// <VARIANT_ID>94</VARIANT_ID>
// <MAIN_YN>1</MAIN_YN>
// <ACTIVE_YN>1</ACTIVE_YN>
// <CAN_ADD_TO_BASKET_YN/>
// <LABELS/>
// <SUPPLIER_CODE/>
// <EAN/>
// <AVAILABILITY_NOTES/>
// <AVAILABILITY>Skladem</AVAILABILITY>
// <STOCK/>
// <STOCK_POSITION/>
// <WEIGHT/>
// <IMAGE_URL>https://perfect-pick.t3.cdn-upgates.com/7/7626651a5e88c7-aty-fialove.webp</IMAGE_URL>
// <PARAMETERS>
// <PARAMETER>
// <NAME language="cz">Barva</NAME>
// <VALUE language="cz">Purpurová</VALUE>
// </PARAMETER>
// </PARAMETERS>
// <PRICES>
// <PRICE language="cz">
// <PRICELISTS>
// <PRICELIST>
// <NAME>Výchozí</NAME>
// <PRICE_ORIGINAL>2490</PRICE_ORIGINAL>
// <PRODUCT_DISCOUNT/>
// <PRODUCT_DISCOUNT_REAL>0</PRODUCT_DISCOUNT_REAL>
// <PRICE_SALE>1890</PRICE_SALE>
// <PRICE_WITH_VAT>1890</PRICE_WITH_VAT>
// <PRICE_WITHOUT_VAT>1890</PRICE_WITHOUT_VAT>
// </PRICELIST>
// </PRICELISTS>
// <PRICE_PURCHASE/>
// <PRICE_COMMON>0</PRICE_COMMON>
// <CURRENCY>CZK</CURRENCY>
// </PRICE>
// </PRICES>
// <METAS>
// <META type="input">
// <META_KEY>col</META_KEY>
// <META_VALUES/>
// </META>
// <META type="input">
// <META_KEY>cont</META_KEY>
// <META_VALUES/>
// </META>
// </METAS>
// </VARIANT>
// <VARIANT>
// <CODE>P00001-3</CODE>
// <VARIANT_ID>95</VARIANT_ID>
// <MAIN_YN>0</MAIN_YN>
// <ACTIVE_YN>1</ACTIVE_YN>
// <CAN_ADD_TO_BASKET_YN/>
// <LABELS/>
// <SUPPLIER_CODE/>
// <EAN/>
// <AVAILABILITY_NOTES/>
// <AVAILABILITY>Skladem</AVAILABILITY>
// <STOCK/>
// <STOCK_POSITION/>
// <WEIGHT/>
// <IMAGE_URL>https://perfect-pick.t3.cdn-upgates.com/b/b626651a57d4f1-aty-sede.webp</IMAGE_URL>
// <PARAMETERS>
// <PARAMETER>
// <NAME language="cz">Barva</NAME>
// <VALUE language="cz">Šedá</VALUE>
// </PARAMETER>
// </PARAMETERS>
// <PRICES>
// <PRICE language="cz">
// <PRICELISTS>
// <PRICELIST>
// <NAME>Výchozí</NAME>
// <PRICE_ORIGINAL>2490</PRICE_ORIGINAL>
// <PRODUCT_DISCOUNT/>
// <PRODUCT_DISCOUNT_REAL>0</PRODUCT_DISCOUNT_REAL>
// <PRICE_SALE>1890</PRICE_SALE>
// <PRICE_WITH_VAT>1890</PRICE_WITH_VAT>
// <PRICE_WITHOUT_VAT>1890</PRICE_WITHOUT_VAT>
// </PRICELIST>
// </PRICELISTS>
// <PRICE_PURCHASE/>
// <PRICE_COMMON>0</PRICE_COMMON>
// <CURRENCY>CZK</CURRENCY>
// </PRICE>
// </PRICES>
// <METAS>
// <META type="input">
// <META_KEY>col</META_KEY>
// <META_VALUES/>
// </META>
// <META type="input">
// <META_KEY>cont</META_KEY>
// <META_VALUES/>
// </META>
// </METAS>
// </VARIANT>
// <VARIANT>
// <CODE>P00001-4</CODE>
// <VARIANT_ID>96</VARIANT_ID>
// <MAIN_YN>0</MAIN_YN>
// <ACTIVE_YN>1</ACTIVE_YN>
// <CAN_ADD_TO_BASKET_YN/>
// <LABELS/>
// <SUPPLIER_CODE/>
// <EAN/>
// <AVAILABILITY_NOTES/>
// <AVAILABILITY>Skladem</AVAILABILITY>
// <STOCK/>
// <STOCK_POSITION/>
// <WEIGHT/>
// <IMAGE_URL>https://perfect-pick.t3.cdn-upgates.com/h/h626651a68251e-ary-bile.webp</IMAGE_URL>
// <PARAMETERS>
// <PARAMETER>
// <NAME language="cz">Barva</NAME>
// <VALUE language="cz">Bílá</VALUE>
// </PARAMETER>
// </PARAMETERS>
// <PRICES>
// <PRICE language="cz">
// <PRICELISTS>
// <PRICELIST>
// <NAME>Výchozí</NAME>
// <PRICE_ORIGINAL>2490</PRICE_ORIGINAL>
// <PRODUCT_DISCOUNT/>
// <PRODUCT_DISCOUNT_REAL>0</PRODUCT_DISCOUNT_REAL>
// <PRICE_SALE>1890</PRICE_SALE>
// <PRICE_WITH_VAT>1890</PRICE_WITH_VAT>
// <PRICE_WITHOUT_VAT>1890</PRICE_WITHOUT_VAT>
// </PRICELIST>
// </PRICELISTS>
// <PRICE_PURCHASE/>
// <PRICE_COMMON>0</PRICE_COMMON>
// <CURRENCY>CZK</CURRENCY>
// </PRICE>
// </PRICES>
// <METAS>
// <META type="input">
// <META_KEY>col</META_KEY>
// <META_VALUES/>
// </META>
// <META type="input">
// <META_KEY>cont</META_KEY>
// <META_VALUES/>
// </META>
// </METAS>
// </VARIANT>
// </VARIANTS>
// <RELATED_PRODUCTS>
// <CODE>P00006</CODE>
// <CODE>P00005</CODE>
// </RELATED_PRODUCTS>
// <ALTERNATIVE_PRODUCTS/>
// <ACCESSORIES>
// <CODE>P00007</CODE>
// <CODE>P00008</CODE>
// </ACCESSORIES>
// <GIFTS/>
// <SETS/>
// <METAS/>
// </PRODUCT>
// </PRODUCTS>

export const upgagesXmlParser = (
  json: Record<string, any>,
  xmlUrl: string,
  currentDate: Date,
): ExpectedParseResult => {
  const xmlProducts = getValueFromJsonPathOrDefault<Record<string, any>[]>(
    json,
    "PRODUCTS.PRODUCT",
    [],
  );

  const productAttributes: Map<string, Map<string, Set<string>>> = new Map();
  const productCategories = new Map<string, ParsedProductCategory>();
  const products = new Map<string, ParsedProduct>();

  xmlProducts.forEach((xmlProduct) => {
    const productId = getValueFromJsonPathOrDefault(
      xmlProduct,
      "CODE._text",
      "",
    );
    const isActive =
      getValueFromJsonPathOrDefault(xmlProduct, "ACTIVE_YN._text", "0") === "1";

    const canAddToBasket =
      getValueFromJsonPathOrDefault(
        xmlProduct,
        "CAN_ADD_TO_BASKET_YN._text",
        "0",
      ) === "1";

    if (!isActive || !canAddToBasket || !productId) {
      return;
    }

    const descriptions = getValueFromJsonPathOrDefault<Record<string, any>[]>(
      xmlProduct,
      "DESCRIPTIONS.DESCRIPTION",
      [],
    );
    const czDescription = descriptions.find(
      (desc) => desc._attributes?.language === "cz",
    );

    if (!czDescription) {
      return;
    }

    const title = getValueFromJsonPathOrDefault(
      czDescription,
      "TITLE._text",
      "",
    );
    const url = getValueFromJsonPathOrDefault(czDescription, "URL._text", "");
    const shortDescription = getValueFromJsonPathOrDefault(
      czDescription,
      "SHORT_DESCRIPTION._text",
      "",
    );
    const longDescription = getValueFromJsonPathOrDefault(
      czDescription,
      "LONG_DESCRIPTION._text",
      "",
    );

    const manufacturer = getValueFromJsonPathOrDefault(
      xmlProduct,
      "MANUFACTURER._text",
      "",
    );

    const images = getValueFromJsonPathOrDefault<Record<string, any>[]>(
      xmlProduct,
      "IMAGES.IMAGE",
      [],
    );
    const mainImage = images.find(
      (img) => getValueFromJsonPathOrDefault(img, "MAIN_YN._text", "0") === "1",
    );
    const imageUrl = mainImage
      ? getValueFromJsonPathOrDefault(mainImage, "URL._text", "")
      : "";

    const availability = getValueFromJsonPathOrDefault(
      xmlProduct,
      "AVAILABILITY._text",
      "",
    );
    const availableNow = availability.toLowerCase().includes("skladem");

    const priceInfo = getValueFromJsonPathOrDefault<Record<string, any>[]>(
      xmlProduct,
      "PRICES.PRICE",
      [],
    );
    const czPrice = priceInfo.find(
      (price) => price._attributes?.currency === "CZK",
    );
    const price = czPrice
      ? parseFloat(
          getValueFromJsonPathOrDefault(czPrice, "PRICE_VAT._text", "0"),
        )
      : 0;

    // Using manufacturer as category for simplicity
    // You might want to adjust this based on your needs
    if (manufacturer && !productCategories.has(manufacturer)) {
      productCategories.set(manufacturer, {
        id: manufacturer,
        name: manufacturer,
      });
    }

    const product: ParsedProduct = {
      id: productId,
      name: title,
      brand: manufacturer,
      description: `${shortDescription}\n\n${longDescription}`.trim(),
      categoryId: manufacturer,
      link: url,
      categoryName: manufacturer,
      price,
      canonicalUrl: url,
      imageUrl,
      availableNow,
    };

    products.set(productId, product);
  });

  return {
    attributes: productAttributes,
    productCategories: Array.from(productCategories.values()),
    products: Array.from(products.values()),
    xmlUrl,
    currentDate: currentDate.toISOString(),
  };
};

export const parsedUpgagesProductToDbProduct = (
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
    category_xml_id: Number(parsedProduct.categoryId) || null,
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
  upgagesXmlParser: {
    parser: upgagesXmlParser,
    dbProductMapper: parsedUpgagesProductToDbProduct,
  },
} as const;

export const createProductAttributeConnectionHash = (entityToInsert: {
  product_id: number;
  attribute_id: number;
}) => {
  return `${entityToInsert.product_id}-${entityToInsert.attribute_id}`;
};
