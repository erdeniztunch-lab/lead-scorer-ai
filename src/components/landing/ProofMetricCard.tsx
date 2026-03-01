export interface ProofMetricCardProps {
  metric: string;
  label: string;
  detail: string;
  context: string;
}

export function ProofMetricCard({ metric, label, detail, context }: ProofMetricCardProps) {
  return (
    <div className="surface-elevated rounded-2xl p-5">
      <p className="text-3xl font-bold tracking-tight text-primary">{metric}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{label}</p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{detail}</p>
      <p className="mt-4 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/80">{context}</p>
    </div>
  );
}
