// components/highlight-text.tsx
interface HighlightTextProps {
    text: string | null | undefined;
    query: string;
    className?: string;
}

export function HighlightText({ text, query, className }: HighlightTextProps) {
    if (!text) return null;

    const trimmedQuery = query.trim();
    if (!trimmedQuery) return <span className={className}>{text}</span>;

    const escaped = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escaped})`, "gi"));

    return (
        <span className={className}>
            {parts.map((part, i) =>
                part.toLowerCase() === trimmedQuery.toLowerCase() ? (
                    <mark key={i} className="bg-yellow-200 text-inherit rounded-[2px] px-0.5">
                        {part}
                    </mark>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </span>
    );
}