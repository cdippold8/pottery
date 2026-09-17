export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="mb-4 text-2xl font-semibold">Contact</h1>
      <p className="text-sm leading-relaxed text-muted">
        Interested in carrying a piece at your shop, or want something custom? Reach out
        at{" "}
        <a href="mailto:hello@example.com" className="text-foreground underline">
          hello@example.com
        </a>
        .
      </p>
    </div>
  );
}
