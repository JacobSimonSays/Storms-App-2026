// src/logic/testLogic.ts
import { calculateCosts } from './ruleEngine';

const testBard = {
  className: "Bard",
  level: 3,
  selectedPowerIds: ["s_aegis", "a_adrenaline"] // Aegis(2) + Adrenaline(1) = 3
};

// Updated to match: (className, userLevel, selectedIds)
const results = calculateCosts(
  testBard.className, 
  testBard.level, 
  testBard.selectedPowerIds
);

console.log("--- STORMS LOGIC TEST ---");
console.log(`Class: ${testBard.className} (Level ${testBard.level})`);
console.log(`Max Points: ${results.totalPoints}`);
console.log(`Points Spent: ${results.spentPoints}`);
console.log(`Points Remaining: ${results.remainingPoints}`);

if (results.remainingPoints === 6) {
    console.log("✅ MATH IS CORRECT");
} else {
    console.log("❌ MATH FAILED (Check if Archetype costs are set to 2)");
}

if (results.errors.length > 0) {
    console.log("Validation Errors:", results.errors);
}