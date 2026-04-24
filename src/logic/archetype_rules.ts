export interface PowerOverride {
  id: string; // Using class-prefixed ID (e.g., cleric_s_heal)
  cost?: number;
  freq_multiplier?: number;
  purchase_limit?: number;
  charge?: boolean;
  enabled?: boolean; // Set to false to restrict/hide the power
  note?: string;
}

export interface ArchetypeDefinition {
  targetClass: string;
  overrides?: PowerOverride[];
}

export interface WildcardDefinition {
  allowedOrigins: ('S' | 'A' | 'T')[];
  allowedTiers: number[];
  allowedClasses: string[];
  bonusPowers?: string[]; // Use the full prefixed IDs here too
}

export interface RuleSchema {
  archetypes: Record<string, ArchetypeDefinition>;
  wildcards: Record<string, WildcardDefinition>;
}

export const ARCHETYPE_RULES: RuleSchema = {
  archetypes: {
    "bard_t_muse": {
      targetClass: "Bard",
      overrides: [
        { id: "bard_s_confidence", freq_multiplier: 2 },
        { id: "bard_s_inspiration", freq_multiplier: 2 },
        { id: "bard_s_heroism", freq_multiplier: 2 },
        { id: "bard_s_terror", enabled: false },
        { id: "bard_s_song_of_glamour", cost: 2 },
        { id: "bard_s_fear", cost: 2 },
        { id: "bard_s_rally", cost: 2 },
        { id: "bard_s_hurled_insult", cost: 2 },
        { id: "bard_s_charm_person", cost: 2 }
      ]
    },
    "bard_t_legend": {
      targetClass: "Bard",
      overrides: [
        { id: "bard_s_terror", freq_multiplier: 2 },
        { id: "bard_s_song_of_glamour", freq_multiplier: 2 },
        { id: "bard_s_fear", freq_multiplier: 2 },
        { id: "bard_s_rally", freq_multiplier: 2 },
        { id: "bard_s_hurled_insult", freq_multiplier: 2 },
        { id: "bard_s_charm_person", freq_multiplier: 2 },
        { id: "bard_s_mend", cost: 2 },
        { id: "bard_s_release", cost: 2 },
        { id: "bard_s_confidence", cost: 2 },
        { id: "bard_s_inspiration", cost: 2 },
        { id: "bard_s_heroism", cost: 2 },
        { id: "bard_s_song_of_prowess", cost: 2 },
      ]
    },
    "cleric_t_necromancer": {
      targetClass: "Cleric",
      overrides: [
        { id: "cleric_s_heal", cost: 2 },
        { id: "cleric_s_greater_heal", cost: 2 },
        { id: "cleric_s_resurrect", cost: 2 },
        { id: "cleric_s_mass_healing", cost: 2},
        { id: "cleric_s_steal_life", freq_multiplier: 2},
        { id: "cleric_s_create_zombie", freq_multiplier: 2},
        { id: "cleric_s_inflict_wound", freq_multiplier: 2},
        { id: "cleric_s_create_vampire", freq_multiplier: 2},
        { id: "cleric_s_create_lich", freq_multiplier: 2}
      ]
    },
    "cleric_t_priest": {
      targetClass: "Cleric",
      overrides: [
        { id: "cleric_s_heal", cost: 0 },
        { id: "cleric_s_greater_heal", freq_multiplier: 2 },
        { id: "cleric_s_resurrect", freq_multiplier: 2 },
        { id: "cleric_s_mass_healing", freq_multiplier: 2},
        { id: "cleric_s_steal_life", cost: 2},
        { id: "cleric_s_create_zombie", cost: 2},
        { id: "cleric_s_inflict_wound", cost: 2},
        { id: "cleric_s_create_vampire", cost: 2},
        { id: "cleric_s_create_lich", cost: 2}
      ]
    },
    "druid_t_avatar": {
      targetClass: "Druid",
      overrides: [
        { id: "druid_s_eagle_eye", cost: 2 },
        { id: "druid_s_serpent_fangs", cost: 2 },
        { id: "druid_s_bear_strength", cost: 2 },
        { id: "druid_s_corrosion", enabled: false },
        { id: "druid_s_turtle_shell", cost: 2 },
        { id: "druid_s_wolf_pack", cost: 2 },
      ]
    },
    "druid_t_wild_heart": {
      targetClass: "Druid",
      overrides: [
        { id: "druid_s_eagle_eye", freq_multiplier: 2, charge: true },
        { id: "druid_s_serpent_fangs", freq_multiplier: 2, charge: true },
        { id: "druid_s_bear_strength", freq_multiplier: 2, charge: true },
        { id: "druid_s_turtle_shell", freq_multiplier: 2, charge: true },
        { id: "druid_s_wolf_pack", freq_multiplier: 2, charge: true },
        { id: "druid_s_attunement_to_earth", cost: 2 },
        { id: "druid_s_attunement_to_fire", cost: 2 },
        { id: "druid_s_attunement_to_water", cost: 2 },
        { id: "druid_s_attunement_to_air", cost: 2 },
      ]
    },
    "wizard_t_evoker": {
      targetClass: "Wizard",
      overrides: [
        { id: "wizard_s_heat_weapon", cost: 2 },
        { id: "wizard_s_shove", cost: 2 },
        { id: "wizard_s_stasis", cost: 2 },
        { id: "wizard_s_counterspell", cost: 2 },
        { id: "wizard_s_dispel_magic", cost: 2 },
        { id: "wizard_s_exile", cost: 2 },
        { id: "wizard_s_beguile", cost: 2 },
        { id: "wizard_s_hold_person", cost: 2 },
        { id: "wizard_s_dragged_below", cost: 2 },
        { id: "wizard_s_self_destruct", cost: 2 }
      ]
    },
    "wizard_t_battlemage": {
      targetClass: "Wizard",
      overrides: [
        { id: "wizard_s_force_bolt", cost: 2 },
        { id: "wizard_s_ice_ball", cost: 2 },
        { id: "wizard_s_lightning_bolt", cost: 2 },
        { id: "wizard_s_fireball", enabled: false }
      ]
    }
  },
  wildcards: {
    "bard_t_jack_of_all_trades": {
      allowedOrigins: ["S"],
      allowedTiers: [1],
      allowedClasses: ["Wizard", "Druid", "Cleric"],
      bonusPowers: ["bard_t_light_armor"]
    },
    "wizard_s_grimoire": {
      allowedOrigins: ["S"],
      allowedTiers: [1, 2, 3, 4],
      allowedClasses: ["Bard", "Druid", "Cleric"]
    },
    "bard_t_master_of_none": {
      allowedOrigins: ["S"],
      allowedTiers: [1, 2],
      allowedClasses: ["Wizard", "Druid", "Cleric"],
      bonusPowers: ["bard_t_martial_feat"]
    }
  }
};