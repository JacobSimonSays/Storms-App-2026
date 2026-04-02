import React from 'react';

interface HomeProps {
  onNavigate: (view: 'setup' | 'modify' | 'skirmish_select' | 'rules') => void;
}

const Home = ({ onNavigate }: HomeProps) => {
  const menuItems = [
    { label: 'Build Arsenal', view: 'setup' as const },
    { label: 'Modify Arsenal', view: 'modify' as const },
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

const menuGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '20px',
  width: '100%',
  maxWidth: '600px'
};

const menuButtonStyle = {
  padding: '25px',
  backgroundColor: 'rgba(255, 255, 255, 0.4)',
  border: '1px solid #4a3f35',
  borderRadius: '12px',
  cursor: 'pointer',
  // 1. Change 'left' to 'center'
  textAlign: 'center' as const, 
  transition: 'transform 0.1s, background-color 0.2s',
  display: 'flex',
  flexDirection: 'column' as const,
  // 2. Ensure flex children are also centered
  alignItems: 'center', 
  justifyContent: 'center'
};

const btnLabel = { 
  fontFamily: "'HeaderFont', serif", 
  fontSize: '1.7rem', 
  // 3. Apply your specific Navy Blue color
  color: 'rgb(2, 38, 88)' 
};

const btnSub = { fontFamily: "'BodyFont', serif", fontSize: '0.8rem', opacity: 0.7, marginTop: '5px' };

export default Home;