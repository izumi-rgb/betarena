const currencyFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(amount: number): string {
  return `${currencyFormatter.format(amount)} CR`;
}

export function formatOdds(odds: number): string {
  return odds.toFixed(2);
}
