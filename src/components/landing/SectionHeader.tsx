import { cn } from "@/lib/utils";

export interface SectionHeaderProps {
  kicker?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeader({
  kicker,
  title,
  description,
  align = "center",
  className,
}: SectionHeaderProps) {
  const isCentered = align === "center";

  return (
    <div className={cn(isCentered ? "text-center" : "text-left", className)}>
      {kicker && <p className="section-kicker">{kicker}</p>}
      <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight text-primary md:text-4xl">{title}</h2>
      {description && (
        <p
          className={cn(
            "mt-3 text-pretty text-sm leading-relaxed text-muted-foreground md:text-base",
            isCentered ? "mx-auto max-w-2xl" : "max-w-xl",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
