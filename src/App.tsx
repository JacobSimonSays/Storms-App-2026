import React, { useState, useEffect } from 'react';
import Home from './ui-elements/Home.tsx';
import Launcher from './ui-elements/ClassSelector.tsx';
import Builder from './ui-elements/Builder.tsx';
import SkirmishSelector from './ui-elements/SkirmishSelector.tsx';
import CombatScreen from './ui-elements/CombatScreen';

// --- 1. DATA TYPES ---
// We define these here so the whole app knows what an Arsenal looks like.
export interface SavedArsenal {
  name: string;
  className: string;
  level: number;
  selectedMap: Record<string, number>;
  timestamp: string;
}

type View = 'home' | 'setup' | 'builder' | 'skirmish_select' | 'playing' | 'modify' | 'rules';

const App = () => {
  // --- 2. STATE ---
  const [view, setView] = useState<View>(() => {
    return (localStorage.getItem('storms_view') as View) || 'home';
  });
  const [selection, setSelection] = useState<{className: string, level: number} | null>(null);
  const [activeArsenal, setActiveArsenal] = useState<SavedArsenal | null>(() => {
  const saved = localStorage.getItem('activeArsenal');
  return saved ? JSON.parse(saved) : null;
});

  // --- 3. HANDLERS ---
  const handleBack = () => {
    if (isLocked) return;
    else if (view === 'builder') setView('setup');
    else if (view === 'playing') setView('skirmish_select');
    else if (['setup', 'modify', 'skirmish_select', 'rules'].includes(view)) {
      setView('home');
    }
  };

  const handleStart = (chosenClass: string, chosenLevel: number) => {
    setSelection({ className: chosenClass, level: chosenLevel });
    setView('builder');
  };

  const handleCharacterSelected = (arsenal: SavedArsenal) => {
    setActiveArsenal(arsenal);
    setView('playing'); 
  };

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

  const handleNavigate = (newView: View) => {
    if (isLocked) return;
    setView(newView);
  };

  // --- 4. RENDER ---
  return (
    <div className="storms-app" style={{ paddingTop: '80px' }}>
      
      {/* 1. PERSISTENT HEADER */}
      <nav style={headerStyle}>
        <div style={headerLeftGroup}>
          {/* Home Button */}
          <button onClick={() => handleNavigate('home')} style={{
            ...homeBtnStyle, 
            filter: isLocked ? 'grayscale(1) opacity(0.5)' : 'none',
            cursor: isLocked ? 'default' : 'pointer'
          }}>
            <img src="/assets/images/castle.png" alt="Home" style={castleIconStyle} />
          </button>

          {/* Back Button - Only shows if NOT on home */}
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

        {/* Header Right: Breadcrumb + Lock */}
        <div style={{ ...headerRight, display: 'flex', alignItems: 'center', gap: '15px' }}>
          {view !== 'home' && <span style={breadcrumbStyle}>{view.toUpperCase()}</span>}
          
          <div 
            onClick={() => setIsLocked(!isLocked)} 
            style={{ cursor: 'pointer', padding: '5px', display: 'flex', alignItems: 'center' }}
          >
            {isLocked ? (
              /* Solid Closed Lock */
              <svg width="30" height="30" viewBox="0 0 24 24" fill="black">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM9 8V6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9z"/>
              </svg>
            ) : (
              /* Solid Open Lock */
              <svg width="30" height="30" viewBox="0 0 24 24" fill="black" style={{ opacity: 0.5 }}>
                <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h2c0-1.66 1.34-3 3-3s3 1.34 3 3v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z"/>
              </svg>
            )}
          </div>
        </div>
      </nav>

      {/* 2. VIEW ENGINE (Components go HERE, not in the <nav>) */}
      <main>
        {view === 'home' && (
          <Home onNavigate={(v) => handleNavigate(v as View)} />
        )}
        
        {view === 'setup' && (
          <Launcher onStart={handleStart} />
        )}

        {view === 'skirmish_select' && (
          <SkirmishSelector 
            onSelect={handleCharacterSelected} 
            onNavigateToBuild={() => handleNavigate('setup')} 
          />
        )}

        {view === 'playing' && activeArsenal && (
          <CombatScreen arsenal={activeArsenal} />
        )}

        {view === 'builder' && selection && (
          <Builder 
            initialClass={selection.className} 
            initialLevel={selection.level} 
            onBack={() => handleBack()} 
          />
        )}

        {(view === 'modify' || view === 'rules') && (
          <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h2 style={{ fontFamily: "'HeaderFont', serif" }}>{view.toUpperCase()}</h2>
            <p>Coming soon to the v3.5 ruleset...</p>
          </div>
        )}

        {/* Navigation Error Catch */}
        {!['home', 'setup', 'builder', 'skirmish_select', 'playing', 'modify', 'rules'].includes(view) && (
          <div style={{ color: 'red', textAlign: 'center', marginTop: '100px' }}>
            <h2>Navigation Error</h2>
            <p>The view <strong>"{view}"</strong> is not recognized.</p>
            <button onClick={() => setView('home')}>Return Home</button>
          </div>
        )}
      </main>
    </div>
  );
};

// --- 6. STYLES (Your existing header styles) ---
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
const headerRight = { opacity: 0.6, fontSize: '0.8rem', letterSpacing: '1px' };
const breadcrumbStyle = { fontFamily: "'BodyFont', serif" };

export default App;