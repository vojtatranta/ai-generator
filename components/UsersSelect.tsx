"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/web/components/ui/select";
import { FormControl } from "./ui/form";
import { User } from "@/web/lib/supabase-server";
import { useCallback } from "react";

const NO_USER_VALUE = "no-user" as const;

export function UsersSelect({
  value,
  users,
  onChange,
}: {
  value: string | null | undefined;
  users: User[];
  onChange: (id: string) => void;
}) {
  const handleChange = useCallback(
    (id: string) => {
      if (id !== NO_USER_VALUE) {
        onChange(id);
      }
    },
    [onChange],
  );

  return (
    <Select onValueChange={handleChange} value={value ?? NO_USER_VALUE}>
      <FormControl>
        <SelectTrigger>
          <SelectValue placeholder="Select a user" />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        <SelectItem value={NO_USER_VALUE}>No user</SelectItem>
        {users.map((user) => (
          <SelectItem key={user.id} value={user.id}>
            {user.email}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
