'use client';

import LoginScreen from '@variant-exports/variant_login';
import { VariantErrorBoundary } from '@/components/app/VariantErrorBoundary';

export default function Page() {
  return (
    <VariantErrorBoundary>
      <LoginScreen />
    </VariantErrorBoundary>
  );
}
