export type MakeOptional<T> = {
  [K in keyof T]?: T[K];
};
