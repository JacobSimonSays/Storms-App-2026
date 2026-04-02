import React, { useState } from 'react';
import { CLASS_THEMES } from '../theme/classThemes.ts';
import { SavedArsenal } from '../App.tsx';

interface ModifyProps {
  onEdit: (arsenal: SavedArsenal) => void;
  onBack: () => void;
}

const ModifySelector = ({ onEdit, onBack }: ModifyProps) => {
  // TECHNICAL FIX: Lifted data into state so the UI syncs with deletions immediately
  const [savedArsenals, setSavedArsenals] = useState<SavedArsenal[]>(() => 
    JSON.parse(localStorage.getItem('storms_all_characters') || '[]')
  );
  const [selectedIdx, setSelectedIdx] = useState<string>("");

  const hasArsenals = savedArsenals.length > 0;

  const handleEditClick = () => {
    if (selectedIdx !== "") {
      onEdit(savedArsenals[parseInt(selectedIdx)]);
    }
  };

  const handleDelete = () => {
    if (selectedIdx === "") return;
    
    const charToDelete = savedArsenals[parseInt(selectedIdx)];
    const confirmed = window.confirm(`Are you sure you want to delete ${charToDelete.name}? This cannot be undone.`);
    
    if (confirmed) {
        const updatedArsenals = savedArsenals.filter((_, idx) => idx !== parseInt(selectedIdx));
        localStorage.setItem('storms_all_characters', JSON.stringify(updatedArsenals));
        
        // TECHNICAL FIX: Update local state to trigger a re-render
        setSavedArsenals(updatedArsenals);
        setSelectedIdx("");
        
        alert("Arsenal purged from the armory.");
    }
  };

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
      }}>Modify Armory</p>

      <div style={{
        width: '100%', maxWidth: '360px', backgroundColor: 'rgba(255, 255, 255, 0.2)',
        padding: '30px', borderRadius: '15px', backdropFilter: 'blur(2px)',
        border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
      }}>
        
        <div style={{ marginBottom: '25px' }}>
          <label style={{
            display: 'block', fontFamily: "'HeaderFont', serif", fontSize: '1.4rem',
            marginBottom: '8px', color: 'rgb(2, 38, 88)', textAlign: 'center'
          }}>Refine Your Weapons</label>
          
          <select 
            value={selectedIdx} 
            onChange={(e) => setSelectedIdx(e.target.value)}
            style={{
              width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid #4a3f35',
              fontFamily: "'BodyFont', serif", fontSize: '1.1rem', backgroundColor: '#fdfaf3',
              opacity: hasArsenals ? 1 : 0.6
            }}
          >
            <option value="" disabled>-- Select --</option> 
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
          onClick={handleEditClick}
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
          Modify
        </button>

        <button 
            onClick={handleDelete}
            disabled={selectedIdx === ""}
            style={{
            width: '100%', padding: '18px', border: '1px solid #8b0000', borderRadius: '8px',
            fontFamily: "'HeaderFont', serif", fontSize: '1.3rem',
            backgroundColor: 'transparent',
            color: selectedIdx !== "" ? '#8b0000' : '#888',
            cursor: selectedIdx === "" ? 'not-allowed' : 'pointer',
            marginTop: '25px', // Kept our ergonomics fix
            opacity: selectedIdx !== "" ? 1 : 0.5
            }}
        >
            Delete
        </button>
      </div>
      
      <footer style={{ marginTop: '40px', fontSize: '0.7rem', opacity: 0.5, fontFamily: "'BodyFont', serif" }}>
        STORMS • v3.5 
      </footer>
    </div>
  );
};

export default ModifySelector;