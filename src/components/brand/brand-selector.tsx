"use client";

import * as React from "react";
import { Palette, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BRANDS } from "@/lib/brands";
import { useBrand } from "@/components/providers";

export function BrandSelector() {
  const { brand, setBrand } = useBrand();

  return (
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="בחירת מיתוג">
          <Palette className="size-4.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>מיתוג</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {BRANDS.map((b) => (
          <DropdownMenuItem
            key={b.id}
            onClick={() => setBrand(b.id)}
            className="gap-3 py-2.5"
          >
            <span
              className="size-4 shrink-0 rounded-full border border-border"
              style={{ backgroundColor: b.swatch }}
            />
            <span className="flex min-w-0 flex-col">
              <span className="font-medium leading-tight">{b.label}</span>
              <span className="text-xs text-muted-foreground leading-tight">
                {b.vibe}
              </span>
            </span>
            {brand === b.id && <Check className="ms-auto size-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
