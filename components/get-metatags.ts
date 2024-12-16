import { getLocale, getTranslations } from "next-intl/server";

export const getBaseData = (locale: string, t: (str: string) => string) => ({
  title: t("title"),
  description: t("description"),
  openGraph: {
    title: t("ogTitle"),
    description: t("ogDescription"),
    type: "application",
    authors: ["Vojtěch Tranta"],
    url: "https://aistein.cz/",
    siteName: "AI Generator",
    image: "https://aistein.cz/aistein.webp",
    images: [
      {
        url: "https://aistein.cz/aistein.webp",
        width: 1600,
        height: 700,
      },
    ],
    locale,
  },
});

type MetaTagsProps = {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  ogTitle?: string;
  ogDescription?: string;
  siteName?: string;
  ogType?: string;
};

export const getMetaTags =
  (props: MetaTagsProps = {}) =>
  async () => {
    const [t, locale] = await Promise.all([
      getTranslations("seo"),
      getLocale(),
    ]);
    const base = getBaseData(locale ?? "cs", t);
    const title = props.title || base.title;
    const description = props.description || base.description;
    const image = props.image || base.openGraph.image;
    const url = props.url || base.openGraph.url;
    const ogTitle = props.ogTitle || base.openGraph.title;
    const ogDescription = props.ogDescription || base.openGraph.description;
    const siteName = props.siteName || base.openGraph.siteName;
    const ogType = props.ogType || "website";

    return {
      title: title,
      description: description,
      canonical: url,
      openGraph: {
        type: ogType,
        url: url,
        title: ogTitle,
        description: ogDescription,
        site_name: siteName,
        images: [
          {
            url: image,
            width: 1600,
            height: 700,
            alt: title,
          },
        ],
        ...(ogType === "article" && {
          article: {
            authors: ["https://twitter.com/vojtatranta"],
          },
        }),
      },
      twitter: {
        site: "@aistein",
        cardType: "summary_large_image",
      },
      additionalLinkTags: [
        {
          rel: "icon",
          href: "/favicon.ico",
        },
      ],
      additionalMetaTags: [
        {
          name: "charset",
          content: "utf-8",
        },
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1, shrink-to-fit=no",
        },
        {
          name: "author",
          content: "AIstein",
        },
        {
          name: "keywords",
          content:
            "AIStein, generates content for your website in any language!",
        },
        {
          name: "twitter:image",
          content: image,
        },
        {
          name: "twitter:title",
          content: ogTitle,
        },
        {
          name: "twitter:description",
          content: ogDescription,
        },
      ],
    };
  };
