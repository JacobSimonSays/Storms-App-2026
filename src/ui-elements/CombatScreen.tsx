import React, { useState, useEffect, useMemo } from 'react';
import { ALL_POWERS, type Power } from '../data/allPowers.ts';
import { CLASS_DATA } from '../data/classData.ts';
import { CLASS_THEMES } from '../theme/classThemes.ts';
import { SavedArsenal } from '../App.tsx';

const CombatScreen = ({ arsenal }: { arsenal: SavedArsenal }) => {
  const theme = CLASS_THEMES[arsenal.className] || CLASS_THEMES.Barbarian;

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [deathTimer, setDeathTimer] = useState<number | null>(null);
  const [stateTimer, setStateTimer] = useState<number | null>(null);
  const [utilityTimer, setUtilityTimer] = useState<number | null>(null);
  const [showRespawnModal, setShowRespawnModal] = useState(false);

  // Initialize charges based on /Life or /Skirmish frequencies
  const [charges, setCharges] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    if (!arsenal.manifest) return initial;

    Object.values(arsenal.manifest.powers).forEach(entry => {
      // Use the tracking object we built in the Rule Engine
      if (entry.tracking.isTracked) {
        initial[entry.id] = entry.tracking.totalCharges;
      }
    });
    return initial;
  });

  // Single Interval for all timers
  useEffect(() => {
    const interval = setInterval(() => {
      setUtilityTimer(t => (t && t > 0 ? t - 1 : null));
      setDeathTimer(t => (t && t > 0 ? t - 1 : null));
      setStateTimer(t => (t && t > 0 ? t - 1 : null));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRespawn = () => {
    const resetCharges = { ...charges };
    
    Object.values(arsenal.manifest.powers).forEach(entry => {
      if (entry.tracking.isTracked && entry.tracking.resetType === 'life') {
        resetCharges[entry.id] = entry.tracking.totalCharges;
      }
    });

    setCharges(resetCharges);
    setUtilityTimer(null);
    setDeathTimer(null);
    setStateTimer(null);
    setShowRespawnModal(false);
  };

  const updateCharge = (id: string, delta: number) => {
    const entry = arsenal.manifest?.powers[id];
    if (!entry) return;

    const maxUses = entry.tracking.totalCharges;
    setCharges(prev => ({
      ...prev,
      [id]: Math.min(maxUses, Math.max(0, (prev[id] || 0) + delta))
    }));
  };

  const ownedPowers = useMemo(() => {
    const manifestPowers = arsenal.manifest?.powers || {};

    return ALL_POWERS.filter(power => {
      const entry = manifestPowers[power.id];
      if (!entry) return false;

      // displayMode 'auto' = Martials; currentQuantity > 0 = Casters/Bought items
      return (entry.displayMode === 'auto' || entry.currentQuantity > 0) && power.tier !== 0;
    });
  }, [arsenal.manifest]);

  const groupedPowers = useMemo(() => {
    const classInfo = (CLASS_DATA.classes as any)[arsenal.className];
    const mapping = classInfo?.tierMapping || [];

    return ownedPowers.reduce((acc, power) => {
      const tier = mapping.find((m: any) => m.powerId === power.id);
      // Use the level from the mapping, or 'traits' for level 0/unmapped items
      const lvl = tier ? tier.level : 'traits'; 
      
      if (!acc[lvl]) acc[lvl] = [];
      acc[lvl].push(power);
      return acc;
    }, {} as Record<string, any[]>);
  }, [ownedPowers, arsenal.className]);

  // 3. Corrected Power Block (Design & Lowercase)
  const renderPowerBlock = (id: string, isReference = false) => {
    const power = ALL_POWERS.find(a => a.id === id);
    if (!power) return null;

    if (!isReference) {
      return (
        <div key={id} style={{ marginBottom: '20px' }}>
          <div style={{ fontStyle: 'italic', fontSize: '1.5rem', marginBottom: '4px', color: '#000' }}>
            {power.frequency}{power.charge ? `; Charge` : ''}
          </div>

          <div style={{ color: '#000', fontSize: '1.05rem', borderBottom: '1px solid #ccc', paddingBottom: '6px', marginBottom: '10px' }}>
            {[power.school, power.type, power.origin, power.range, power.material].filter(Boolean).join(' | ')}
          </div>

          {power.incantation && (
            <div style={{ fontStyle: 'italic', marginBottom: '8px', color: '#000', fontSize: '1.05rem', whiteSpace: 'pre-line' }}>
              {power.incantation} {power.incantation_multiplier > 1 ? ` x${power.incantation_multiplier}` : ''}
            </div>
          )}

          <div style={{ fontSize: '1.15rem', lineHeight: '1.6', whiteSpace: 'pre-line', color: '#000' }}>
            {power.effect}
          </div>

          {power.note && (
            <div style={{ fontSize: '1.15rem', lineHeight: '1.6', marginTop: '12px' }}>
              <strong>note:</strong> {power.note}
            </div>
          )}
          {power.limitation && (
            <div style={{ fontSize: '1.15rem', lineHeight: '1.6', marginTop: '12px' }}>
              <strong>restriction:</strong> {power.limitation}
            </div>
          )}
        </div>
      );
    }

    // Reference block (Boxed style)
      return (
        <div key={id} style={{ 
          backgroundColor: 'rgba(0,0,0,0.05)', 
          border: `1px solid ${theme.dark}44`, 
          padding: '15px', 
          borderRadius: '6px', 
          marginTop: '15px',
          borderLeft: `4px solid ${theme.dark}`
        }}>
          {/* NO textTransform: 'uppercase' here */}
          <div style={{ fontSize: '1.1rem', fontFamily: "'HeaderFont', serif", color: theme.dark, marginBottom: '4px' }}>
            {power.name}
          </div>
          <div style={{ fontStyle: 'italic', marginBottom: '4px', fontSize: '0.9rem' }}>
            {power.frequency}{power.charge ? `; Charge` : ''}
          </div>
          <div style={{ fontSize: '0.95rem', whiteSpace: 'pre-line', color: '#000' }}>
            {power.effect}
          </div>
        </div>
      );
    };

  return (
    <div style={{ 
      width: '100%', 
      minHeight: '100vh', 
      paddingBottom: '40px', 
      backgroundColor: 'transparent' // Let App.tsx background show through
    }}>
      
      <div style={fixedInterfaceBlock}>
        <header style={{ ...headerStyle, backgroundColor: theme.dark, color: theme.text }}>
          <h1 style={headerTitle}>{arsenal.name}</h1>
          <div style={{ opacity: 0.8, fontSize: '0.75rem' }}>
            {arsenal.className} • Level {arsenal.level}
          </div>
        </header>

        <div style={stickyControlsGrid}>
          <button onClick={() => setUtilityTimer(10)} style={gridBtnStyle(!!utilityTimer)}>
            {utilityTimer ? `${utilityTimer}s` : '10s'}
          </button>
          <button onClick={() => setStateTimer(25)} style={gridBtnStyle(!!stateTimer)}>
            {stateTimer ? `${stateTimer}s` : '25s'}
          </button>
          <button onClick={() => setDeathTimer(55)} style={gridBtnStyle(!!deathTimer)}>
            {deathTimer ? `${deathTimer}s` : '55s'}
          </button>
          <button onClick={() => setShowRespawnModal(true)} style={gridBtnStyle(false)}>
            <div style={respawnIconStyle}>↻</div>
          </button>
        </div>
      </div>

      <main style={{ paddingTop: '215px', paddingLeft: '10px', paddingRight: '10px' }}>
        {Object.keys(groupedPowers).sort().map(lvl => (
          <div key={lvl}>
            <h3 style={levelHeaderStyle}>{lvl === 'Class Powers' ? lvl : `Level ${lvl}`}</h3>

            {groupedPowers[lvl].map(power => {
              const isExpanded = expandedIds.has(power.id);
              const currentUses = charges[power.id];
              const wildcardChoice = arsenal.selectedMap[`${power.id}_choice`];

              return (
                <div key={power.id} style={{ marginBottom: '8px' }}>
                  {/* THE CLICKABLE ROW */}
                  <div 
                    onClick={() => {
                      const next = new Set(expandedIds);
                      next.has(power.id) ? next.delete(power.id) : next.add(power.id);
                      setExpandedIds(next);
                    }} 
                    style={{ ...powerRowStyle, backgroundColor: theme.dark }}
                  >
                    <span style={powerNameStyle}>{power.name}</span>

                    <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center' }}>
                      {(() => {
                        const entry = arsenal.manifest?.powers[power.id];
                        const isTracked = entry?.tracking.isTracked;
                        
                        return isTracked && (
                          <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={counterContainerStyle}>
                              <button onClick={() => updateCharge(power.id, -1)} style={bigControlBtn}>−</button>
                              <span style={counterValueStyle}>{charges[power.id] ?? 0}</span>
                              <button onClick={() => updateCharge(power.id, 1)} style={bigControlBtn}>+</button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* THE EXPANDED CONTENT (Synced with Builder) */}
                  {isExpanded && (
                    <div style={expandedCardStyle}>
                      {/* 1. The Main Power (Border-left style) */}
                      {renderPowerBlock(power.id, false)}

                      {/* 2. Any Wildcard selection (Boxed style) */}
                      {wildcardChoice && (
                        <div style={{ marginTop: '10px' }}>
                          {renderPowerBlock(String(wildcardChoice), true)}
                        </div>
                      )}

                      {/* 3. Any nested References (Boxed style) */}
                      {power.reference?.map((refId: string) => (
                        <div key={refId} style={{ marginTop: '10px' }}>
                          {renderPowerBlock(refId, true)}
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

      {showRespawnModal && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <h2 style={{ fontFamily: "'HeaderFont', serif", fontSize: '2.2rem' }}>Respawn?</h2>
            <p style={{ fontSize: '1.1rem', marginBottom: '25px' }}>Reset per-life Powers and clear timers.</p>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button onClick={handleRespawn} style={modalBtn(true)}>Yes</button>
              <button onClick={() => setShowRespawnModal(false)} style={modalBtn(false)}>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- STYLES ---

const fixedInterfaceBlock: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, boxShadow: '0 4px 15px rgba(0,0,0,0.4)'
};

const headerStyle: React.CSSProperties = {
  padding: '10px', textAlign: 'center', height: '60px', 
  display: 'flex', flexDirection: 'column', justifyContent: 'center',
  borderBottom: '1px solid rgba(255,255,255,0.1)'
};

const headerTitle: React.CSSProperties = { margin: 0, fontFamily: "'HeaderFont', serif", fontSize: '1.4rem' };

const stickyControlsGrid: React.CSSProperties = {
  backgroundColor: '#fdfaf3', padding: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'
};

const powerRowStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '24px 15px', borderRadius: '6px',
  boxShadow: 'inset 0 0 12px rgba(0,0,0,0.4)', borderBottom: `3px solid rgba(0,0,0,0.3)`
};

const powerNameStyle: React.CSSProperties = {
  fontFamily: "'HeaderFont', serif", fontSize: '1.4rem', color: '#fff', textShadow: '1px 1px 2px #000'
};

const frequencySubStyle = { fontStyle: 'italic', fontSize: '0.9rem', color: '#444', marginBottom: '6px' };

const effectTextStyle: React.CSSProperties = {
  fontSize: '1.1rem', lineHeight: '1.5', whiteSpace: 'pre-line', color: '#000', fontFamily: "'BodyFont', serif"
};

const respawnIconStyle: React.CSSProperties = {
  fontFamily: 'serif', fontSize: '1.8rem', transform: 'scale(1.3, 1)', 
  fontWeight: '900', textShadow: '2px 2px 2px #000', marginTop: '-5px'
};

const gridBtnStyle = (active: boolean) => ({
  padding: '22px 0',
  backgroundColor: active ? 'rgb(45, 85, 145)' : 'rgb(2, 38, 88)',
  color: '#fff',
  border: active ? '2px solid rgba(255,255,255,0.4)' : 'none',
  borderRadius: '8px',
  fontFamily: "'TitleFont', serif",
  fontSize: '1.6rem',
  fontWeight: '900' as const,
  textShadow: '1px 1px 2px #000',
  cursor: 'pointer',
  boxShadow: active ? 'inset 0 0 12px rgba(0,0,0,0.5)' : '0 4px 6px rgba(0,0,0,0.2)',
  transition: 'all 0.1s ease',
  display: 'flex', alignItems: 'center', justifyContent: 'center'
} as React.CSSProperties);

const levelHeaderStyle = {
  backgroundColor: 'rgba(0,0,0,0.1)', padding: '10px 15px', 
  fontFamily: "'HeaderFont', serif", color: '#333', 
  fontSize: '1.8rem', margin: '15px 0 10px', borderRadius: '4px'
};

const counterContainerStyle = {
  display: 'flex', alignItems: 'center', backgroundColor: '#fdfaf3', 
  borderRadius: '6px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.3)', border: '1px solid rgba(0,0,0,0.2)'
};

const bigControlBtn = {
  background: 'none', border: 'none', color: '#000', fontSize: '1.8rem', padding: '8px 16px', 
  cursor: 'pointer', fontWeight: '900' as const, backgroundColor: 'rgba(0,0,0,0.05)'
};

const counterValueStyle = { minWidth: '35px', textAlign: 'center' as const, color: '#000', fontWeight: '900' as const, fontSize: '1.4rem' };

const expandedCardStyle = {
  padding: '20px', backgroundColor: '#ffffff00', border: '2px solid #dddddd00', borderTop: 'none', margin: '0 2px 10px', borderRadius: '0 0 6px 6px'
};

const metadataStyle = {
  fontSize: '0.85rem', borderBottom: '1px solid #bbb', paddingBottom: '8px', marginBottom: '12px', opacity: 0.7, color: '#333'
};

const modalOverlay: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200
};

const modalCard = {
  backgroundColor: '#fdfaf3', padding: '30px 20px', borderRadius: '12px', textAlign: 'center' as const, width: '85%', maxWidth: '350px', border: '3px solid #4a3f35'
};

const modalBtn = (isYes: boolean) => ({
  flex: 1, padding: '16px', border: 'none', borderRadius: '6px', backgroundColor: isYes ? '#4a3f35' : '#888', color: '#fff', fontFamily: "'HeaderFont', serif", fontSize: '1.2rem'
} as React.CSSProperties);

export default CombatScreen;