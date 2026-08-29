export async function NotFoundPage() {
  return `
    <section class="container page-section" style="text-align:center;">
      <p class="eyebrow mono">404</p>
      <h2 style="margin-top:var(--space-2);">This shelf is empty.</h2>
      <p style="opacity:0.7; margin-top:var(--space-3);">Whatever you're after isn't on this page.</p>
      <a class="btn btn-primary" style="margin-top:var(--space-5); display:inline-flex;" href="#/">Back to the shop</a>
    </section>
  `;
}
