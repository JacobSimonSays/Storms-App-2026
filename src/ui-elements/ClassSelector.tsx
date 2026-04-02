import React, { useState } from 'react';
import { CLASS_DATA } from '../data/classData.ts';
import { CLASS_THEMES } from '../theme/classThemes.ts';

const Launcher = ({ onStart }: { onStart: (c: string, l: number) => void }) => {
  const [selClass, setSelClass] = useState<string>('');
    const [selLevel, setSelLevel] = useState<number>(0);

    const handleStart = () => {
    if (selClass && selLevel > 0) {
        onStart(selClass, selLevel);
    } else {
        console.log("Selection required.");
    }
    };
  const classKeys = Object.keys(CLASS_DATA.classes) as Array<keyof typeof CLASS_DATA.classes>;
  
  const currentTheme = (selClass && CLASS_THEMES[selClass]) 
    ? CLASS_THEMES[selClass] 
    : { dark: '#4a3f35', light: 'rgba(0,0,0,0.05)', text: '#f0e6d2' };

  const activeColor = currentTheme.dark;
  const activeText = currentTheme.text;

  return (
    <div style={containerStyle}>
      {/* The Big Title */}
      <h1 style={titleStyle}>STORMS</h1>
      <p style={subtitleStyle}>Build Arsenal</p>

      <div style={cardStyle}>
        <div style={fieldGroup}>
          <label style={labelStyle}>Choose Your Path</label>
          <select 
            value={selClass} 
            onChange={(e) => {
              setSelClass(e.target.value);
              setSelLevel(0);
            }}
            style={selectStyle}
          >
            <option value="" disabled>-- Select a Class --</option> 
            {classKeys.map(c => (
            <option key={c} value={c}>
                {c}
            </option>
            ))}
          </select>
        </div>
        
        <div style={fieldGroup}>
          <label style={labelStyle}>Level</label>
          <div style={levelGrid}>
            {[1, 2, 3, 4, 5].map(lvl => (
              <button 
                key={lvl}
                onClick={() => setSelLevel(lvl)}
                style={{
                  ...levelBtnStyle,
                  backgroundColor: selLevel === lvl ? activeColor : 'rgba(0,0,0,0.05)',
                  color: selLevel === lvl ? activeText : '#4a3f35',
                  border: selLevel === lvl ? `1px solid ${activeColor}` : '1px solid rgba(0,0,0,0.2)',
                }}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={handleStart}
          style={{
            ...startBtnStyle,
            backgroundColor: activeColor,
            color: activeText,
            boxShadow: `0 4px 0 ${activeColor}cc`,
          }}
        >
          Build Arsenal
        </button>
      </div>
      
      <footer style={footerStyle}>STORMS • v3.5 </footer>
    </div>
  );
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

export default Launcher;