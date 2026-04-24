import React, { useState, useMemo } from 'react';
import { ALL_POWERS, type Power } from '../data/allPowers.ts';
import { CLASS_DATA } from '../data/classData.ts';
import { CLASS_THEMES } from '../theme/classThemes.ts';
import { getAvailablePowers, calculateCosts, getGlobalPowerLevel } from '../logic/ruleEngine.ts';
import { ARCHETYPE_RULES } from '../logic/archetype_rules.ts';

interface BuilderProps {
  initialClass: string;
  initialLevel: number;
  existingMap?: Record<string, any>; // The saved power choices
  onSave: (map: Record<string, any>) => void;
  onCancel: () => void;
}

const Builder = ({ initialClass, initialLevel, existingMap, onSave, onCancel }: BuilderProps) => {
  const [selectedMap, setSelectedMap] = useState<Record<string, number | string>>(existingMap || {});
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [characterName, setCharacterName] = useState("New Hero");
  const [activeWildcardId, setActiveWildcardId] = useState<string | null>(null);

  const theme = CLASS_THEMES[initialClass] || CLASS_THEMES.Barbarian;

  // 1. DATA FETCHING & MANIFEST CALL
  const available = useMemo(() => getAvailablePowers(initialClass, initialLevel), [initialClass, initialLevel]);
  
  // Cast selectedMap to Record<string, number> for the engine, it will ignore string choice keys
  const stats = calculateCosts(initialClass, initialLevel, selectedMap as Record<string, number>);

  // 2. EVENT HANDLERS
  const toggleExpanded = (id: string) => {
    const next = new Set(expandedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedIds(next);
  };

  const openWildcardModal = (id: string) => setActiveWildcardId(id);
  const closeWildcardModal = () => setActiveWildcardId(null);

  const getWildcardOptions = (wildcardId: string) => {
    const rule = ARCHETYPE_RULES.wildcards[wildcardId];
    if (!rule) return [];

    return ALL_POWERS.filter(p => {
      if (p.inactive) return false;
      // THE FIX: If it's a bonus power, ignore class/origin/tier gates
      const isExplicitBonus = rule.bonusPowers?.includes(p.id);
      const matchesCriteria = rule.allowedClasses.includes(p.className) &&
                              rule.allowedOrigins.includes(p.origin) &&
                              rule.allowedTiers.includes(p.tier);
      return isExplicitBonus || matchesCriteria;
    }).sort((a, b) => a.name.localeCompare(b.name));
  };

  const selectWildcardChoice = (wildcardId: string, choiceId: string) => {
    setSelectedMap(prev => ({
      ...prev,
      [`${wildcardId}_choice`]: choiceId
    }));
    closeWildcardModal();
  };

  const updateQuantity = (id: string, delta: number) => {
    const entry = stats.powers[id];
    if (!entry) return;

    setSelectedMap(prev => {
      const current = Number(prev[id]) || 0;

      if (entry.selectionType === 'toggle') {
        const isTurningOn = current === 0;
        if (!isTurningOn) return { ...prev, [id]: 0 };
        if (!entry.canIncrease) return prev; 

        // If turning on an Archetype, turn off all other Archetypes
        const cleaned = { ...prev };
        Object.keys(stats.powers).forEach(key => {
          if (stats.powers[key].selectionType === 'toggle') cleaned[key] = 0;
        });

        return { ...cleaned, [id]: 1 };
      }

      // Counter logic
      if (delta > 0 && !entry.canIncrease) return prev;
      return { ...prev, [id]: Math.max(0, current + delta) };
    });
  };

  const saveArsenal = () => {
    const arsenalData = {
      name: characterName,
      className: initialClass,
      level: initialLevel,
      selectedMap: selectedMap, 
      manifest: stats,          
      timestamp: new Date().toISOString()
    };

    const existingChars = JSON.parse(localStorage.getItem('storms_all_characters') || '[]');
    const updatedChars = [arsenalData, ...existingChars.filter((c: any) => c.name !== characterName)];
    localStorage.setItem('storms_all_characters', JSON.stringify(updatedChars.slice(0, 5)));
    localStorage.setItem('storms_active_character', JSON.stringify(arsenalData));

    alert(`${characterName}'s Arsenal has been saved!`);
  };

  const groupedAbilities = useMemo(() => {
    const classInfo = (CLASS_DATA.classes as any)[initialClass];
    const mapping = classInfo?.tierMapping || [];
    
    return available.reduce((acc, power: Power) => {
      // FIX: Use powerId to match your CLASS_DATA schema
      const tierEntry = mapping.find((m: any) => m.powerId === power.id);
      const lvl = tierEntry ? tierEntry.level : power.tier;

      // Filter out level 0 (innate traits) if you only want purchasable powers
      if (lvl === 0 || lvl === '0') return acc;

      if (!acc[lvl]) acc[lvl] = [];
      acc[lvl].push(power);
      return acc;
    }, {} as Record<string, Power[]>);
  }, [available, initialClass]);

  // 3. VISUAL HELPERS
  const renderResourceDots = () => {
    return stats.resourceBuckets.slice().reverse().map((bucket, index) => (
      <React.Fragment key={`bucket-${bucket.level}`}>
        <div style={{ display: 'flex', alignItems: 'center', margin: '0 4px' }}>
          {bucket.slots.map((slot, i) => (
            <div key={i} style={{
              width: '12px', height: '12px', borderRadius: '50%',
              backgroundColor: slot.isFilled ? 'rgba(0,0,0,0.5)' : theme.text,
              border: `1px solid ${slot.isFilled ? 'transparent' : 'rgba(0,0,0,0.2)'}`,
              margin: '0 2px'
            }} />
          ))}
        </div>
        {index < stats.resourceBuckets.length - 1 && (
          <span style={{ color: theme.text, opacity: 0.4, fontSize: '1.2rem', margin: '0 4px' }}>|</span>
        )}
      </React.Fragment>
    ));
  };

  const renderPowerBlock = (id: string, isReference = false) => {
    const power = ALL_POWERS.find(a => a.id === id);
    if (!power) return null;

    // 1. MAIN POWER: Clean, Open, No Box, No Indent
    if (!isReference) {
      return (
        <div key={id} style={{ marginBottom: '20px' }}>
          {/* Frequency & Charge - Big and readable */}
          <div style={{ fontStyle: 'italic', fontSize: '1.5rem', marginBottom: '4px', color: '#000' }}>
            {power.frequency}{power.charge ? `; charge` : ''}
          </div>

          {/* Metadata Bar */}
          <div style={{ 
            color: '#000', 
            fontSize: '1.05rem', 
            borderBottom: '1px solid #ccc', 
            paddingBottom: '6px', 
            marginBottom: '10px' 
          }}>
            {[power.school, power.type, power.origin, power.range, power.material].filter(Boolean).join(' | ')}
          </div>

          {/* Incantation with Line Breaks */}
          {power.incantation && (
            <div style={{ fontStyle: 'italic', marginBottom: '8px', color: '#000', fontSize: '1.05rem', whiteSpace: 'pre-line' }}>
              {power.incantation} {power.incantation_multiplier > 1 ? ` x${power.incantation_multiplier}` : ''}
            </div>
          )}

          {/* Main Effect Body */}
          <div style={{ fontSize: '1.15rem', lineHeight: '1.6', whiteSpace: 'pre-line', color: '#000' }}>
            {formatText(power.effect)}
          </div>

          {/* Notes & Restrictions */}
          {power.note && (
            <div style={{ fontSize: '1.15rem', marginTop: '12px', whiteSpace: 'pre-line' }}>
              <strong>note:</strong> {formatText(power.note)}
            </div>
          )}
          {power.limitation && (
            <div style={{ fontSize: '1.15rem', marginTop: '12px', whiteSpace: 'pre-line' }}>
              <strong>restriction:</strong> {formatText(power.limitation)}
            </div>
          )}
        </div>
      );
    }

    // 2. REFERENCE BLOCK: Grey Box, Indented, Bordered
    return (
      <div key={id} style={referenceBlockStyle(theme.dark)}>
        <div style={refHeaderStyle}>{power.name}</div>
        <div style={{ fontStyle: 'italic', marginBottom: '4px', fontSize: '0.9rem' }}>
          {power.frequency}{power.charge ? `; charge` : ''}
        </div>
        <div style={metadataStyle}>
          {[power.school, power.origin, power.origin, power.range, power.material].filter(Boolean).join(' | ')}
        </div>
        <div style={{ fontSize: '0.95rem', whiteSpace: 'pre-line', color: '#000' }}>
          {formatText(power.effect)}
        </div>
      </div>
    );
  };

  const renderReferenceBlock = (refId: string) => {
    const refPower = ALL_POWERS.find(a => a.id === refId);
    if (!refPower) return null;
    return (
      <div key={refId} style={referenceBlockStyle(theme.dark)}>
        <div style={refHeaderStyle}>{refPower.name}</div>
        <div style={{ fontStyle: 'italic', marginBottom: '4px' }}>{refPower.frequency}{refPower.charge ? `; Charge` : ''}</div>
        <div style={metadataStyle}>
          {[refPower.school, refPower.type, refPower.origin, refPower.range, refPower.material].filter(Boolean).join(' | ')}
        </div>
        <div style={{ fontSize: '0.95rem', whiteSpace: 'pre-line' }}>{formatText(refPower.effect)}</div>
      </div>
    );
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* 1. CLEANER HEADER: Only Meta Info */}
      <header style={headerContainerStyle(theme.dark, theme.text)}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          width: '100%', 
          maxWidth: '800px', 
          alignItems: 'center' 
        }}>
          <div style={{ fontSize: '2.0rem', fontFamily: "'HeaderFont', serif" }}>
            {initialClass} <span style={{ opacity: 0.6 }}>Level {initialLevel}</span>
          </div>
        </div>

        {!stats.isMartial && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
            {renderResourceDots()}
          </div>
        )}
      </header>

      <main style={{ paddingTop: '160px' }}> 
        {Object.keys(groupedAbilities).sort().map(lvl => (
          <div key={lvl}>
            <h3 style={sectionHeader}>{`Level ${lvl}`}</h3>
            {groupedAbilities[lvl].map((power: Power) => {
              const entry = stats.powers[power.id];
              const isExpanded = expandedIds.has(power.id);
              const wildcardChoice = selectedMap[`${power.id}_choice`];
              if (!entry) return null;

              return (
                <div key={power.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                  <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* 1. WILDCARD SELECTOR: Show if it's a wildcard rule OR if it's a Martial Feat */}
                    {(ARCHETYPE_RULES.wildcards[power.id] || power.name === "Martial Feat") && (
                      <button onClick={() => openWildcardModal(power.id)} style={wildcardBtnStyle}>
                        {wildcardChoice ? 'Change' : 'Select'}
                      </button>
                    )}

                    {/* 2. TOGGLE: Trust the entry */}
                    {entry.selectionType === 'toggle' && (
                      <input 
                        type="checkbox" 
                        checked={entry.currentQuantity > 0} 
                        onChange={() => updateQuantity(power.id, 0)} 
                        style={{ width: '22px', height: '22px' }} 
                      />
                    )}

                    {/* 3. COUNTER: Trust the entry */}
                    {entry.selectionType === 'counter' && (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button onClick={() => updateQuantity(power.id, -1)} style={controlBtnStyle}>-</button>
                        <span style={quantityStyle}>{entry.currentQuantity}</span>
                        <button 
                          onClick={() => updateQuantity(power.id, 1)} 
                          disabled={!entry.canIncrease} 
                          style={controlBtnStyle}
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                  {isExpanded && (
                    <div style={{ marginTop: '15px', padding: '0 10px' }}>
                      
                      {/* 1. THE MAIN POWER (Now calling the helper to ensure Incantations show!) */}
                      {renderPowerBlock(power.id, false)}

                      {/* 2. THE SUB-POWERS (Kept as is) */}
                      {ARCHETYPE_RULES.wildcards[power.id]?.bonusPowers?.map(bpId => (
                        <div key={bpId} style={{ marginTop: '15px' }}>
                          {renderReferenceBlock(bpId)}
                        </div>
                      ))}
                      
                      {power.reference?.map((refId: string) => (
                        <div style={{ marginTop: '15px', paddingBottom: '20px' }} key={refId}>
                          {renderReferenceBlock(refId)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </main>

      <div style={{ 
        marginTop: '60px', 
        padding: '40px 20px', 
        borderTop: `2px solid ${theme.dark}33`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderRadius: '12px 12px 0 0'
      }}>
        <div style={{ textAlign: 'center' }}>
          <input 
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            placeholder="Arsenal Name"
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: '3px solid rgb(2, 38, 88)',
              color: '#000',
              fontFamily: "'HeaderFont', serif",
              fontSize: '2.2rem',
              textAlign: 'center',
              width: '100%',
              maxWidth: '400px',
              outline: 'none'
            }}
          />
        </div>
        <div style={{ 
          display: 'flex', 
          gap: '15px', 
          marginTop: '30px', 
          width: '100%', 
          justifyContent: 'center' 
        }}>
          {/* The Save/Update Button */}
          <button 
            onClick={saveArsenal} 
            style={{
              backgroundColor: 'rgb(2, 38, 88)',
              color: 'white',
              border: 'none',
              padding: '18px 40px', // Slightly narrower to fit two buttons
              fontSize: '1.2rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontFamily: "'HeaderFont', serif",
              boxShadow: '0 6px 15px rgba(0,0,80,0.3)',
              transition: 'transform 0.1s',
              flex: 2 // Gives the primary action more "weight"
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {existingMap ? 'Update Arsenal' : 'Save Arsenal'}
          </button>

          {/* The Cancel Button */}
          <button 
            onClick={onCancel} 
            style={{
              backgroundColor: '#666', // Neutral gray
              color: 'white',
              border: 'none',
              padding: '18px 20px',
              fontSize: '1.1rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'normal',
              fontFamily: "'HeaderFont', serif",
              boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
              transition: 'transform 0.1s',
              flex: 1
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Cancel
          </button>
        </div>
      </div>
      {activeWildcardId && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2>Select your Power</h2>
            <div style={{maxHeight: '60vh', overflowY: 'auto'}}>
              {getWildcardOptions(activeWildcardId).map(opt => {
                const isSelected = selectedMap[`${activeWildcardId}_choice`] === opt.id;

                return (
                  <div 
                    key={opt.id} 
                    onClick={() => selectWildcardChoice(activeWildcardId, opt.id)}
                    style={optionRowStyle(isSelected)} // <--- ADD THE (isSelected) CALL HERE
                  >
                    <strong>{opt.name}</strong> ({opt.frequency})
                  </div>
                );
              })}
            </div>
            <button onClick={closeWildcardModal} style={cancelBtnStyle}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

const headerContainerStyle = (bg: string, text: string): React.CSSProperties => ({
  backgroundColor: bg, color: text, padding: '15px', position: 'fixed', top: '60px', left: 0, right: 0, zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', fontFamily: "'HeaderFont', serif"
});

const nameInputStyle = (color: string): React.CSSProperties => ({
  background: 'transparent', border: 'none', borderBottom: `1px solid ${color}44`, color: color, fontFamily: "'HeaderFont', serif", fontSize: '1.2rem', textAlign: 'center', width: '150px'
});

const saveBtnStyle = { backgroundColor: 'rgb(2, 38, 88)', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' as const, fontSize: '0.8rem' };

const cardStyle = (bg: string): React.CSSProperties => ({ backgroundColor: bg, padding: '16px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' });

const outlinedText: React.CSSProperties = { fontFamily: "'HeaderFont', serif", fontSize: '1.5rem', color: 'white', textShadow: '1px 1px 0px #000, -1px -1px 0px #000, 1px -1px 0px #000, -1px 1px 0px #000', letterSpacing: '1px' };

const controlBtnStyle = { width: '30px', height: '30px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.1)', color: 'inherit', fontWeight: 'bold' };

const quantityStyle = { minWidth: '24px', textAlign: 'center' as const, color: 'white', fontWeight: 'bold', textShadow: '1px 1px 0px #000' };

const wildcardBtnStyle = { backgroundColor: 'rgb(2, 38, 88)', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '3px', fontSize: '0.7rem', cursor: 'pointer' };

const bookStyleBlock = { padding: '15px', fontFamily: "'BodyFont', serif", color: '#000' };

const sectionHeader = { backgroundColor: 'rgba(0,0,0,0.05)', padding: '10px 15px', margin: 0, fontFamily: "'HeaderFont', serif", fontSize: '1.4rem' };

const exitBtnStyle = (color: string) => ({ background: 'none', border: `1px solid ${color}`, color: color, borderRadius: '4px', padding: '4px 10px', fontSize: '0.8rem', cursor: 'pointer' });

const referenceBlockStyle = (color: string) => ({ marginLeft: '15px', marginTop: '15px', padding: '12px', backgroundColor: 'rgba(0,0,0,0.03)', borderLeft: `4px solid ${color}`, borderRadius: '0 4px 4px 0' });

const refHeaderStyle = { fontFamily: "'HeaderFont', serif", color: 'rgb(2, 38, 88)', fontSize: '1.2rem', marginBottom: '4px' };

const metadataStyle = { color: '#4b4b4b', fontSize: '0.85rem', borderBottom: '1px solid #ccc', paddingBottom: '4px', marginBottom: '8px' };

const modalOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };

const modalContentStyle: React.CSSProperties = { backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '90%', maxWidth: '400px', maxHeight: '80vh', overflowY: 'auto' };

const optionRowStyle = (isSelected: boolean): React.CSSProperties => ({
  padding: '15px',
  borderBottom: '1px solid #eee',
  cursor: 'pointer',
  backgroundColor: isSelected ? '#e0e0e0' : 'transparent',
  fontSize: '1.1rem',
  color: '#000'
});

const formatText = (text: string | null | undefined) => {
  if (!text) return null;
  const parts = text.split(/(\*.*?\*)/g);
  return parts.map((part, i) => part.startsWith('*') && part.endsWith('*') ? <i key={i}>{part.slice(1, -1)}</i> : part);
};

const cancelBtnStyle: React.CSSProperties = {
  marginTop: '20px',
  padding: '12px 20px',
  backgroundColor: '#666',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  width: '100%',
  fontSize: '1.1rem',
  fontFamily: "'HeaderFont', serif"
};

export default Builder;