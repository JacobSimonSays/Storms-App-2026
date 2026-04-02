import { ALL_ABILITIES, type Ability } from '../data/allAbilities.ts';
import { CLASS_DATA } from '../data/classData.ts';


// --- INTERFACES ---

export interface Slot {
  isFilled: boolean;
  powerId: string | null;
  cost: number;
}

export interface SlotBucket {
  level: number;
  slots: Slot[];
}

export interface ManifestEntry {
  powerId: string;
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
  abilities: Record<string, ManifestEntry>;
  resourceBuckets: SlotBucket[];
  isValid: boolean; 
  errors: string[];
}

export const getAutoTraits = (className: string, userLevel: number): string[] => {
  const classInfo = (CLASS_DATA.classes as any)[className];
  if (!classInfo) return [];
  const isMartial = classInfo.ruleSet === 'martial';

  return classInfo.tierMapping
    .filter((m: any) => {
      // Level 0 is always auto
      if (m.level === 0 || m.level === '0') return true;
      // Martials get everything below level 5 automatically
      if (isMartial && m.level <= userLevel && m.level < 5) return true;
      return false;
    })
    .map((m: any) => m.powerId);
};

const parseFrequency = (freq: string | undefined) => {
  if (!freq) return { isTracked: false, total: 0, reset: 'none' };
  const lower = freq.toLowerCase();
  const match = lower.match(/(\d+)\/(life|skirmish)/);
  if (match) {
    return { isTracked: true, total: parseInt(match[1]), reset: match[2] };
  }
  return { isTracked: false, total: 0, reset: 'none' };
};

export const getGlobalPowerLevel = (powerId: string): number => {
  let lowestLevel = 99;
  Object.values(CLASS_DATA.classes).forEach((cls: any) => {
    const mapping = cls.tierMapping.find((m: any) => m.powerId === powerId);
    if (mapping && mapping.level > 0 && mapping.level < lowestLevel) {
      lowestLevel = mapping.level;
    }
  });
  return lowestLevel;
};

export const getAvailableAbilities = (className: string, userLevel: number): Ability[] => {
  const classInfo = (CLASS_DATA.classes as any)[className];
  if (!classInfo) return [];
  return ALL_ABILITIES.filter(ability => {
    if (ability.inactive) return false;
    const mapping = classInfo.tierMapping.find((m: any) => m.powerId === ability.powerId);
    const nativeLevel = mapping ? mapping.level : 99;
    return nativeLevel <= userLevel;
  });
};

// --- CORE ENGINE ---

export const calculateCosts = (
  className: string, 
  userLevel: number, 
  selectedMap: Record<string, number | string> // <--- Change 'number' to 'number | string'
): CharacterManifest => {
  const classInfo = (CLASS_DATA.classes as any)[className];
  const isMartial = classInfo?.ruleSet === 'martial';
  const errors: string[] = [];

  // 1. Initialize Buckets (Casters only)
  const buckets: Record<number, SlotBucket> = {};
  if (!isMartial) {
    for (let l = 1; l <= userLevel; l++) {
      buckets[l] = { 
        level: l, 
        slots: Array(3).fill(null).map(() => ({ isFilled: false, powerId: null, cost: 0 })) 
      };
    }
  }

  // 2. Prepare powers for the Waterfall
  const selectedIds = Object.entries(selectedMap)
    .filter(([id]) => !id.endsWith('_choice')) // Ignore the string-based choices
    .flatMap(([id, qty]) => Array(Number(qty)).fill(id));
  const powersToPlace = selectedIds
    .map(id => {
      const ability = ALL_ABILITIES.find(a => a.powerId === id);
      const mapping = classInfo?.tierMapping.find((m: any) => m.powerId === id);
      const pLvl = mapping ? mapping.level : getGlobalPowerLevel(id);
      return { ...ability, powerLevel: pLvl, id, isArchetype: ability?.abilityType === 'Archetype' };
    })
    .filter(p => (p.isArchetype || p.power !== "T") && (p.powerLevel ?? 0) > 0)
    .sort((a, b) => {
      if (a.isArchetype !== b.isArchetype) return a.isArchetype ? -1 : 1;
      return (b.powerLevel ?? 0) - (a.powerLevel ?? 0);
    });

  // 3. The Packing Waterfall
  powersToPlace.forEach(power => {
    if (isMartial) return; // Martials don't consume dots
    const cost = power.isArchetype ? 2 : 1;
    const minLvl = power.powerLevel || 1;
    let placed = false;

    for (let l = minLvl; l <= userLevel; l++) {
      if (!buckets[l]) continue;
      const availableSlots = buckets[l].slots.filter(s => !s.isFilled);
      if (availableSlots.length >= cost) {
        let assigned = 0;
        buckets[l].slots.forEach(slot => {
          if (!slot.isFilled && assigned < cost) {
            slot.isFilled = true;
            slot.powerId = power.id;
            slot.cost = 1; // Each slot is 1 dot
            assigned++;
          }
        });
        placed = true;
        break; 
      }
    }
    if (!placed) errors.push(`Insufficient slots for ${power.name}`);
  });

  // 4. Generate the Manifest
  const abilities: Record<string, ManifestEntry> = {};
  const available = getAvailableAbilities(className, userLevel);

  available.forEach(ability => {
    const freq = parseFrequency(ability.frequency);
    const isArchetype = ability.abilityType === 'Archetype';
    const isTrait = ability.power === 'T';
    const currentQty = selectedMap[ability.powerId] || 0;

    // Determine Selection Type
    let selectionType: 'none' | 'counter' | 'toggle' | 'dropdown' = 'none';
    if (ability.name === "Martial Feat") selectionType = 'dropdown';
    else if (isArchetype) selectionType = 'toggle';
    else if (!isMartial && !isTrait) selectionType = 'counter';

    // Calculate canIncrease
    let canIncrease = false;
    if (isMartial) {
      // Martials: Only 1 Archetype allowed
      if (isArchetype) {
        const hasOtherArchetype = Object.keys(selectedMap).some(id => 
          id !== ability.powerId && 
          ALL_ABILITIES.find(a => a.powerId === id)?.abilityType === 'Archetype' &&
          Number(selectedMap[id]) > 0 // <--- Use Number() here
        );
        canIncrease = !hasOtherArchetype && currentQty === 0;
      } else {
        canIncrease = true; // Everything else is "auto" or free
      }
    } else {
      // Casters: Check bucket space
      const cost = isArchetype ? 2 : 1;
      canIncrease = false;
      const mapping = classInfo?.tierMapping.find((m: any) => m.powerId === ability.powerId);
      const minLvl = mapping ? mapping.level : getGlobalPowerLevel(ability.powerId);
      
      for (let l = minLvl; l <= userLevel; l++) {
        // THE FIX: Check if the bucket exists BEFORE trying to read .slots
        if (buckets[l] && buckets[l].slots.filter(s => !s.isFilled).length >= cost) {
          canIncrease = true;
          break;
        }
      }
    }

    abilities[ability.powerId] = {
      powerId: ability.powerId,
      displayMode: isTrait || (isMartial && !isArchetype) ? 'auto' : 'purchasable',
        selectionType,
        currentQuantity: Number(currentQty), // <--- Force it to be a number here
        canIncrease,
        tracking: {
        isTracked: freq.isTracked,
        totalCharges: freq.total,
        resetType: freq.reset as any
      }
    };
  });

  return {
    className,
    level: userLevel,
    isMartial,
    abilities,
    resourceBuckets: Object.values(buckets).reverse(),
    isValid: errors.length === 0,
    errors
  };
};