// components/shipper-field.tsx
"use client"
import { Card } from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export const planTypes = [
    { label: "Single", value: "single", id: "single-plan", description: "One item with various MOQ." },
    { label: "Multiple", value: "multiple", id: "multiple-plan", description: "Many items in one shipment" },
    { label: "Combine", value: "combine", id: "combine-plan", description: "Combine with other items" },
]

interface ShipperFieldProps {
    planType: string;
    onPlanTypeChange: (value: string | null) => void;
    origin: string;
    onOriginChange: (value: string) => void;
}

export function ShipperField({ planType, onPlanTypeChange, origin, onOriginChange }: ShipperFieldProps) {
    return (
        <Card className="@container/card w-full p-4 gap-4">
            <div className="flex items-center justify-between">
                <h2 className="text-sm text-muted-foreground">Shipper & Items Detail</h2>
            </div>

            <RadioGroup
                value={planType}
                onValueChange={onPlanTypeChange}
                className="w-full grid @[400px]/card:grid-cols-3"
            >
                {planTypes.map((item => (
                    <FieldLabel htmlFor={item.id} key={item.id}>
                        <Field orientation="horizontal">
                        <FieldContent>
                            <FieldTitle>{item.label}</FieldTitle>
                            <FieldDescription className="text-xs">
                                {item.description}
                            </FieldDescription>
                        </FieldContent>
                        <RadioGroupItem value={item.value} id={item.id} />
                        </Field>
                    </FieldLabel>
                )))}
            </RadioGroup>

            <div className="grid grid-cols-2 gap-2">
                <Label htmlFor="shipperOrigin">Shipper Origin:</Label>
                <Input
                    id="shipperOrigin"
                    type="text"
                    placeholder="Japan"
                    value={origin}
                    onChange={(e) => onOriginChange(e.target.value)}
                />
            </div>
        </Card>
    )
}