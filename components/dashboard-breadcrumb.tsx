// components/dashboard-breadcrumb.tsx
"use client";

import { Fragment } from "react";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { breadcrumbLabels } from "@/lib/breadcrumb-labels";
import { useBreadcrumbContext } from "./provider/breadcrumb-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouteLoader } from "./provider/router-loader-provider";
import { useRouter } from "next/navigation";

export function DashboardBreadcrumb() {
  const pathname = usePathname();
  const { overrides } = useBreadcrumbContext();
  const router = useRouter();
  const { start } = useRouteLoader();

  const segments = pathname.split("/").filter(Boolean); // e.g. ["dashboard", "profile", "user_123"]
  const getLabel = (segment: string) =>
    overrides[segment] ?? breadcrumbLabels[segment] ?? segment;

  const getHref = (i: number) => "/" + segments.slice(0, i + 1).join("/");

  const lastSegment = segments[segments.length - 1];
  const middleSegments = segments.slice(0, -1);

return (
    <Breadcrumb>
      <BreadcrumbList className="lg:gap-y-1">
        {/* Desktop: full trail, hidden on mobile */}
        {middleSegments.map((segment, i) => (
          <Fragment key={getHref(i)}>
            <BreadcrumbItem className="hidden lg:flex">
              <BreadcrumbLink href={getHref(i)}>{getLabel(segment)}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden lg:flex" />
          </Fragment>
        ))}

        {/* Mobile: collapse all middle segments into a "..." dropdown */}
        {middleSegments.length > 0 && (
          <>
            <BreadcrumbItem className="lg:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-sm p-1">
                      <BreadcrumbEllipsis />
                      <span className="sr-only">Toggle menu</span>
                    </button>
                  }
                />
                <DropdownMenuContent align="start">
                  <DropdownMenuGroup>
                    {middleSegments.map((segment, i) => (
                      <DropdownMenuItem
                        key={getHref(i)}
                        onClick={() => {
                          start();
                          router.push(getHref(i))
                        }}
                      >
                        {getLabel(segment)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="lg:hidden" />
          </>
        )}

        {/* Last segment: always visible, both mobile and desktop */}
        {lastSegment && (
          <BreadcrumbItem>
            <BreadcrumbPage>{getLabel(lastSegment)}</BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}