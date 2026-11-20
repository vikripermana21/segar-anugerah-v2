export default function CheckoutSteps({
  step,
  label,
}: {
  step: 1 | 2;
  label: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10.5px] font-bold tracking-[0.05em] text-accent">
          Langkah {step} dari 2
        </p>
        <p className="text-[10.5px] text-ink-3">{label}</p>
      </div>
      <div className="mt-2 flex gap-1.5" aria-hidden="true">
        <span className="h-[3px] flex-1 rounded-full bg-brand" />
        <span
          className={`h-[3px] flex-1 rounded-full ${step === 2 ? "bg-brand" : "bg-border"}`}
        />
      </div>
    </div>
  );
}
