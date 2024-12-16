"use client";
import { Locale, setDefaultOptions } from "date-fns";
import { useEffect, useState } from "react";
import { cs } from "date-fns/locale/cs";

// async function loadLocale(locale: string) {
//   // Dynamically import the locale
//   try {
//     const localeModule = await import(`date-fns/locale/${locale}/index.js`);
//     return localeModule.default;
//   } catch (error) {
//     console.error(`Error loading locale ${locale}:`, error);
//     return null; // Fallback to default behavior
//   }
// }

export default function LocaleProvider({
  localeString,
  children,
}: {
  localeString: string;
  children?: (locale: Locale) => React.ReactNode;
}) {
  const [locale, setLocale] = useState(cs);

  useEffect(() => {
    // loadLocale(localeString).then((locale) => {
    //   if (locale) {
    //     setDefaultOptions({ locale });
    //     setLocale(locale);
    //   }
    // });
  }, [localeString]);

  return children ? children(locale) : null;
}
