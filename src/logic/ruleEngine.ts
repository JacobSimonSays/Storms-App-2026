import { ALL_POWERS, type Power } from '../data/allPowers.ts';
import { CLASS_DATA } from '../data/classData.ts';
import { ARCHETYPE_RULES } from '../logic/archetype_rules.ts';

// --- INTERFACES ---

export interface Slot {
  isFilled: boolean;
  id: string | null;
  cost: number;
}

export interface SlotBucket {
  level: number;
  slots: Slot[];
}

export interface ManifestEntry {
  id: string;
  displayMode: 'auto' | 'purchasable' | 'archetype' | 'wildcard';
  selectionType: 'none' | 'counter' | 'toggle' | 'dropdown';
  canIncrease: boolean; 
  currentQuantity: number;
  tracking: {
    isTracked: boolean;
    totalCharges: number;
    resetType: 'life' | 'skirmish' | 'none';
  };
}

export interface CharacterManifest {
  className: string;
  level: number;
  isMartial: boolean;
  powers: Record<string, ManifestEntry>;
  resourceBuckets: SlotBucket[];
  isValid: boolean; 
  errors: string[];
}

// --- HELPERS ---

const parseFrequency = (freq: string | undefined, multiplier: number = 1) => {
  if (!freq) return { isTracked: false, total: 0, reset: 'none' };
  const lower = freq.toLowerCase();
  const match = lower.match(/(\d+)\/(life|skirmish)/);
  if (match) {
    return { 
      isTracked: true, 
      total: Math.floor(parseInt(match[1]) * multiplier), 
      reset: match[2] 
    };
  }
  return { isTracked: false, total: 0, reset: 'none' };
};

export const getGlobalPowerLevel = (id: string): number => {
  let lowestLevel = 99;
  Object.values(CLASS_DATA.classes).forEach((cls: any) => {
    const mapping = cls.tierMapping.find((m: any) => m.powerId === id || m.powerId === id.split('_').slice(1).join('_'));
    if (mapping && mapping.level > 0 && mapping.level < lowestLevel) {
      lowestLevel = mapping.level;
    }
  });
  return lowestLevel;
};

export const getAvailablePowers = (className: string, userLevel: number): Power[] => {
  const classInfo = (CLASS_DATA.classes as any)[className];
  if (!classInfo) return [];
  
  return ALL_POWERS.filter((p: Power) => {
    if (p.inactive) return false;
    
    const mapping = classInfo.tierMapping.find((m: any) => m.powerId === p.id);
    
    if (mapping && mapping.level > 0 && mapping.level <= userLevel) return true;

    if (p.className === className && p.origin === 'T' && p.tier === 0) return true;

    return false;
  });
};

