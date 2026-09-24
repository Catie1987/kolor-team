// app/dashboard/calculation/page.tsx  (Server Component — no "use client")
import { Metadata } from "next";
import { CalculationClient } from "./calculation-client";

export const metadata: Metadata = {
  title: "Price Calculation",
};

export default function CalculationPage() {
  return <CalculationClient />;
}