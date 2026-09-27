"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation";
import { useRouteLoader } from "./provider/router-loader-provider";
import { ChevronsUpDown, ShieldCheck, ListTodo, GalleryVerticalEnd, BanknoteArrowDown } from 'lucide-react';
import {
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function AdminTab() {
    const router = useRouter();
    const { start } = useRouteLoader();
    const { isMobile, setOpenMobile } = useSidebar();
    const pathname = usePathname();
    const adminLinks = [
        { href: "/dashboard/assign-job", label: "Assign Job", icon: ListTodo },
        { href: "/dashboard/kpi-report", label: "KPI Report", icon: GalleryVerticalEnd },
        { href: "/dashboard/sales-payroll", label:"Sales Payroll", icon: BanknoteArrowDown }
    ];
    const handleNavigate = () => {
        setOpenMobile(false);
    };
    return (
        <>
        <div className="bg-border/50 shrink-0 h-[0.5px] w-full"/>
        <DropdownMenu>
            <DropdownMenuTrigger render={
                <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                    
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 aspect-square p-1 flex items-center justify-center rounded-sm text-background bg-primary"><ShieldCheck/></div>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-medium">Admin Panel</span>
                            <span className="truncate text-xs">manage & report</span>
                        </div>
                    </div>
                    <ChevronsUpDown className="ml-auto"/>
                </SidebarMenuButton>
            }/>  
            <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
            >
                <DropdownMenuGroup>
                    {adminLinks.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <DropdownMenuItem
                                key={item.href}
                                className={cn(isActive && "text-primary")}
                                onClick={() => {
                                    start();
                                    router.push(item.href);
                                    handleNavigate();
                                }}
                            >
                                <item.icon />
                                {item.label}
                                {isActive && <div className="ml-auto h-2 w-2 aspect-square bg-primary rounded"/>}
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
        </>
    )
}
