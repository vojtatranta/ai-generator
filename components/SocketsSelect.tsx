"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/web/components/ui/select";
import { FormControl } from "./ui/form";
import { useQuery } from "@supabase-cache-helpers/postgrest-react-query";
import { useSupabase } from "@/web/lib/supabase-client";
import { useCallback } from "react";

const NO_SOCKET_VALUE = "no-socket" as const;

export function SocketsSelect({
  onChange,
  value,
}: {
  onChange: (id: string) => void;
  value: string | null | undefined;
}) {
  const supabase = useSupabase();
  const { data } = useQuery(
    supabase.from("quizes").select("*").order("name", { ascending: true }),
  );

  const handleChange = useCallback(
    (id: string) => {
      if (id !== NO_SOCKET_VALUE) {
        onChange(id);
      }
    },
    [onChange],
  );

  return (
    <Select onValueChange={handleChange} value={value ?? NO_SOCKET_VALUE}>
      <FormControl>
        <SelectTrigger>
          <SelectValue placeholder="Select a socket" />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        <SelectItem disabled value={NO_SOCKET_VALUE}>
          No socket
        </SelectItem>
        {data?.map((socket) => (
          <SelectItem key={socket.id} value={String(socket.id)}>
            {socket.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
