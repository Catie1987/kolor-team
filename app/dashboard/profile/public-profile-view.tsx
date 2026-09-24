import type { User } from "@clerk/nextjs/server";
import { TrendingUp, TrendingDown, UserRoundPen } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {Card} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import Link from "next/link";
import { employmentTypeOptions } from "@/lib/helper";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { SalesContributionChart } from "./public-component/sales-contribution-chart";

export default function PublicProfileView({
  user,
  isOwner,
}: {
  user: User;
  isOwner?: boolean;
}) {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "—";
    const initials =
        fullName !== "—"
        ? fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
        : "U";

    const joinedDate = user.createdAt
        ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
        : null;

    const role = (user.publicMetadata?.role as string) ?? "other";
    const {
        workAt = "",
        branch = "",
        department = "",
        position = "",
        employmentType = "",
        workingHour = "",
        personalPhone = "",
        dateOfBirth = "",
        bio = "",
    } = user.unsafeMetadata as {
        workAt?: string;
        branch?: string;
        department?: string;
        position?: string;
        employmentType?: string;
        workingHour?: string;
        personalPhone?: string;
        dateOfBirth?: string;
        bio?: string;
    };
    const contractType = employmentTypeOptions.find(
        (item) => item.value === employmentType
    );
    return(
        <div className={cn("grid gap-4 *:data-[slot=card]:shadow-xs px-4 lg:px-6 ",
            "grid-cols-1 @xl/main:grid-cols-2 @5xl/main:grid-cols-4",
        )}>
            <Card className="@container/card @xl/main:col-span-2 relative">
                <div className="flex flex-col @[520px]/card:flex-row items-center px-4 gap-4">
                    <div className='flex flex-col justify-center items-center max-w-72 w-full'> 
                        <Avatar className="size-32 shrink-0 after:rounded-lg">
                            <AvatarImage src={user.imageUrl} alt={fullName} className="rounded-lg"/>
                            <AvatarFallback className="text-lg rounded-lg">{initials}</AvatarFallback>
                        </Avatar>
                        <p className="text-xl font-bold tabular-nums @[250px]/card:text-2xl mt-8 text-primary">
                            {fullName}
                        </p>
                        <span className="text-muted-foreground">
                            {user.emailAddresses[0]?.emailAddress}
                        </span>
                        <span className="text-muted-foreground">
                            Joined at: {joinedDate ? format(joinedDate, "MMM dd, yyyy") : "—"}
                        </span>
                        <div className="mt-4 flex gap-2 w-full">
                            <span className="text-muted-foreground whitespace-nowrap">Bio & Hobbies:</span>
                            {bio ? (
                                <p className="text-foreground">{bio}</p>
                                ) : (
                                <div className="flex-1 border-b border-dotted border-muted-foreground/50" />
                            )}
                        </div>
                    </div>
                    <div className="bg-border shrink-0 w-px h-full @[520px]/card:block hidden"/>
                    <div className="grid grid-cols-2 w-full gap-2">
                        <div className="flex flex-col gap-1 py-4">
                            <p className="text-sm text-muted-foreground">Work at</p>
                            <span className="">{workAt ?? "—"}</span>
                        </div>
                        <div className="flex flex-col gap-1 py-4">
                            <p className="text-sm text-muted-foreground">Branch</p>
                            <span className="">{branch ?? "—"}</span>
                        </div>
                        <div className="flex flex-col gap-1 py-4">
                            <p className="text-sm text-muted-foreground">Department</p>
                            <span className="">{department ?? "—"}</span>
                        </div>
                        <div className="flex flex-col gap-1 py-4">
                            <p className="text-sm text-muted-foreground">Position</p>
                            <span className="">{position ?? "—"}</span>
                        </div>
                        <div className="flex flex-col gap-1 py-4">
                            <p className="text-sm text-muted-foreground">Contract Type</p>
                            <span className="">{contractType?.label ?? "—"}</span>
                        </div>
                        <div className="flex flex-col gap-1 py-4">
                            <p className="text-sm text-muted-foreground">Working Hours</p>
                            <span className="">{workingHour ?? "—"}</span>
                        </div>
                        <div className="flex flex-col gap-1 py-4">
                            <p className="text-sm text-muted-foreground">Phone</p>
                            <span className="">{personalPhone ?? "—"}</span>
                        </div>
                        <div className="flex flex-col gap-1 py-4">
                            <p className="text-sm text-muted-foreground">D.O.B</p>
                            <span className="">{dateOfBirth ? format(dateOfBirth, "MMM dd, yyyy") : "—"}</span>
                        </div>
                    </div>
                </div>
                <div className="absolute top-4 right-4">
                    {isOwner ? (
                        <Tooltip>
                            <TooltipTrigger render={
                                <Button size="icon-sm" variant="outline">
                                    <Link href="/dashboard/profile"><UserRoundPen/></Link>
                                </Button>}
                                />
                            <TooltipContent side="bottom">Edit your profile</TooltipContent>
                        </Tooltip>
                    ): (
                        <>
                        {role === "user" ? (
                            <Badge className="capitalize" variant="outline">
                                {role}
                            </Badge>
                        ) : (
                            <Badge className="capitalize bg-green-100/50 border-green-500/50" variant="outline">
                                {role}
                            </Badge>
                        )}
                        </>
                    )}
                </div>
            </Card>
            <div className="@xl/main:col-span-2 @[1104px]/main:grid-cols-2 @[968px]/main:grid-cols-1 @[640px]/main:grid-cols-2 gap-4 grid">
                <Card className="@container/card">
                    <SalesContributionChart/>
                </Card>
                <Card className="@container/card">
                    Project
                </Card>
            </div>
        </div>
    )
}