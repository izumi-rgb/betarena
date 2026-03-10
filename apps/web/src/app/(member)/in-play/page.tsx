'use client';

import App from '@variant-exports/variant_inplay';
import { VariantErrorBoundary } from '@/components/app/VariantErrorBoundary';

export default function InPlayPage() {
  return (
    <VariantErrorBoundary>
      <App />
    </VariantErrorBoundary>
  );
}
