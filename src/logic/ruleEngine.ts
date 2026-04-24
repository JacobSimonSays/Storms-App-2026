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

  const activeWildcards = Object.keys(ARCHETYPE_RULES.wildcards)
    .filter(id => {
      const isSelected = Number(selectedMap[id]) > 0;
      const mapping = classInfo?.tierMapping.find((m: any) => m.powerId === id);
      return isSelected || (mapping && mapping.level <= userLevel);
    })
    .map(id => ({ ...ARCHETYPE_RULES.wildcards[id], id }));

  // 2. PREPARE MODIFIED POWER LIST (Apply Archetype Overrides & Identify Bonuses)

  const availablePowers = ALL_POWERS.filter(p => {
    if (p.inactive) return false;

    // A: Native Class Powers (Checks your mapping/level)
    const mapping = classInfo?.tierMapping.find((m: any) => m.powerId === p.id);
    const isNative = mapping && mapping.level <= userLevel;
    if (isNative) return true;

    // B: THE FIX: Is it a bonus power granted by an active wildcard?
    // We check if the current power's ID exists in any active wildcard's bonusPowers array.
    const isBonusGrant = activeWildcards.some(w => w.bonusPowers?.includes(p.id));
    if (isBonusGrant) return true;

    // C: Is it a user-selected choice?
    const isUserChoice = Object.values(selectedMap).includes(p.id);
    if (isUserChoice) return true;

    return false;
  }).map(p => {
    // ... keep your existing .map logic that applies overrides and sets isReference ...
    const override = archRule?.overrides?.find((o: any) => o.id === p.id);
    const isBonus = activeWildcards.some(w => w.bonusPowers?.includes(p.id));
    const chosenPowerId = selectedMap[`${p.id}_choice`] || null;

    return {
      ...p,
      cost: override?.cost ?? p.cost ?? 0,
      freq_multiplier: override?.freq_multiplier ?? p.freq_multiplier ?? 1,
      arch_restrict: override?.enabled === false ? true : (p.arch_restrict ?? false),
      isReference: p.isReference || isBonus,
      wildcardChoice: chosenPowerId
    };
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

  // 4. THE WATERFALL (Cost > 0 Only)
  const powersToPlace = availablePowers
    .filter(p => {
      const qty = Number(selectedMap[p.id] || 0);
      return qty > 0 && p.cost > 0;
    })
    .flatMap(p => {
      const qty = Number(selectedMap[p.id] || 0);
      const mapping = classInfo?.tierMapping.find((m: any) => m.powerId === p.id);
      const pLvl = mapping ? mapping.level : (getGlobalPowerLevel(p.id) || 1);
      
      // Create an array entry for EVERY purchase of this power
      return Array(qty).fill(null).map(() => ({ 
        ...p, 
        powerLevel: pLvl 
      }));
    })
    .sort((a, b) => b.powerLevel - a.powerLevel);

  powersToPlace.forEach(p => {
    if (isMartial) return;
    
    let remaining = p.cost;
    // Walk through buckets from the power's minimum level up to current level
    for (let l = p.powerLevel; l <= userLevel; l++) {
      if (!buckets[l]) continue;
      
      buckets[l].slots.forEach(slot => {
        if (!slot.isFilled && remaining > 0) {
          slot.isFilled = true;
          slot.id = p.id;
          slot.cost = 1; // Each slot represents 1 cost unit
          remaining--;
        }
      });
      
      if (remaining === 0) break;
    }
    
    if (remaining > 0) {
      errors.push(`Insufficient slots for ${p.name}`);
    }
  });

  // 5. GENERATE THE MANIFEST
  const powersManifest: Record<string, ManifestEntry> = {};

  availablePowers.forEach(p => {
    const freq = parseFrequency(p.frequency, p.freq_multiplier);
    const currentQty = Number(selectedMap[p.id] || 0);
    const mapping = classInfo.tierMapping.find((m: any) => m.powerId === p.id);
    const minLvl = mapping ? mapping.level : getGlobalPowerLevel(p.id);

    const totalAvailableSlots = Object.values(buckets)
      .filter(b => b.level >= minLvl)
      .reduce((acc, b) => acc + b.slots.filter(s => !s.isFilled).length, 0);

    // Visibility: Cost 0 powers are 'auto', Cost > 0 are 'purchasable'
    // Reference powers (passengers) are always 'auto' but selectionType 'none'
    const isAuto = p.cost === 0 || p.isReference;

    powersManifest[p.id] = {
      id: p.id,
      displayMode: isAuto ? 'auto' : 'purchasable',
      selectionType: p.isReference ? 'none' : (p.name === "Martial Feat" ? 'dropdown' : (p.cost === 2 ? 'toggle' : 'counter')),
      currentQuantity: currentQty,
      canIncrease: !isAuto && totalAvailableSlots >= p.cost && !p.arch_restrict,
      tracking: {
        isTracked: freq.isTracked,
        totalCharges: freq.total,
        resetType: freq.reset as any
      }
    };
  });

  const sortedBuckets = Object.values(buckets).reverse();

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