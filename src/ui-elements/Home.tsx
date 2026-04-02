import React from 'react';

interface HomeProps {
  onNavigate: (view: 'setup' | 'modify_selector' | 'skirmish_select' | 'rules') => void;
}

const Home = ({ onNavigate }: HomeProps) => {
  const menuItems = [
    { label: 'Build Arsenal', view: 'setup' as const },
    { label: 'Modify Armory', view: 'modify_selector' as const },
    { label: 'Begin Skirmish', view: 'skirmish_select' as const },
    { label: 'View Rulebook', view: 'rules' as const },
  ];

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>STORMS</h1>
      <div style={menuGrid}>
        {menuItems.map((item) => (
          <button 
            key={item.label} 
            onClick={() => onNavigate(item.view)} 
            style={menuButtonStyle}
          >
            <span style={btnLabel}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// --- Styles ---
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

const menuGrid = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '20px',
  width: '100%',
  maxWidth: '600px'
};

const menuButtonStyle = {
  padding: '25px',
  backgroundColor: 'rgb(2, 38, 88)',
  border: '1px solid #4a3f35',
  borderRadius: '12px',
  cursor: 'pointer',
  textAlign: 'center' as const, 
  transition: 'transform 0.1s, background-color 0.2s',
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center', 
  justifyContent: 'center'
};

const btnLabel = { 
  fontFamily: "'HeaderFont', serif", 
  fontSize: '1.7rem', 
  color: 'rgb(255, 255, 255)' 
};

export default Home;