export const calculateCosts = (
  className: string, 
  userLevel: number, 
  selectedMap: Record<string, number | string>
): CharacterManifest => {
  const classInfo = (CLASS_DATA.classes as any)[className];
  const isMartial = classInfo?.ruleSet === 'martial';
  const errors: string[] = [];

  // 1. IDENTIFY ACTIVE RULES
  const activeArchId = Object.keys(selectedMap).find(id => ARCHETYPE_RULES.archetypes[id] && Number(selectedMap[id]) > 0);
  const archRule = activeArchId ? ARCHETYPE_RULES.archetypes[activeArchId] : null;

  const activeWildcards = Object.keys(selectedMap)
    .filter(id => ARCHETYPE_RULES.wildcards[id] && Number(selectedMap[id]) > 0)
    .map(id => ARCHETYPE_RULES.wildcards[id]);

  // 2. PREPARE MODIFIED POWER LIST (The "Patch" Step)
  const availablePowers = ALL_POWERS.filter(p => {
    if (p.inactive) return false;
    
    // Native Class Powers
    const mapping = classInfo?.tierMapping.find((m: any) => m.powerId === p.id);
  if (mapping && mapping.level <= userLevel) return true;

    // Wildcard Grants (Jack of All Trades, etc)
    const isWildcardMatch = activeWildcards.some(w => 
      w.allowedClasses.includes(p.className) && 
      w.allowedOrigins.includes(p.origin) && 
      w.allowedTiers.includes(p.tier)
    );
    if (isWildcardMatch) return true;

    // Direct Bonus Powers
    if (activeWildcards.some(w => w.bonusPowers?.includes(p.id))) return true;

    return false;
  }).map(p => {
    const override = archRule?.overrides?.find(o => o.id === p.id);
    if (override) {
      return { 
        ...p, 
        cost: override.cost ?? p.cost, 
        freq_multiplier: override.freq_multiplier ?? p.freq_multiplier,
        arch_restrict: override.enabled === false ? true : p.arch_restrict
      };
    }
    return p;
  });

  // 3. INITIALIZE BUCKETS
  const buckets: Record<number, SlotBucket> = {};
  if (!isMartial) {
    for (let l = 1; l <= userLevel; l++) {
      buckets[l] = { 
        level: l, 
        slots: Array(3).fill(null).map(() => ({ isFilled: false, id: null, cost: 0 })) 
      };
    }
  }

  // 4. THE WATERFALL
  const selectedIds = Object.entries(selectedMap)
    .filter(([id]) => !id.endsWith('_choice')) 
    .flatMap(([id, qty]) => Array(Number(qty)).fill(id));

  const powersToPlace = selectedIds
    .map(id => {
      const power = availablePowers.find(a => a.id === id);
      const mapping = classInfo?.tierMapping.find((m: any) => m.powerId === power?.originalId);
      const pLvl = mapping ? mapping.level : getGlobalPowerLevel(id);
      return { ...power, powerLevel: pLvl, isArchetype: power?.type === 'Archetype' };
    })
    .filter(p => p && p.id && (p.isArchetype || p.origin !== "T") && (p.powerLevel ?? 0) > 0)
    .sort((a, b) => {
      if (a.isArchetype !== b.isArchetype) return a.isArchetype ? -1 : 1;
      return (b.powerLevel ?? 0) - (a.powerLevel ?? 0);
    });

  powersToPlace.forEach(p => {
    if (isMartial) return; 
    const cost = (p.cost ?? (p.isArchetype ? 2 : 1)) as number;
    const minLvl = p.powerLevel || 1;
    
    let remainingCostToAssign = cost;

    for (let l = minLvl; l <= userLevel; l++) {
      if (!buckets[l]) continue;
      
      buckets[l].slots.forEach(slot => {
        if (!slot.isFilled && remainingCostToAssign > 0) {
          slot.isFilled = true;
          slot.id = p.id ?? null;
          slot.cost = 1; 
          remainingCostToAssign--;
        }
      });
      
      if (remainingCostToAssign === 0) break;
    }

    if (remainingCostToAssign > 0) {
      errors.push(`Insufficient slots for ${p.name}`);
    }
  });

  // 5. GENERATE THE MANIFEST
  const powersManifest: Record<string, ManifestEntry> = {};

    availablePowers.forEach(p => {
      const freq = parseFrequency(p.frequency, p.freq_multiplier);
      const isArchetype = p.type === 'Archetype';
      const isTrait = p.origin === 'T';
      const currentQty = Number(selectedMap[p.id] || 0);

      // 1. Setup Cost and Level Requirements
      const cost = p.cost ?? (isArchetype ? 2 : 1);
      
      // CHANGE: Use p.id here because CLASS_DATA is now namespaced by your Python script
      const mapping = classInfo.tierMapping.find((m: any) => m.powerId === p.id);
      const minLvl = mapping ? mapping.level : getGlobalPowerLevel(p.id);

      // 2. Calculate Aggregate Availability
      const totalAvailableSlots = Object.values(buckets)
        .filter(b => b.level >= minLvl)
        .reduce((acc, b) => acc + b.slots.filter(s => !s.isFilled).length, 0);

      // 3. Determine Selection Type
      let selectionType: 'none' | 'counter' | 'toggle' | 'dropdown' = 'none';
      if (p.name === "Martial Feat") selectionType = 'dropdown';
      else if (isArchetype) selectionType = 'toggle';
      else if (!isMartial && !isTrait) selectionType = 'counter';

      // 4. Calculate canIncrease
      let canIncrease = false;

      if (isMartial) {
        if (isArchetype) {
          const hasOtherArch = Object.keys(selectedMap).some(id => 
            id !== p.id && 
            ALL_POWERS.find(ap => ap.id === id)?.type === 'Archetype' &&
            Number(selectedMap[id]) > 0
          );
          canIncrease = !hasOtherArch && currentQty === 0;
        } else {
          canIncrease = true; 
        }
      } else {
        // THE FIX: Use the aggregate count instead of the old 'for' loop
        // This allows the UI to stay active for split-cost powers
        canIncrease = totalAvailableSlots >= cost;
      }

      powersManifest[p.id] = {
        id: p.id,
        displayMode: isTrait || (isMartial && !isArchetype) ? 'auto' : 'purchasable',
        selectionType,
        currentQuantity: currentQty,
        canIncrease: canIncrease && !p.arch_restrict, 
        tracking: {
          isTracked: freq.isTracked,
          totalCharges: freq.total,
          resetType: freq.reset as any
        }
      };
    });
  const sortedBuckets = [];
  for (let i = userLevel; i >= 1; i--) {
    if (buckets[i]) sortedBuckets.push(buckets[i]);
  }

  return {
    className,
    level: userLevel,
    isMartial,
    powers: powersManifest,
    resourceBuckets: sortedBuckets,
    isValid: errors.length === 0,
    errors
  };
};