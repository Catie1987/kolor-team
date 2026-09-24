"use client"
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ArrowBigRight } from "lucide-react";
import {cn} from "@/lib/utils"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const MAX_ITEMS = 5;

export interface ShipmentItem {
    id: string;
    name: string;
    quantity: string;
    unit: string;
    price: string;
    sharedCost: string;
    dutyPercent: string;
    outbound: string;
    margin: string;
}

interface ItemListFieldProps {
    planType: string;
    items: ShipmentItem[];
    sharedName: string;
    combineQuantity: string;
    grandTotal: number;
    dutyEditable: boolean; 
    hideDuty: boolean;
    landedCost: number;
    inboundOperationCost: number;
    outboundCost: number;
    totalOutboundQuantity: number;
    incoterm: string;
    onAddItem: () => void;
    onRemoveItem: (id: string) => void;
    onUpdateItem: (id: string, field: keyof Omit<ShipmentItem, "id">, value: string) => void;
    onSharedNameChange: (value: string) => void;
    onCombineQuantityChange: (value: string) => void;
    onUpdateQuantity: (id: string, value: string) => void;
    onUpdateOutbound: (id: string, value: string) => void;
}

export function ItemListField({
    planType,
    items,
    sharedName,
    combineQuantity,
    grandTotal,
    dutyEditable,
    hideDuty,
    landedCost,
    inboundOperationCost,
    outboundCost,
    totalOutboundQuantity,
    incoterm,
    onAddItem,
    onRemoveItem,
    onUpdateItem,
    onSharedNameChange,
    onCombineQuantityChange,
    onUpdateOutbound,
    onUpdateQuantity,
}: ItemListFieldProps) {

    return (
        <ScrollArea className="w-full whitespace-nowrap">
        <div className={cn(planType === "single" && "flex items-start gap-2 w-max", "mx-1 w-max")}>
            {planType === "single" && (
                <div className="grid gap-2 w-fit">
                    <Label htmlFor="sharedItemName">Item Name:</Label>
                    <Input
                        id="sharedItemName"
                        type="text"
                        placeholder="Item names"
                        value={sharedName}
                        onChange={(e) => onSharedNameChange(e.target.value)}
                        className='w-40'
                    />
                </div>
            )}

            <div className="grid gap-2">
                {items.map((item, index) => {
                    const shareItemCost =
                    planType === "single"
                        ? Number(item.quantity) > 0
                            ? (Number(landedCost) || 0) / Number(item.quantity)
                            : 0
                        : Number(grandTotal) > 0
                            ? (Number(landedCost) || 0) / Number(grandTotal)
                            : 0;
                    const inboundShareCost =
                    planType === "single"
                        ? Number(item.quantity) > 0
                            ? inboundOperationCost / Number(item.quantity)
                            : 0
                        : Number(grandTotal) > 0
                            ? inboundOperationCost / Number(grandTotal)
                            : 0;

                    const unitCOGS =
                        (Number(item.price) || 0) + shareItemCost + inboundShareCost;
                    const effectiveDutyPercent = dutyEditable && !hideDuty ? Number(item.dutyPercent) || 0 : 0;
                    const landedUnitCost =
                        unitCOGS * (1 + (Number(effectiveDutyPercent) || 0) / 100);
                    
                    const outboundShareCost =
                    Number(item.outbound) > 0 && totalOutboundQuantity > 0
                        ? (outboundCost * (Number(item.outbound) / totalOutboundQuantity)) / Number(item.outbound)
                        : 0;

                    const totalUnitCost = landedUnitCost + outboundShareCost;    
                    
                    const sellingPrice = totalUnitCost/(1 - Number(item.margin)/100)
                    return(
                    <div
                        key={item.id}
                        className="flex items-center gap-2 @[300px]/card:flex-nowrap flex-wrap"
                    >
                        {planType !== "single" && (
                            <div className="grid gap-2">
                                {index === 0 && (
                                    <Label>{planType === "single" ? "MOQ / Quantity List:" : "Item List:"}</Label>
                                )}
                                <Input
                                    id={`itemName-${item.id}`}
                                    type="text"
                                    placeholder={`Item ${index + 1}`}
                                    value={item.name}
                                    onChange={(e) => onUpdateItem(item.id, "name", e.target.value)}
                                    className="w-40"
                                />
                            </div>
                        )}
                        <div className="grid gap-2">
                            {index === 0 && (
                                <Label>Quantity</Label>
                            )}
                            <Input
                                id={`quantity-${item.id}`}
                                type="number"
                                min={0}
                                placeholder="0"
                                className='w-18'
                                value={item.quantity}
                                onChange={(e) => onUpdateQuantity(item.id, e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            {index === 0 && (<div className="w-5 h-3.5"/>)}
                            <Input
                                id={`unit-${item.id}`}
                                type="text"
                                placeholder="kg"
                                className="w-18"
                                value={item.unit}
                                onChange={(e) => onUpdateItem(item.id, "unit", e.target.value)}
                            />
                        </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => onRemoveItem(item.id)}
                                disabled={items.length === 1}
                                className={cn("shrink-0 text-muted-foreground hover:text-destructive", index===0 && "mt-5")}
                            >
                                <Trash2 className="size-4" />
                            </Button>
                        <div className="grid gap-2">
                            {index === 0 && (
                                <Label>Unit Price</Label>
                            )}
                            <InputGroup className="w-38">
                                <InputGroupAddon>
                                    <InputGroupText>$</InputGroupText>
                                </InputGroupAddon>
                                    <InputGroupInput 
                                    id={`price-${item.id}`}
                                    type="number"
                                    min={0}
                                    placeholder="0.00"
                                    className='no-spinner'
                                    value={item.price}
                                    onChange={(e) => onUpdateItem(item.id, "price", e.target.value)}
                                    />
                                <InputGroupAddon align="inline-end">
                                    <InputGroupText className="text-xs mt-1">USD/{item.unit}</InputGroupText>
                                </InputGroupAddon>
                            </InputGroup>
                        </div>
                        {incoterm !== "ddp" && (
                        <div className="grid gap-2">
                            {index === 0 && (
                                <Label>Shared cost</Label>
                            )}
                            <InputGroup className="w-24 bg-muted">
                                <InputGroupAddon>
                                    <InputGroupText>$</InputGroupText>
                                </InputGroupAddon>
                                <InputGroupInput 
                                    id={`sharecost-${item.id}`}
                                    type="number"
                                    min={0}
                                    placeholder="0.00"
                                    className='no-spinner'
                                    value={shareItemCost.toFixed(2)}
                                    readOnly
                                />
                            </InputGroup>
                        </div>
                        )}
                        
                        {dutyEditable && !hideDuty && (
                        <div className="grid gap-2">
                            {index === 0 && (
                                <Label>Import Tax</Label>
                            )}
                            <InputGroup className="w-18">
                                <InputGroupInput 
                                    id={`duty-${item.id}`}
                                    type="number"
                                    min={0}
                                    max={500}
                                    placeholder="0.00"
                                    className={`no-spinner ${!dutyEditable ? "opacity-50" : ""}`}
                                    disabled={!dutyEditable}
                                    value={dutyEditable && !hideDuty ? item.dutyPercent : "0"}
                                    onChange={(e) => onUpdateItem(item.id, "dutyPercent", e.target.value)}
                                />
                                <InputGroupAddon align="inline-end">
                                    <InputGroupText className="text-xs mt-1">%</InputGroupText>
                                </InputGroupAddon>
                            </InputGroup>
                        </div>
                        )}

                        <div className="grid gap-2">
                            {index === 0 && (
                                <Label>Inbound</Label>
                            )}
                            <InputGroup className="w-24 bg-muted">
                                <InputGroupAddon>
                                    <InputGroupText>$</InputGroupText>
                                </InputGroupAddon>
                                <InputGroupInput 
                                    id={`inbound-${item.id}`}
                                    type="number"
                                    min={0}
                                    placeholder="0.00"
                                    className='no-spinner'
                                    value={inboundShareCost.toFixed(2)}
                                    readOnly
                                />
                            </InputGroup>
                        </div>
                        <ArrowBigRight className={cn("size-4 fill-primary text-primary", index === 0 && "mt-5")}/>
                        <div className="grid gap-2">
                            {index === 0 && (
                                <Label className="text-primary">COGs</Label>
                            )}
                            <InputGroup className="w-24">
                                <InputGroupAddon>
                                    <InputGroupText className="text-primary mt-0.5 font-semibold">$</InputGroupText>
                                </InputGroupAddon>
                                <InputGroupInput 
                                    id={`cogs-${item.id}`}
                                    type="number"
                                    min={0}
                                    className='no-spinner text-primary'
                                    value={landedUnitCost.toFixed(2)}
                                    readOnly
                                />
                            </InputGroup>
                        </div>
                        <ArrowBigRight className={cn("size-4 fill-primary text-primary", index === 0 && "mt-5")}/>
                        <div className="grid gap-2">
                            {index === 0 && (
                                <Label>Shared Delivery Cost</Label>
                            )}
                            <div className="flex items-center gap-2">
                                <InputGroup className="w-24">
                                    <InputGroupInput 
                                        id={`outbound-${item.id}`}
                                        type="number"
                                        min={0}
                                        max={Number(item.quantity) || undefined}
                                        placeholder="0"
                                        className='no-spinner'
                                        value={item.outbound}
                                        onChange={(e) => onUpdateOutbound(item.id, e.target.value)}
                                    />
                                    <InputGroupAddon align="inline-end">
                                        <InputGroupText>{item.unit}</InputGroupText>
                                    </InputGroupAddon>
                                </InputGroup>
                                <InputGroup className="w-24 bg-muted">
                                    <InputGroupAddon>
                                        <InputGroupText>$</InputGroupText>
                                    </InputGroupAddon>
                                    <InputGroupInput 
                                        id={`outboundShareCost-${item.id}`}
                                        type="number"
                                        min={0}
                                        placeholder=""
                                        className='no-spinner'
                                        value={outboundShareCost.toFixed(2)}
                                        readOnly
                                    />
                                </InputGroup>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            {index === 0 && (
                                <Label>Net Cost</Label>
                            )}
                            <InputGroup className="w-24 bg-muted">
                                <InputGroupAddon>
                                    <InputGroupText>$</InputGroupText>
                                </InputGroupAddon>
                                <InputGroupInput 
                                    id={`netCost-${item.id}`}
                                    type="number"
                                    min={0}
                                    placeholder=""
                                    className='no-spinner'
                                    value={totalUnitCost.toFixed(2)}
                                    readOnly
                                />
                                </InputGroup>
                        </div>
                        <div className="grid gap-2">
                            {index === 0 && (
                                <Label>Margin</Label>
                            )}
                            <InputGroup className="w-18">
                                <InputGroupInput 
                                    id={`margin-${item.id}`}
                                    type="number"
                                    min={0}
                                    max={500}
                                    placeholder="0.00"
                                    className="no-spinner"
                                    value={item.margin}
                                    onChange={(e) => onUpdateItem(item.id, "margin", e.target.value)}
                                />
                                <InputGroupAddon align="inline-end">
                                    <InputGroupText className="text-xs mt-1">%</InputGroupText>
                                </InputGroupAddon>
                            </InputGroup>
                        </div>
                        <div className="grid gap-2">
                            {index === 0 && (
                                <Label>Selling Price</Label>
                            )}
                            <InputGroup className="w-30 bg-primary/10 border-primary">
                                <InputGroupAddon>
                                    <InputGroupText className="text-primary mt-0.5 font-semibold">$</InputGroupText>
                                </InputGroupAddon>
                                <InputGroupInput 
                                    id={`sellingPrice-${item.id}`}
                                    type="number"
                                    min={0}
                                    max={500}
                                    placeholder=""
                                    className="no-spinner text-primary font-semibold"
                                    value={sellingPrice.toFixed(2)}
                                />
                            </InputGroup>
                        </div>
                    </div>
                    )
                })}

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onAddItem}
                    disabled={items.length >= MAX_ITEMS}
                    className="w-fit"
                >
                    <Plus className="size-4" />
                    {planType === "single" ? "Add MOQ row" : "Add item"}
                </Button>
            </div>

            {planType === "combine" && (
                <div className="flex items-center gap-2 mt-2">
                    <Label htmlFor="combineQuantity" className="w-40">Combine with:</Label>
                    <Input
                        id="combineQuantity"
                        type="number"
                        min={0}
                        placeholder="0.00"
                        value={combineQuantity}
                        onChange={(e) => onCombineQuantityChange(e.target.value)}
                        className="w-40"
                    />
                    <span className="">{items[0]?.unit || "kg"}</span>
                </div>
            )}

            {(planType === "multiple" || planType === "combine") && (
                <div className="mt-2">
                    <div className="shrink-0 bg-border h-px max-w-sm"/>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground w-40">
                            {planType === "combine" ? "Total shipment quantity" : "Total quantity"}
                        </span>
                        <span className="text-lg font-semibold">
                            {grandTotal.toLocaleString()} {items[0]?.unit || "kg"}
                        </span>
                    </div>
                </div>
            )}
        </div>
        <ScrollBar orientation="horizontal" className="translate-y-4"/>
        </ScrollArea>
    );
}