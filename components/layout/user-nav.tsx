"use client";
import { User } from "@/web/lib/supabase-server";
import { useSignOut } from "@/web/lib/use-sign-out";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/web/components/ui/avatar";
import { Button } from "@/web/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/web/components/ui/dropdown-menu";
import { useTranslations } from "next-intl";
import Link from "next/link";

export function UserNav({ user }: { user: User }) {
  const { signOut } = useSignOut();
  const t = useTranslations();

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={user.user_metadata.avatar_url ?? ""}
                alt={user.user_metadata.name ?? ""}
              />
              <AvatarFallback>{user.user_metadata.name?.[0]}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user.user_metadata.name}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <Link href="/profile">
              <DropdownMenuItem>{t("menu.account.profile")}</DropdownMenuItem>
            </Link>
            <Link href="/subscription">
              <DropdownMenuItem>
                {t("menu.account.subscription")}
              </DropdownMenuItem>
            </Link>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()}>
            {t("menu.account.logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
}
