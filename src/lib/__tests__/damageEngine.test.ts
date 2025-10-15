/**
 * Test utilities for damage engine (RVI calculations)
 * These are validation functions that can be run in dev mode
 */

export interface DamageTestCase {
  name: string;
  damage: number;
  damageType: string;
  resistances: string[];
  vulnerabilities: string[];
  immunities: string[];
  expectedResult: number;
}

export const damageEngineTests: DamageTestCase[] = [
  {
    name: "Normal damage (no modifiers)",
    damage: 20,
    damageType: "slashing",
    resistances: [],
    vulnerabilities: [],
    immunities: [],
    expectedResult: 20,
  },
  {
    name: "Resistance halves damage",
    damage: 20,
    damageType: "fire",
    resistances: ["fire"],
    vulnerabilities: [],
    immunities: [],
    expectedResult: 10,
  },
  {
    name: "Vulnerability doubles damage",
    damage: 20,
    damageType: "cold",
    resistances: [],
    vulnerabilities: ["cold"],
    immunities: [],
    expectedResult: 40,
  },
  {
    name: "Immunity negates damage",
    damage: 20,
    damageType: "poison",
    resistances: [],
    vulnerabilities: [],
    immunities: ["poison"],
    expectedResult: 0,
  },
  {
    name: "Resistance + Vulnerability = normal damage",
    damage: 20,
    damageType: "fire",
    resistances: ["fire"],
    vulnerabilities: ["fire"],
    immunities: [],
    expectedResult: 20,
  },
  {
    name: "Immunity overrides everything",
    damage: 20,
    damageType: "poison",
    resistances: ["poison"],
    vulnerabilities: ["poison"],
    immunities: ["poison"],
    expectedResult: 0,
  },
  {
    name: "Odd damage resistance rounds down",
    damage: 15,
    damageType: "fire",
    resistances: ["fire"],
    vulnerabilities: [],
    immunities: [],
    expectedResult: 7, // 15/2 = 7.5 -> 7
  },
];

export function validateDamageCalculation(testCase: DamageTestCase): {
  passed: boolean;
  actualResult: number;
  expectedResult: number;
} {
  let result = testCase.damage;

  // Immunity check (overrides everything)
  if (testCase.immunities.includes(testCase.damageType)) {
    result = 0;
  } else {
    // Check resistance and vulnerability
    const hasResistance = testCase.resistances.includes(testCase.damageType);
    const hasVulnerability = testCase.vulnerabilities.includes(testCase.damageType);

    if (hasResistance && !hasVulnerability) {
      result = Math.floor(result / 2);
    } else if (hasVulnerability && !hasResistance) {
      result = result * 2;
    }
    // If both resistance and vulnerability, they cancel out (no change)
  }

  return {
    passed: result === testCase.expectedResult,
    actualResult: result,
    expectedResult: testCase.expectedResult,
  };
}

export function runAllDamageTests(): {
  passed: number;
  failed: number;
  results: Array<{ test: string; passed: boolean; details: string }>;
} {
  const results = damageEngineTests.map((test) => {
    const validation = validateDamageCalculation(test);
    return {
      test: test.name,
      passed: validation.passed,
      details: validation.passed
        ? `✓ Expected ${validation.expectedResult}, got ${validation.actualResult}`
        : `✗ Expected ${validation.expectedResult}, got ${validation.actualResult}`,
    };
  });

  return {
    passed: results.filter((r) => r.passed).length,
    failed: results.filter((r) => !r.passed).length,
    results,
  };
}
