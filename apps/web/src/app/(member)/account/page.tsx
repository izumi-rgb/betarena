'use client';

import App from '@variant-exports/variant_my_account';
import { VariantErrorBoundary } from '@/components/app/VariantErrorBoundary';

export default function AccountPage() {
  return (
    <VariantErrorBoundary>
      <App />
    </VariantErrorBoundary>
  );
}
