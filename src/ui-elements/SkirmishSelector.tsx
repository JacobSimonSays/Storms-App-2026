import React, { useState } from 'react';
import { CLASS_THEMES } from '../theme/classThemes.ts';
import { SavedArsenal } from '../App.tsx';

const SkirmishSelector = ({ 
  onSelect, 
  onNavigateToBuild 
}: { 
  onSelect: (arsenal: SavedArsenal) => void,
  onNavigateToBuild: () => void 
}) => {
  // TECHNICAL FIX: Wrap in state to ensure stable rendering
  const [savedArsenals] = useState<SavedArsenal[]>(() => 
    JSON.parse(localStorage.getItem('storms_all_characters') || '[]')
  );
  const [selectedIdx, setSelectedIdx] = useState<string>("");

  const hasArsenals = savedArsenals.length > 0;

  const handleStart = () => {
    if (selectedIdx !== "") {
      const selectedArsenal = savedArsenals[parseInt(selectedIdx)];
      
      // TECHNICAL FIX: Sync the active character to storage before launching
      localStorage.setItem('storms_active_character', JSON.stringify(selectedArsenal));
      
      onSelect(selectedArsenal);
    }
  };

  const activeChar = selectedIdx !== "" ? savedArsenals[parseInt(selectedIdx)] : null;
  const theme = activeChar 
    ? CLASS_THEMES[activeChar.className] 
    : { dark: '#4a3f35', text: '#f0e6d2' };

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>STORMS</h1>
      
      <p style={subtitleStyle}>Select Arsenal</p>

      <div style={cardStyle}>
        <div style={{ marginBottom: '25px' }}>
          <label style={labelStyle}>Prepare for Battle</label>
          
          <select 
            value={selectedIdx} 
            onChange={(e) => setSelectedIdx(e.target.value)}
            style={{
              ...selectStyle,
              opacity: hasArsenals ? 1 : 0.6
            }}
          >
            <option value="" disabled>-- Select Saved Arsenal --</option> 
            {savedArsenals.map((char, idx) => (
              <option key={idx} value={idx}>
                {char.name} ({char.className} Lvl {char.level})
              </option>
            ))}
          </select>

          {!hasArsenals && (
            <p style={{ color: '#8b0000', fontSize: '0.8rem', marginTop: '10px', textAlign: 'center' }}>
              Armory empty, no Arsenals found.
            </p>
          )}
        </div>

        <button 
          onClick={handleStart}
          disabled={selectedIdx === "" || !hasArsenals}
          style={{
            ...primaryBtnBase,
            backgroundColor: selectedIdx !== "" ? theme.dark : '#857d70',
            color: selectedIdx !== "" ? theme.text : '#444',
            cursor: selectedIdx === "" ? 'not-allowed' : 'pointer',
            boxShadow: selectedIdx !== "" ? `0 4px 0 ${theme.dark}cc` : 'none',
          }}
        >
          Begin Skirmish
        </button>

        <button 
          onClick={onNavigateToBuild}
          style={secondaryBtnStyle}
        >
          Build New Arsenal
        </button>
      </div>
      
      <footer style={footerStyle}>
        STORMS • v3.5 
      </footer>
    </div>
  );
};

// --- CLEANED STYLES ---

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start', 
  minHeight: '100vh',
  paddingTop: '80px', 
  paddingLeft: '20px',
  paddingRight: '20px',
  boxSizing: 'border-box',
};

const titleStyle = {
  fontFamily: "'TitleFont', serif",
  fontSize: '4rem',
  color: '#2a241f',
  marginTop: '20px', 
  marginBottom: '40px',
  textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
};

const subtitleStyle = {
  fontFamily: "'HeaderFont', serif",
  fontSize: '1.6rem',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0 0 40px 0',
  color: 'rgb(2, 38, 88)' 
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '360px',
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  padding: '30px',
  borderRadius: '15px',
  backdropFilter: 'blur(2px)',
  border: '1px solid rgba(0,0,0,0.05)',
  boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: "'HeaderFont', serif",
  fontSize: '1.4rem',
  marginBottom: '8px',
  color: 'rgb(2, 38, 88)',
  textAlign: 'center'
};

const selectStyle = {
  width: '100%',
  padding: '15px',
  borderRadius: '8px',
  border: '1px solid #4a3f35',
  fontFamily: "'BodyFont', serif",
  fontSize: '1.1rem',
  backgroundColor: '#fdfaf3',
};

const primaryBtnBase: React.CSSProperties = {
  width: '100%',
  padding: '18px',
  border: 'none',
  borderRadius: '8px',
  fontFamily: "'HeaderFont', serif",
  fontSize: '1.3rem',
  transition: 'all 0.2s'
};

const secondaryBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '18px',
  backgroundColor: 'transparent',
  color: 'rgb(2, 38, 88)',
  border: '2px solid rgb(2, 38, 88)',
  borderRadius: '8px',
  fontFamily: "'HeaderFont', serif",
  fontSize: '1.3rem',
  cursor: 'pointer',
  marginTop: '20px',
};

const footerStyle = {
  marginTop: '40px',
  fontSize: '0.7rem',
  opacity: 0.5,
  fontFamily: "'BodyFont', serif"
};

export default SkirmishSelector;