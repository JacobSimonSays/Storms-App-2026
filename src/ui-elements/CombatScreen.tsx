import React, { useState, useEffect, useMemo } from 'react';
import { ALL_ABILITIES } from '../data/allAbilities.ts';
import { CLASS_DATA } from '../data/classData.ts';
import { CLASS_THEMES } from '../theme/classThemes.ts';
import { SavedArsenal } from '../App.tsx';

const CombatScreen = ({ arsenal }: { arsenal: SavedArsenal }) => {
  const theme = CLASS_THEMES[arsenal.className] || CLASS_THEMES.Barbarian;

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [deathTimer, setDeathTimer] = useState<number | null>(null);
  const [stateTimer, setStateTimer] = useState<number | null>(null);
  const [showRespawnModal, setShowRespawnModal] = useState(false);
  const [utilityTimer, setUtilityTimer] = useState<number | null>(null);
  const [charges, setCharges] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    ALL_ABILITIES.forEach(a => {
      const purchaseCount = Number(arsenal.selectedMap[a.powerId]) || 0;
      if (purchaseCount > 0 && (a.frequency?.includes('/Life') || a.frequency?.includes('/Skirmish'))) {
        const baseUses = parseInt(a.frequency) || 1; 
        initial[a.powerId] = baseUses * purchaseCount;
      }
    });
    return initial;
  });

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
    ALL_ABILITIES.forEach(a => {
      if (a.frequency?.includes('/Life')) {
        const purchaseCount = Number(arsenal.selectedMap[a.powerId]) || 0;
        const baseUses = parseInt(a.frequency) || 1;
        resetCharges[a.powerId] = baseUses * purchaseCount;
      }
    });
    setUtilityTimer(null);
    setDeathTimer(null);
    setStateTimer(null);
    setShowRespawnModal(false);
  };

  const updateCharge = (id: string, delta: number) => {
    const purchaseCount = Number(arsenal.selectedMap[id]) || 0;
    const power = ALL_ABILITIES.find(a => a.powerId === id);
    const baseUses = parseInt(power?.frequency || "1") || 1;
    const maxUses = baseUses * purchaseCount;

    setCharges(prev => ({
      ...prev,
      [id]: Math.min(maxUses, Math.max(0, (prev[id] || 0) + delta))
    }));
  };

  const groupedAbilities = useMemo(() => {
    const classInfo = (CLASS_DATA.classes as any)[arsenal.className];
    const mapping = classInfo?.tierMapping || [];
    const owned = ALL_ABILITIES.filter(a => (Number(arsenal.selectedMap[a.powerId]) || 0) > 0);

    return owned.reduce((acc, ability) => {
      const tier = mapping.find((m: any) => m.powerId === ability.powerId);
      const lvl = tier ? tier.level : 'Borrowed';
      if (lvl === 0 || lvl === '0') return acc;
      if (!acc[lvl]) acc[lvl] = [];
      acc[lvl].push(ability);
      return acc;
    }, {} as Record<string, any[]>);
  }, [arsenal]);

  const [isLocked, setIsLocked] = useState(false);
    // Optional: Prevent accidental browser "Back" navigation when locked
    useEffect(() => {
      if (isLocked) {
        window.onbeforeunload = () => "Are you sure you want to leave the skirmish?";
      } else {
        window.onbeforeunload = null;
      }
      return () => { window.onbeforeunload = null; };
    }, [isLocked]);

  return (
    <div style={{ width: '100%', minHeight: '100vh', paddingBottom: '40px' }}>
      
      {/* --- FIXED INTERFACE BLOCK --- */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, boxShadow: '0 4px 15px rgba(0,0,0,0.4)' }}>
        
        {/* 1. TOP HEADER (The Identity) */}
        <header style={{ 
          backgroundColor: theme.dark, color: theme.text, 
          padding: '10px', textAlign: 'center', height: '60px', 
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h1 style={{ margin: 0, fontFamily: "'HeaderFont', serif", fontSize: '1.4rem' }}>
            {arsenal.name}
          </h1>
          <div style={{ opacity: 0.8, fontSize: '0.75rem' }}>
            {arsenal.className} • Level {arsenal.level}
          </div>
        </header>

        {/* 2. STICKY CONTROLS (The Actions) */}
        <div style={{ 
          backgroundColor: '#fdfaf3', 
          padding: '10px', 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '10px' 
        }}>
          {/* Row 1: The Quick Timers */}
          <button onClick={() => setUtilityTimer(10)} style={gridBtnStyle(!!utilityTimer)}>
            {utilityTimer ? `${utilityTimer}s` : '10s'}
          </button>
          
          <button onClick={() => setStateTimer(25)} style={gridBtnStyle(!!stateTimer)}>
            {stateTimer ? `${stateTimer}s` : '25s'}
          </button>

          {/* Row 2: The Long Timer & Reset */}
          <button onClick={() => setDeathTimer(55)} style={gridBtnStyle(!!deathTimer)}>
            {deathTimer ? `${deathTimer}s` : '55s'}
          </button>

          <button onClick={() => setShowRespawnModal(true)} style={gridBtnStyle(false)}>
            <div style={{ 
              fontFamily: 'serif', 
              fontSize: '1.8rem',  // Scales the entire glyph
              transform: 'scale(1.3, 1)', // Widen it slightly
              fontWeight: '900', // Forces maximum font weight
              textShadow: '2px 2px 2px #000', // Darker shadow adds thickness
              marginTop: '-5px' 
            }}>
              ↻
            </div>
          </button>
        </div>
      </div>

      {/* --- SCROLLABLE POWERS --- */}
      {/* Pushed down by the combined height of the fixed header/controls (~210px) */}
      <main style={{ paddingTop: '215px', paddingLeft: '10px', paddingRight: '10px' }}>
        {Object.keys(groupedAbilities).sort().map(lvl => (
          <div key={lvl}>
            <h3 style={levelHeaderStyle}>{`Level ${lvl}`}</h3>

            {groupedAbilities[lvl].map(power => {
              const isExpanded = expandedIds.has(power.powerId);
              const currentUses = charges[power.powerId];

              return (
                <div key={power.powerId} style={{ marginBottom: '8px' }}>
                  <div 
                    onClick={() => {
                       const next = new Set(expandedIds);
                       next.has(power.powerId) ? next.delete(power.powerId) : next.add(power.powerId);
                       setExpandedIds(next);
                    }} 
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '24px 15px', backgroundColor: theme.dark, borderRadius: '6px',
                      boxShadow: 'inset 0 0 12px rgba(0,0,0,0.4)', borderBottom: `3px solid rgba(0,0,0,0.3)`
                    }}
                  >
                    <span style={{ 
                      fontFamily: "'HeaderFont', serif", fontSize: '1.4rem', color: '#fff',
                      textShadow: '1px 1px 2px #000'
                    }}>
                      {power.name}
                    </span>

                    <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center' }}>
                      {currentUses !== undefined && (
                        <div style={counterContainerStyle}>
                          <button onClick={() => updateCharge(power.powerId, -1)} style={bigControlBtn}>−</button>
                          <span style={counterValueStyle}>{currentUses}</span>
                          <button onClick={() => updateCharge(power.powerId, 1)} style={bigControlBtn}>+</button>
                        </div>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={expandedCardStyle}>
                      <div style={{ fontStyle: 'italic', fontSize: '0.9rem', color: '#444', marginBottom: '6px' }}>
                        {power.frequency} {power.charge ? ' | Charge' : ''}
                      </div>
                      <div style={metadataStyle}>
                        {[power.school, power.abilityType, power.power, power.abilityRange].filter(Boolean).join(' | ')}
                      </div>
                      <div style={{ fontSize: '1.1rem', lineHeight: '1.5', whiteSpace: 'pre-line', color: '#000', fontFamily: "'BodyFont', serif" }}>
                        {power.effect}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </main>

      {/* RESPAWN MODAL */}
      {showRespawnModal && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <h2 style={{ fontFamily: "'HeaderFont', serif", fontSize: '2.2rem' }}>Respawn?</h2>
            <p style={{ fontSize: '1.1rem', marginBottom: '25px' }}>Reset per-life charges and clear timers.</p>
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

const gridBtnStyle = (active: boolean) => {
  const navyBase = 'rgb(2, 38, 88)';
  const navyActive = 'rgb(45, 85, 145)';

  return {
    padding: '22px 0',
    backgroundColor: active ? navyActive : navyBase,
    color: '#fff',
    border: active ? '2px solid rgba(255,255,255,0.4)' : 'none',
    borderRadius: '8px',
    fontFamily: "'TitleFont', serif",
    fontSize: '1.6rem', // Big numbers for big thumbs
    fontWeight: '900' as const,
    textShadow: '1px 1px 2px #000',
    cursor: 'pointer',
    boxShadow: active ? 'inset 0 0 12px rgba(0,0,0,0.5)' : '0 4px 6px rgba(0,0,0,0.2)',
    transition: 'all 0.1s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };
};

const levelHeaderStyle = {
  backgroundColor: 'rgba(0,0,0,0.1)', padding: '10px 15px', 
  fontFamily: "'HeaderFont', serif", color: '#333', 
  fontSize: '1.8rem', margin: '15px 0 10px', borderRadius: '4px'
};

const counterContainerStyle = {
  display: 'flex', alignItems: 'center', 
  backgroundColor: '#fdfaf3', // Light creamy background for maximum black text contrast
  borderRadius: '6px', overflow: 'hidden',
  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
  border: '1px solid rgba(0,0,0,0.2)'
};

const bigControlBtn = {
  background: 'none', border: 'none', color: '#000', 
  fontSize: '1.8rem', padding: '8px 16px', 
  cursor: 'pointer', fontWeight: '900' as const,
  backgroundColor: 'rgba(0,0,0,0.05)'
};

const counterValueStyle = {
  minWidth: '35px', textAlign: 'center' as const, 
  color: '#000', fontWeight: '900' as const, 
  fontSize: '1.4rem'
};

const expandedCardStyle = {
  padding: '20px', backgroundColor: '#fff', 
  border: '2px solid #ddd', borderTop: 'none', 
  margin: '0 2px 10px', borderRadius: '0 0 6px 6px'
};

const metadataStyle = {
  fontSize: '0.85rem', borderBottom: '1px solid #bbb', 
  paddingBottom: '8px', marginBottom: '12px', opacity: 0.7, color: '#333'
};

const modalOverlay: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200
};

const modalCard = {
  backgroundColor: '#fdfaf3', padding: '30px 20px', borderRadius: '12px', 
  textAlign: 'center' as const, width: '85%', maxWidth: '350px', border: '3px solid #4a3f35'
};

const modalBtn = (isYes: boolean) => ({
  flex: 1, padding: '16px', border: 'none', borderRadius: '6px',
  backgroundColor: isYes ? '#4a3f35' : '#888',
  color: '#fff', fontFamily: "'HeaderFont', serif", fontSize: '1.2rem'
});

export default CombatScreen;