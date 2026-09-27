import { AppSidebar } from "@/components/app-sidebar";
import { auth } from "@clerk/nextjs/server";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { UserTab } from "@/components/user-tab";
import { RouteLoaderBar } from "@/components/router-loader-bar";
import { BreadcrumbProvider } from "@/components/provider/breadcrumb-provider";
import { DashboardBreadcrumb } from "@/components/dashboard-breadcrumb";
import { ensureUserInSupabase } from "@/lib/ensure-user";
import { cn } from "@/lib/utils";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as any)?.role;

  await ensureUserInSupabase();
  return (
    <SidebarProvider>
        <AppSidebar role={role}/>
        <SidebarInset>
          <BreadcrumbProvider>
            <main className="flex-1 p-0 md:p-2 bg-sidebar shadow-md">
                <div className="w-full min-h-full bg-background rounded-none md:rounded-lg relative flex-1">
                  <header className="bg-background shadow-sm flex h-12 border-b shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 sticky top-0 z-50 w-full pr-1 rounded-tl-lg rounded-tr-lg">
                      <SidebarTrigger className="ml-2"/>
                      <div className="bg-border shrink-0 w-px h-6"/>
                      <DashboardBreadcrumb />
                      <UserTab/>
                  </header>
                  <div className="relative flex-1 h-full mt-0">
                    <RouteLoaderBar/>
                    <div className="md:hidden w-full h-4"/>
                    {children}
                  </div>
                </div>
            </main>
          </BreadcrumbProvider>
        </SidebarInset>
    </SidebarProvider>
  );
}