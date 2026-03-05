export function SiteFooter() {
  return (
    <footer className="footer-sheen border-t border-border/35 bg-card/85">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 px-6 py-10 sm:flex-row">
        <div className="text-center sm:text-left">
          <span className="text-sm font-semibold tracking-tight text-primary">
            LeadScorer<span className="text-accent">.ai</span>
          </span>
          <p className="mt-1 text-xs text-muted-foreground">Built for small sales teams that need fast lead decisions.</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground sm:justify-end sm:gap-3">
          <a href="/privacy" className="rounded-md px-2 py-1.5 transition-colors hover:bg-background/70 hover:text-foreground">
            Privacy
          </a>
          <a href="/terms" className="rounded-md px-2 py-1.5 transition-colors hover:bg-background/70 hover:text-foreground">
            Terms
          </a>
          <a
            href="mailto:founders@leadscorer.ai"
            className="rounded-md px-2 py-1.5 transition-colors hover:bg-background/70 hover:text-foreground"
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
