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
  const [selectedIdx, setSelectedIdx] = useState<string>("");

  // DATA PULL
  const savedArsenals: SavedArsenal[] = JSON.parse(
    localStorage.getItem('storms_all_characters') || '[]'
  );
  const hasArsenals = savedArsenals.length > 0;

  const handleStart = () => {
    if (selectedIdx !== "") {
      onSelect(savedArsenals[parseInt(selectedIdx)]);
    }
  };

  // Determine theme based on selection OR default to a neutral "Stormy" grey
  const activeChar = selectedIdx !== "" ? savedArsenals[parseInt(selectedIdx)] : null;
  const currentTheme = activeChar 
    ? CLASS_THEMES[activeChar.className] 
    : { dark: '#4a3f35', text: '#f0e6d2' };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'flex-start', minHeight: '100vh',
      paddingTop: '80px', paddingLeft: '20px', paddingRight: '20px', boxSizing: 'border-box'
    }}>
      <h1 style={{
        fontFamily: "'TitleFont', serif", fontSize: '4rem', color: '#2a241f',
        marginTop: '20px', marginBottom: '40px', textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
      }}>STORMS</h1>
      
      <p style={{
        fontFamily: "'HeaderFont', serif", fontSize: '1.6rem',
        textTransform: 'uppercase', letterSpacing: '1px',
        margin: '0 0 40px 0', color: 'rgb(2, 38, 88)' 
      }}>Select Arsenal</p>

      <div style={{
        width: '100%', maxWidth: '360px', backgroundColor: 'rgba(255, 255, 255, 0.2)',
        padding: '30px', borderRadius: '15px', backdropFilter: 'blur(2px)',
        border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
      }}>
        
        {/* SELECTOR GROUP */}
        <div style={{ marginBottom: '25px' }}>
          <label style={{
            display: 'block', fontFamily: "'HeaderFont', serif", fontSize: '1.4rem',
            marginBottom: '8px', color: 'rgb(2, 38, 88)', textAlign: 'center'
          }}>Prepare for Battle</label>
          
          <select 
            value={selectedIdx} 
            onChange={(e) => setSelectedIdx(e.target.value)}
            style={{
              width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid #4a3f35',
              fontFamily: "'BodyFont', serif", fontSize: '1.1rem', backgroundColor: '#fdfaf3',
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

          {/* Conditional helper text that doesn't break the layout */}
          {!hasArsenals && (
            <p style={{ color: '#8b0000', fontSize: '0.8rem', marginTop: '10px', textAlign: 'center' }}>
              Armory empty, no arsenals found.
            </p>
          )}
        </div>

        {/* PRIMARY ACTION */}
        <button 
          onClick={handleStart}
          disabled={selectedIdx === ""}
          style={{
            width: '100%', padding: '18px', border: 'none', borderRadius: '8px',
            fontFamily: "'HeaderFont', serif", fontSize: '1.3rem',
            backgroundColor: selectedIdx !== "" ? currentTheme.dark : '#857d70',
            color: selectedIdx !== "" ? currentTheme.text : '#444',
            cursor: selectedIdx === "" ? 'not-allowed' : 'pointer',
            boxShadow: selectedIdx !== "" ? `0 4px 0 ${currentTheme.dark}cc` : 'none',
            transition: 'all 0.2s'
          }}
        >
          Begin Skirmish
        </button>

        <div style={{ margin: '20px 0', textAlign: 'center', opacity: 0.3, fontSize: '0.8rem' }}>OR</div>

        {/* SECONDARY ACTION */}
        <button 
          onClick={onNavigateToBuild}
          style={{
            width: '100%', padding: '12px', backgroundColor: 'transparent',
            color: 'rgb(2, 38, 88)', border: '2px solid rgb(2, 38, 88)',
            borderRadius: '8px', fontFamily: "'HeaderFont', serif",
            fontSize: '1rem', cursor: 'pointer'
          }}
        >
          Build New Arsenal
        </button>
      </div>
      
      <footer style={{ marginTop: '40px', fontSize: '0.7rem', opacity: 0.5, fontFamily: "'BodyFont', serif" }}>
        STORMS • v3.5 
      </footer>
    </div>
  );
};

// --- STYLES (Reusing your layout for consistency) ---

const listContainer = {
  maxHeight: '300px',
  overflowY: 'auto' as const,
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '10px',
  marginBottom: '20px',
  paddingRight: '5px' // Space for scrollbar
};

const arsenalItemStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '15px',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  fontFamily: "'BodyFont', serif",
};

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  // 1. Align to the top instead of the center
  justifyContent: 'flex-start', 
  minHeight: '100vh', // Use 100vh to ensure it fills the screen
  // 2. Add padding to account for your 60px Header + some breathing room
  paddingTop: '80px', 
  paddingLeft: '20px',
  paddingRight: '20px',
  boxSizing: 'border-box',
};

const secondaryBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  backgroundColor: 'transparent',
  color: 'rgb(2, 38, 88)',
  border: '2px solid rgb(2, 38, 88)',
  borderRadius: '8px',
  fontFamily: "'HeaderFont', serif",
  fontSize: '1rem',
  cursor: 'pointer',
  marginTop: '10px',
  transition: 'all 0.2s',
  display: 'block',
  textAlign: 'center'
};

const titleStyle = {
  fontFamily: "'TitleFont', serif",
  fontSize: '4rem',
  color: '#2a241f',
  // 3. Keep this margin identical in both files
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

const cardStyle = {
  width: '100%',
  maxWidth: '360px',
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  padding: '30px',
  borderRadius: '15px',
  backdropFilter: 'blur(2px)',
  border: '1px solid rgba(0,0,0,0.05)',
  boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
};

const fieldGroup = { marginBottom: '25px' };

const labelStyle = {
  display: 'block',
  fontFamily: "'HeaderFont', serif",
  fontSize: '1.4rem',
  marginBottom: '8px',
  color: 'rgb(2, 38, 88)',
  textAlign: 'center' as const
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

const levelGrid = {
  display: 'flex',
  gap: '8px',
  justifyContent: 'center'
};

const levelBtnStyle = {
  width: '45px',
  height: '45px',
  borderRadius: '50%',
  fontSize: '1.1rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'all 0.2s'
};

const startBtnStyle = {
  width: '100%',
  padding: '18px',
  backgroundColor: '#4a3f35',
  color: '#f0e6d2',
  border: 'none',
  borderRadius: '8px',
  fontFamily: "'HeaderFont', serif",
  fontSize: '1.3rem',
  cursor: 'pointer',
  boxShadow: '0 4px 0 #2a241f',
  marginTop: '10px'
};

const footerStyle = {
  marginTop: '40px',
  fontSize: '0.7rem',
  opacity: 0.5,
  fontFamily: "'BodyFont', serif"
};

export default SkirmishSelector;