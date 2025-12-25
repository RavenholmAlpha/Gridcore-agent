import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import DetailDrawer from './pages/Detail';

const App: React.FC = () => {
  const [selectedServerId, setSelectedServerId] = useState<number | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'admin'>('dashboard');

  return (
    <>
      {currentView === 'dashboard' ? (
        <Dashboard 
          onServerSelect={setSelectedServerId} 
          onNavigateToAdmin={() => setCurrentView('admin')}
        />
      ) : (
        <Admin 
          onServerSelect={setSelectedServerId}
          onBack={() => setCurrentView('dashboard')}
        />
      )}
      
      <DetailDrawer 
        serverId={selectedServerId} 
        onClose={() => setSelectedServerId(null)} 
      />
    </>
  );
};

export default App;
