"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSearch,
  SelectTrigger,
  SelectValue,
} from "@/web/components/ui/select";
import { FormControl } from "./ui/form";
import { memo, useCallback, useState } from "react";
import { ScrollArea } from "./ui/scroll-area";

function GeneralOptionSelectComponent<
  T extends { value: string | number; label: string | number },
>({
  defaultValue,
  onChange,
  options,
  value,
  disabledIds,
  placeholder,
  searchPlaceholder,
}: {
  defaultValue?: T["value"] | null | undefined;
  placeholder?: string;
  searchPlaceholder?: string;
  value: T["value"] | null | undefined;
  options: T[];
  disabledIds?: (T["value"] | null | undefined)[];
  onChange?: (id: T["value"]) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleChange = useCallback(
    (id: string) => {
      onChange?.(id as T["value"]);
    },
    [onChange],
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    [],
  );

  const disabledIdsSet = new Set(disabledIds ?? []);
  const normalizedDefaultValue = defaultValue
    ? String(defaultValue)
    : undefined;
  const normalizedValue = value ? String(value) : undefined;

  return (
    <Select
      onValueChange={handleChange}
      defaultValue={normalizedDefaultValue}
      value={normalizedValue}
    >
      <FormControl>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        <SelectSearch
          autoFocus
          placeholder={searchPlaceholder}
          onChange={handleSearchChange}
        />
        <ScrollArea className="h-[200px]">
          {options
            ?.filter(
              (option) =>
                !searchQuery ||
                option.label
                  ?.toString()
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase()),
            )
            .map((item) => (
              <SelectItem
                key={item.value}
                disabled={disabledIdsSet.has(item.value)}
                value={String(item.value)}
              >
                {item.label}
              </SelectItem>
            ))}
        </ScrollArea>
      </SelectContent>
    </Select>
  );
}

export const GeneralOptionSelect = memo(
  GeneralOptionSelectComponent,
) as typeof GeneralOptionSelectComponent;
