"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem, 
} from "@/components/ui/sidebar";
import { LayoutDashboard, Calculator, TrendingUp, SquarePen, AlignStartHorizontal, BadgePercent, ContactRound, SquareMousePointer, FileText, Briefcase } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/assets/logo/logo-new";
import { AdminTab } from "./admin-tab";

const itemsBusiness = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
  { title: "Projects Management", url: "/dashboard/project-management", icon: Briefcase },
  { title: "My Tasks List", url: "/dashboard/my-task-list", icon: SquarePen },
  { title: "Sales Report", url: "/dashboard/sales-report", icon: TrendingUp },
  { title: "My KPI & Share", url: "/dashboard/my-kpi", icon: BadgePercent },
];

const itemsData = [
  { title: "My Team Members", url: "/dashboard/member-list", icon: SquareMousePointer },
  { title: "Contact List", url: "/dashboard/contact-list", icon: ContactRound },
]

const itemsTools = [
  { title: "Price Calculation", url: "/dashboard/price-calculation", icon: Calculator },
  { title: "Quotation Docs", url: "/dashboard/quotation", icon: FileText },
]
export function AppSidebar({ role }: { role?: "admin" | "user" }) {
  const pathname = usePathname();

  const isActive = (url: string) =>
    url === "/dashboard" ? pathname === url : pathname.startsWith(url);
  
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-2 text-sm font-medium">
        <div className="flex items-center h-12 w-full my-auto gap-2 select-none">
          <div className="h-8 w-8 bg-primary rounded-lg flex aspect-square px-1">
            <Logo className="text-background h-8 w-auto"/>
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight text-background">
                <span className="truncate font-medium">AMS Vietnam Co.,Ltd</span>
                <span className="truncate text-xs">Kolor team</span>
            </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Business</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {itemsBusiness.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton isActive={isActive(item.url)}>
                    <Link href={item.url} className="flex items-center gap-2 w-full">
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Data Manage</SidebarGroupLabel>
          <SidebarGroupContent>
          <SidebarMenu>
              {itemsData.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton isActive={isActive(item.url)}>
                    <Link href={item.url} className="flex items-center gap-2 w-full">
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Tools & Support</SidebarGroupLabel>
          <SidebarGroupContent>
          <SidebarMenu>
              {itemsTools.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton isActive={isActive(item.url)}>
                    <Link href={item.url} className="flex items-center gap-2 w-full">
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {role === "admin" && (
      <SidebarFooter>
        <AdminTab/>
      </SidebarFooter>)}
      
    </Sidebar>
  );
}