// components/formatted-number-input.tsx
"use client"
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { InputGroupInput } from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

interface FormattedNumberInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    id?: string;
    disabled?: boolean;
    asGroupInput?: boolean; // true = render InputGroupInput, for use inside <InputGroup>
}

export function FormattedNumberInput({
    value,
    onChange,
    placeholder,
    className,
    id,
    disabled,
    asGroupInput,
}: FormattedNumberInputProps) {
    const [isFocused, setIsFocused] = useState(false);

    const displayValue = isFocused
        ? value
        : value
            ? Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : "";

    const sharedProps = {
        id,
        type: "text" as const,
        inputMode: "decimal" as const,
        placeholder,
        disabled,
        className: cn("no-spinner", className),
        value: displayValue,
        onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
            setIsFocused(true);
            e.target.select();
        },
        onBlur: () => setIsFocused(false),
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            let raw = e.target.value.replace(/[^0-9.]/g, "");
            const parts = raw.split(".");
            if (parts.length > 2) raw = parts[0] + "." + parts.slice(1).join("");
            onChange(raw);
        },
    };

    return asGroupInput ? <InputGroupInput {...sharedProps} /> : <Input {...sharedProps} />;
}