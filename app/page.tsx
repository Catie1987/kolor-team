import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import hero from '@/assets/image/hero.png'
import Image from "next/image"
import { ArrowRight, TrendingUp } from "lucide-react";
export default async function Home() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-180 hero-halo" />
      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <Image alt='hero-image' src={hero} height={30} width={30}/>
          <p className='text-lg font-bold tracking-tight'>Kisco Dashboard</p>
        </div>
        <Link href="./sign-in">
          <Button className='px-8 rounded-full' size='sm'>
            Sign in
          </Button>
        </Link>
      </header>
      <section className="relative mx-auto max-w-4xl px-6 pt-12 text-center sm:pt-20">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
          <TrendingUp className="size-3.5" />
          Real-time revenue reporting
        </span>
        <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] sm:text-6xl">
          Every sales number,
          <br />
          <span className="text-gradient-brand">finally in one place.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
          Track revenue, orders and product performance in a dashboard your team actually wants to
          open on Monday morning.
        </p>
        <div className="mt-8 flex items-center justify-center">
          <Link href="./waitlist">
            <Button size="lg" className="group rounded-full px-7">
              Request to join
              <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </div>
      </section>
      <section className="relative mx-auto mt-16 max-w-6xl px-6 pb-24">
        {/* <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-hero">
          <Image
            src={dashboardShot}
            alt="SalesVista dashboard showing revenue over time, revenue by product and recent sales"
            width={1600}
            height={1008}
            className="w-full"
          />
        </div> */}
      </section>
    </main>
  );
}