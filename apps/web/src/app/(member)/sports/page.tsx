'use client';

import App from '@variant-exports/variant_home';
import { VariantErrorBoundary } from '@/components/app/VariantErrorBoundary';

export default function SportsPage() {
  return (
    <VariantErrorBoundary>
      <App />
    </VariantErrorBoundary>
  );
}
