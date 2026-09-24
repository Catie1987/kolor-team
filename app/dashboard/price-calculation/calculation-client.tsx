// app/dashboard/calculation/calculation-client.tsx  (Client Component — your interactive UI)
"use client"
import { SelectTerm } from "./select-term";
import { Tabs } from "@/components/ui/tabs";
import { useId, useMemo, useRef, useState } from "react";
import { CalculationField } from "./calculation-field";
import { ShipperField } from "./shipper-field";
import { ReceiverField, WarehouseType } from "./receiver-field";
import { ItemListField, ShipmentItem } from "./item-list-field";
import { CostKey, incotermResponsibility } from "@/lib/incoterm-rules";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SaveTemplateDialog } from "./templates/save-template-dialog";
import { CalculationTemplateData } from "@/lib/actions/calculation-templates";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { TemplateListDrawer } from "./templates/template-list-drawer";

const emptyCosts: Record<Exclude<CostKey, "importDuty">, string> = {
    exportCustoms: "",
    freight: "",
    insurance: "",
    destinationFees: "",
};

export function CalculationClient() {
    const idPrefix = useId(); // stable across server + client render
    const itemCounter = useRef(0);

    const createItem = (name = ""): ShipmentItem => {
        itemCounter.current += 1;
        return {
            id: `${idPrefix}-item-${itemCounter.current}`,
            name,
            quantity: "",
            unit: "kg",
            price: "",
            dutyPercent: "",
            sharedCost: "",
            outbound: "",
            margin: "",
        };
    };
    const [transportType, setTransportType] = useState("air");
    const [incoterm, setIncoterm] = useState("cif");
    const [planType, setPlanType] = useState("single");
    const [customerType, setCustomerType] = useState("epe");
    const [warehouseType, setWarehouseType] = useState<WarehouseType>("bonded");
    const [warehouseTotal, setWarehouseTotal] = useState(0);
    const [origin, setOrigin] = useState("");
    const [items, setItems] = useState<ShipmentItem[]>([createItem()]);
    const [sharedName, setSharedName] = useState("");
    const [combineQuantity, setCombineQuantity] = useState("");
    const responsibility = incotermResponsibility[incoterm] ?? incotermResponsibility.exw;
    const [landedCost, setLandedCost] = useState(0);
    const [inboundOperationCost, setInboundOperationCost] = useState(0);
    const [outboundCost, setOutboundCost] = useState(0);
    const [costs, setCosts] = useState(emptyCosts);
    const [clearOpen, setClearOpen] = useState(false);
    const [warehouseIn, setWarehouseIn] = useState("");
    const [warehouseOperation, setWarehouseOperation] = useState("");
    const [warehouseOut, setWarehouseOut] = useState("");

    const addItem = () => {
        setItems((prev) => [...prev, createItem(planType === "single" ? sharedName : "")]);
    };

    const removeItem = (id: string) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
    };

    const updateItem = (id: string, field: keyof Omit<ShipmentItem, "id">, value: string) => {
        setItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
        );
    };

    const handleSharedNameChange = (value: string) => {
        setSharedName(value);
        setItems((prev) => prev.map((item) => ({ ...item, name: value })));
    };

    const handlePlanTypeChange = (value: string | null) => {
        if (!value) return;
        setPlanType(value);
        if (value === "single") {
            setItems((prev) => prev.map((item) => ({ ...item, name: sharedName })));
        }
    };

    const itemsTotal = useMemo(
        () => items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
        [items]
    );

    const grandTotal = useMemo(() => {
        if (planType === "combine") {
            return itemsTotal + (Number(combineQuantity) || 0);
        }
        return itemsTotal;
    }, [planType, itemsTotal, combineQuantity]);

    const totalOutboundQuantity = useMemo(
        () => items.reduce((sum, item) => sum + (Number(item.outbound) || 0), 0),
        [items]
    );

    const hideDuty = warehouseType === "bonded" && customerType === "epe";

    const updateQuantity = (id: string, value: string) => {
        setItems((prev) =>
            prev.map((item) => {
                if (item.id !== id) return item;
                const newQuantity = value;
                const numQuantity = Number(newQuantity) || 0;
                const numOutbound = Number(item.outbound) || 0;
                const shouldSyncOutbound = item.outbound === "" || numOutbound > numQuantity || item.outbound === item.quantity;
                return {
                    ...item,
                    quantity: newQuantity,
                    outbound: shouldSyncOutbound ? newQuantity : item.outbound,
                };
            })
        );
    };

    const updateOutbound = (id: string, value: string) => {
        setItems((prev) =>
            prev.map((item) => {
                if (item.id !== id) return item;
                const maxAllowed = Number(item.quantity) || 0;
                const entered = Number(value) || 0;
                // Clamp: never allow outbound to exceed quantity
                const clamped = entered > maxAllowed ? String(maxAllowed) : value;
                return { ...item, outbound: clamped };
            })
        );
    };
    const getTemplateData = (): CalculationTemplateData => ({
        transportType,
        incoterm,
        planType,
        customerType,
        warehouseType,
        origin,
        items,
        sharedName,
        combineQuantity,
        costs,
        warehouseIn,
        warehouseOperation,
        warehouseOut,
    });

    const applyTemplate = (data: CalculationTemplateData) => {
        setTransportType(data.transportType);
        setIncoterm(data.incoterm);
        setPlanType(data.planType);
        setCustomerType(data.customerType);
        setWarehouseType(data.warehouseType as WarehouseType);
        setOrigin(data.origin);
        setItems(data.items);
        setSharedName(data.sharedName);
        setCombineQuantity(data.combineQuantity);
        setCosts(data.costs ?? emptyCosts);
        setWarehouseIn(data.warehouseIn ?? "");
        setWarehouseOperation(data.warehouseOperation ?? "");
        setWarehouseOut(data.warehouseOut ?? "");
    };

    const resetForm = () => {
        setTransportType("air");
        setIncoterm("cif");
        setPlanType("single");
        setCustomerType("epe");
        setWarehouseType("bonded");
        setWarehouseTotal(0);
        setOrigin("");
        setItems([createItem()]);
        setSharedName("");
        setCombineQuantity("");
        setLandedCost(0);
        setInboundOperationCost(0);
        setOutboundCost(0);
        setCosts(emptyCosts);
        setClearOpen(false);
        setWarehouseIn("");
        setWarehouseOperation("");
        setWarehouseOut("");
    };
    const totalWarehouseCharge =
        (Number(warehouseIn) || 0) +
        (Number(warehouseOperation) || 0) +
        (Number(warehouseOut) || 0);

    return (
        <div className="@container/main flex-1 flex flex-col w-full py-2 gap-4 md:py-4 px-2 lg:px-4">
            <Card className="@container/card w-full px-4">
                <div className="flex gap-x-2 gap-y-4 items-center justify-between flex-col @[500px]/card:flex-row">
                    <Tabs value={incoterm} onValueChange={(v) => v && setIncoterm(v)}>
                        <SelectTerm
                            transportType={transportType}
                            onTransportTypeChange={setTransportType}
                        />
                    </Tabs>
                    <div className="flex flex-wrap items-center gap-2 @[500px]/card:w-fit w-full">
                        <SaveTemplateDialog getData={getTemplateData} />
                        <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
                            <AlertDialogTrigger render={
                                <Button variant="outline" className="mr-auto">
                                    Clear
                                </Button> 
                            }/>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently clear all your calculation and reset from beginning.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={resetForm}>Continue</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <TemplateListDrawer onApply={applyTemplate}/>
                    </div>
                </div>
            </Card>
            <div className="w-full grid grid-cols-1 gap-4 @4xl/main:grid-cols-3">
                <ShipperField
                    planType={planType}
                    onPlanTypeChange={handlePlanTypeChange}
                    origin={origin}
                    onOriginChange={setOrigin}
                />
                <CalculationField 
                    transportType={transportType} 
                    incoterm={incoterm} 
                    onLandedCostChange={setLandedCost}
                    costs={costs}
                    onCostsChange={setCosts}
                />
                <ReceiverField 
                    transportType={transportType}
                    warehouseType={warehouseType}
                    onWarehouseTypeChange={setWarehouseType}
                    customerType={customerType}
                    onCustomerTypeChange={setCustomerType}
                    warehouseIn={warehouseIn}
                    onWarehouseInChange={setWarehouseIn}
                    warehouseOperation={warehouseOperation}
                    onWarehouseOperationChange={setWarehouseOperation}
                    warehouseOut={warehouseOut}
                    onWarehouseOutChange={setWarehouseOut}
                    onInboundOperationCostChange={setInboundOperationCost}
                    onOutboundCostChange={setOutboundCost}
                />
            </div>
            <div className="border rounded-lg shadow-sm min-h-20 w-full bg-card px-3 py-4">
                <ItemListField
                    planType={planType}
                    items={items}
                    sharedName={sharedName}
                    combineQuantity={combineQuantity}
                    grandTotal={grandTotal}
                    dutyEditable={responsibility.importDuty}
                    landedCost={landedCost}
                    inboundOperationCost={inboundOperationCost}
                    outboundCost={outboundCost}
                    totalOutboundQuantity={totalOutboundQuantity}
                    incoterm={incoterm}
                    hideDuty={hideDuty}
                    onAddItem={addItem}
                    onRemoveItem={removeItem}
                    onUpdateItem={updateItem}
                    onSharedNameChange={handleSharedNameChange}
                    onCombineQuantityChange={setCombineQuantity}
                    onUpdateQuantity={updateQuantity}
                    onUpdateOutbound={updateOutbound}
                />
            </div>
        </div>
    );
}