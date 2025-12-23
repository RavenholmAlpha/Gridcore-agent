import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import DetailDrawer from './pages/Detail';

const App: React.FC = () => {
  const [selectedServerId, setSelectedServerId] = useState<number | null>(null);

  return (
    <>
      <Dashboard onServerSelect={setSelectedServerId} />
      <DetailDrawer 
        serverId={selectedServerId} 
        onClose={() => setSelectedServerId(null)} 
      />
    </>
  );
};

export default App;
