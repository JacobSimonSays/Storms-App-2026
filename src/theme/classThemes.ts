export const COLORS = {
  background: "#D3C89A", // background_tan
  white: "#FFFFFF",
  black: "#000000",
  archetype: {
    green: "#7CBD79",
    purple: "#836696",
  }
};

export const CLASS_THEMES: Record<string, { dark: string; light: string; text: string }> = {
  Barbarian: { dark: "#666666", light: "#949494", text: "#FFFFFF" },
  Bard:      { dark: "#1F9BE9", light: "#52B1EC", text: "#FFFFFF" },
  Cleric:    { dark: "#CA0D00", light: "#D9554B", text: "#FFFFFF" },
  Druid:     { dark: "#26451F", light: "#58824F", text: "#FFFFFF" },
  Fighter:   { dark: "#4229A5", light: "#6252A5", text: "#FFFFFF" },
  Monk:      { dark: "#AF4E0B", light: "#B87647", text: "#FFFFFF" },
  Rogue:     { dark: "#000000", light: "#474747", text: "#FFFFFF" },
  Wizard:    { dark: "#C29731", light: "#E3C47D", text: "#000000" }, // Black text for better yellow contrast
};