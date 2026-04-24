import React, { useState, useEffect } from 'react';
import Home from './ui-elements/Home.tsx';
import Launcher from './ui-elements/ClassSelector.tsx';
import Builder from './ui-elements/Builder.tsx';
import SkirmishSelector from './ui-elements/SkirmishSelector.tsx';
import CombatScreen from './ui-elements/CombatScreen';
import ModifySelector from './ui-elements/ModifySelector.tsx';
import { CharacterManifest } from './logic/ruleEngine.ts';

// --- 1. DATA TYPES ---
export interface SavedArsenal {
  name: string;
  className: string;
  level: number;
  selectedMap: Record<string, number>;
  manifest: CharacterManifest;
  timestamp: string;
}

type View = 'home' | 'setup' | 'builder' | 'skirmish_select' | 'playing' | 'modify_selector' | 'rules';

const App = () => {
  // --- 2. STATE ---
  const [view, setView] = useState<View>(() => {
    return (localStorage.getItem('storms_view') as View) || 'home';
  });

  const [selection, setSelection] = useState<{className: string, level: number} | null>(null);
  
  const [activeArsenal, setActiveArsenal] = useState<SavedArsenal | null>(() => {
    const saved = localStorage.getItem('storms_active_arsenal');
    return saved ? JSON.parse(saved) : null;
  });

  const [editingArsenal, setEditingArsenal] = useState<SavedArsenal | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  // --- 3. PERSISTENCE SIDE EFFECTS ---
  useEffect(() => {
    localStorage.setItem('storms_view', view);
  }, [view]);

  useEffect(() => {
    if (activeArsenal) {
      localStorage.setItem('storms_active_arsenal', JSON.stringify(activeArsenal));
    }
  }, [activeArsenal]);

  useEffect(() => {
    if (isLocked) {
      window.onbeforeunload = () => "Active Skirmish in progress. Exit?";
    } else {
      window.onbeforeunload = null;
    }
    return () => { window.onbeforeunload = null; };
  }, [isLocked]);

  // --- 4. HANDLERS ---
  const handleBack = () => {
    if (isLocked) return;
    if (view === 'builder') setView('setup');
    else if (view === 'playing') setView('skirmish_select');
    else if (['setup', 'modify_selector', 'skirmish_select', 'rules'].includes(view)) {
      setView('home');
    }
  };

  const handleNavigate = (newView: View) => {
    if (isLocked) return;
    setView(newView);
  };

  const handleStartNewBuild = (chosenClass: string, chosenLevel: number) => {
    setEditingArsenal(null); // Ensure we aren't carrying over an old map
    setSelection({ className: chosenClass, level: chosenLevel });
    setView('builder');
  };

  // --- 5. RENDER ---
  return (
    <div className="storms-app" style={{ paddingTop: '80px' }}>
      
      <nav style={headerStyle}>
        <div style={headerLeftGroup}>
          <button onClick={() => handleNavigate('home')} style={{
            ...homeBtnStyle, 
            filter: isLocked ? 'grayscale(1) opacity(0.5)' : 'none',
            cursor: isLocked ? 'default' : 'pointer'
          }}>
            <img src="/assets/images/castle.png" alt="Home" style={castleIconStyle} />
          </button>

          {view !== 'home' && (
            <button onClick={handleBack} style={{
              ...backIconBtnStyle,
              filter: isLocked ? 'grayscale(1) opacity(0.5)' : 'none',
              cursor: isLocked ? 'default' : 'pointer'
            }}>
              <img src="/assets/images/bow_arrow.png" alt="Back" style={bowIconStyle} />
            </button>
          )}
        </div>

        <div style={headerRight}>
          <div 
            onClick={() => setIsLocked(!isLocked)} 
            style={{ cursor: 'pointer', padding: '5px', display: 'flex', alignItems: 'center' }}
          >
            {isLocked ? (
              <svg width="30" height="30" viewBox="0 0 24 24" fill="black"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM9 8V6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9z"/></svg>
            ) : (
              <svg width="30" height="30" viewBox="0 0 24 24" fill="black" style={{ opacity: 0.5 }}><path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h2c0-1.66 1.34-3 3-3s3 1.34 3 3v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z"/></svg>
            )}
          </div>
        </div>
      </nav>

      <main>
        {view === 'home' && <Home onNavigate={(v) => handleNavigate(v as View)} />}
        
        {view === 'setup' && <Launcher onStart={handleStartNewBuild} />}

        {view === 'skirmish_select' && (
          <SkirmishSelector 
            onSelect={(ars) => { setActiveArsenal(ars); setView('playing'); }} 
            onNavigateToBuild={() => handleNavigate('setup')} 
          />
        )}

        {view === 'playing' && activeArsenal && <CombatScreen arsenal={activeArsenal} />}

        {view === 'builder' && selection && (
          <Builder 
            initialClass={selection.className}
            initialLevel={selection.level}
            existingMap={editingArsenal?.selectedMap} 
            onSave={() => { setEditingArsenal(null); setView('home'); }}
            onCancel={() => { setEditingArsenal(null); setView('home'); }}
          />
        )}

        {view === 'modify_selector' && (
          <ModifySelector 
            onEdit={(arsenal) => {
              setEditingArsenal(arsenal);
              setSelection({ className: arsenal.className, level: arsenal.level });
              setView('builder');
            }}
            onBack={() => setView('home')}
          />
        )}

        {view === 'rules' && (
          <div style={{ height: 'calc(100vh - 80px)', width: '100%', display: 'flex', flexDirection: 'column' }}>
            <iframe src="/assets/Storms_Official_Rulebook_V3.5.pdf" style={{ width: '100%', flexGrow: 1, border: 'none' }} title="STORMS Rulebook" />
            <div style={{ padding: '10px', textAlign: 'center', backgroundColor: '#eee' }}>
              <a href="/assets/Storms_Official_Rulebook_V3.5.pdf" target="_blank" rel="noopener noreferrer" style={{ color: '#022658', fontWeight: 'bold', textDecoration: 'none' }}>📥 Download Rulebook</a>
            </div>
          </div>
        )}

        {!['home', 'setup', 'builder', 'skirmish_select', 'playing', 'modify_selector', 'rules'].includes(view) && (
          <div style={{ color: 'red', textAlign: 'center', marginTop: '100px' }}>
            <h2>Navigation Error</h2>
            <button onClick={() => setView('home')}>Return Home</button>
          </div>
        )}
      </main>
    </div>
  );
};

// --- 6. STYLES ---
const headerStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, height: '60px',
  backgroundColor: '#857d70', display: 'flex', alignItems: 'center',
  justifyContent: 'space-between', padding: '0 20px', zIndex: 1000,
  boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
};

const headerLeftGroup = { display: 'flex', alignItems: 'center', gap: '12px', height: '100%' };
const homeBtnStyle = { background: 'none', border: 'none', cursor: 'pointer' };
const castleIconStyle = { height: '42px', width: 'auto', display: 'block' };
const backIconBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const bowIconStyle = { height: '34px', width: 'auto', display: 'block', transform: 'translateY(-1px)' };
const headerRight = { display: 'flex', alignItems: 'center', gap: '15px' };

export default App;