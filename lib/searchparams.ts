import {
  createSearchParamsCache,
  createSerializer,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  SearchParams,
} from "nuqs/server";

export const BASE_PAGE_LIMIT = 50;

export const searchParams = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(BASE_PAGE_LIMIT),
  q: parseAsString,
  categoryId: parseAsInteger,
  quizId: parseAsString,
  test: parseAsBoolean.withDefault(false),
  gender: parseAsString,
  categories: parseAsString,
};

export const searchParamsCache = createSearchParamsCache(searchParams);
const originalParse = searchParamsCache.parse.bind(searchParamsCache);
// @ts-expect-error: hackish :)
searchParamsCache.parse = (params: SearchParams | Promise<SearchParams>) => {
  if (params instanceof Promise) {
    return params.then(originalParse);
  }

  return originalParse(params);
};
export const serialize = createSerializer(searchParams);
