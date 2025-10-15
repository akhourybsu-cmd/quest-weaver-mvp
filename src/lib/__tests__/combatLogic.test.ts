/**
 * Test utilities for combat logic (concentration, death saves)
 */

export interface ConcentrationTestCase {
  name: string;
  damageAmount: number;
  expectedDC: number;
}

export interface DeathSaveTestCase {
  name: string;
  successes: number;
  failures: number;
  expectedState: "stable" | "dead" | "ongoing";
}

// Concentration DC: max(10, damage/2)
export const concentrationTests: ConcentrationTestCase[] = [
  {
    name: "Low damage (5) -> DC 10",
    damageAmount: 5,
    expectedDC: 10,
  },
  {
    name: "Medium damage (15) -> DC 10",
    damageAmount: 15,
    expectedDC: 10,
  },
  {
    name: "High damage (20) -> DC 10",
    damageAmount: 20,
    expectedDC: 10,
  },
  {
    name: "Very high damage (30) -> DC 15",
    damageAmount: 30,
    expectedDC: 15,
  },
  {
    name: "Massive damage (50) -> DC 25",
    damageAmount: 50,
    expectedDC: 25,
  },
  {
    name: "1 damage -> DC 10 (minimum)",
    damageAmount: 1,
    expectedDC: 10,
  },
];

export const deathSaveTests: DeathSaveTestCase[] = [
  {
    name: "No saves yet -> ongoing",
    successes: 0,
    failures: 0,
    expectedState: "ongoing",
  },
  {
    name: "1 success, 2 failures -> ongoing",
    successes: 1,
    failures: 2,
    expectedState: "ongoing",
  },
  {
    name: "3 successes -> stable",
    successes: 3,
    failures: 0,
    expectedState: "stable",
  },
  {
    name: "3 successes, 2 failures -> stable",
    successes: 3,
    failures: 2,
    expectedState: "stable",
  },
  {
    name: "3 failures -> dead",
    successes: 0,
    failures: 3,
    expectedState: "dead",
  },
  {
    name: "2 successes, 3 failures -> dead",
    successes: 2,
    failures: 3,
    expectedState: "dead",
  },
];

export function calculateConcentrationDC(damageAmount: number): number {
  return Math.max(10, Math.floor(damageAmount / 2));
}

export function validateConcentrationDC(testCase: ConcentrationTestCase): {
  passed: boolean;
  actualDC: number;
  expectedDC: number;
} {
  const actualDC = calculateConcentrationDC(testCase.damageAmount);
  return {
    passed: actualDC === testCase.expectedDC,
    actualDC,
    expectedDC: testCase.expectedDC,
  };
}

export function determineDeathSaveState(
  successes: number,
  failures: number
): "stable" | "dead" | "ongoing" {
  if (successes >= 3) return "stable";
  if (failures >= 3) return "dead";
  return "ongoing";
}

export function validateDeathSave(testCase: DeathSaveTestCase): {
  passed: boolean;
  actualState: string;
  expectedState: string;
} {
  const actualState = determineDeathSaveState(
    testCase.successes,
    testCase.failures
  );
  return {
    passed: actualState === testCase.expectedState,
    actualState,
    expectedState: testCase.expectedState,
  };
}

export function runAllConcentrationTests(): {
  passed: number;
  failed: number;
  results: Array<{ test: string; passed: boolean; details: string }>;
} {
  const results = concentrationTests.map((test) => {
    const validation = validateConcentrationDC(test);
    return {
      test: test.name,
      passed: validation.passed,
      details: validation.passed
        ? `✓ DC ${validation.expectedDC}`
        : `✗ Expected DC ${validation.expectedDC}, got DC ${validation.actualDC}`,
    };
  });

  return {
    passed: results.filter((r) => r.passed).length,
    failed: results.filter((r) => !r.passed).length,
    results,
  };
}

export function runAllDeathSaveTests(): {
  passed: number;
  failed: number;
  results: Array<{ test: string; passed: boolean; details: string }>;
} {
  const results = deathSaveTests.map((test) => {
    const validation = validateDeathSave(test);
    return {
      test: test.name,
      passed: validation.passed,
      details: validation.passed
        ? `✓ ${validation.expectedState}`
        : `✗ Expected ${validation.expectedState}, got ${validation.actualState}`,
    };
  });

  return {
    passed: results.filter((r) => r.passed).length,
    failed: results.filter((r) => !r.passed).length,
    results,
  };
}
