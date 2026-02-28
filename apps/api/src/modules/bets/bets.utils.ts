/**
 * Generates all k-sized combinations from an array.
 */
export function combinations<T>(arr: T[], k: number): T[][] {
  if (k > arr.length || k <= 0) return [];
  if (k === arr.length) return [arr];
  if (k === 1) return arr.map((v) => [v]);

  const result: T[][] = [];
  for (let i = 0; i <= arr.length - k; i++) {
    const head = arr[i];
    const tailCombos = combinations(arr.slice(i + 1), k - 1);
    for (const tail of tailCombos) {
      result.push([head, ...tail]);
    }
  }
  return result;
}

export interface SystemBetType {
  name: string;
  minSelections: number;
  maxSelections: number;
  comboSizes: number[];
}

export const SYSTEM_BET_TYPES: Record<string, SystemBetType> = {
  trixie: { name: 'Trixie', minSelections: 3, maxSelections: 3, comboSizes: [2, 3] },
  patent: { name: 'Patent', minSelections: 3, maxSelections: 3, comboSizes: [1, 2, 3] },
  yankee: { name: 'Yankee', minSelections: 4, maxSelections: 4, comboSizes: [2, 3, 4] },
  lucky15: { name: 'Lucky 15', minSelections: 4, maxSelections: 4, comboSizes: [1, 2, 3, 4] },
  lucky31: { name: 'Lucky 31', minSelections: 5, maxSelections: 5, comboSizes: [1, 2, 3, 4, 5] },
  lucky63: { name: 'Lucky 63', minSelections: 6, maxSelections: 6, comboSizes: [1, 2, 3, 4, 5, 6] },
};

export function getSystemBetCount(selectionCount: number, comboSizes: number[]): number {
  let total = 0;
  for (const k of comboSizes) {
    total += combinations(Array.from({ length: selectionCount }), k).length;
  }
  return total;
}

export function calculatePlaceOdds(decimalOdds: number, ewFraction: number): number {
  return (decimalOdds - 1) / ewFraction + 1;
}

export const VALID_AH_LINES = [
  -3, -2.75, -2.5, -2.25, -2, -1.75, -1.5, -1.25, -1, -0.75, -0.5, -0.25,
  0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3,
];

export function isQuarterLine(line: number): boolean {
  return line % 0.5 !== 0;
}
