import React, { useEffect, useState } from 'react';
import { getServers } from '@/services/api';
import { Server } from '@/types';
import ServerCard from './ServerCard';
import { Layout, Spin, Empty } from 'antd';

const { Header, Content } = Layout;

interface DashboardProps {
  onServerSelect: (id: number) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onServerSelect }) => {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const data = await getServers();
      setServers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000); // Poll every 3s
    return () => clearInterval(interval);
  }, []);

  return (
    <Layout className="min-h-screen bg-background">
      <Header className="bg-background/50 backdrop-blur-md border-b border-border px-8 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-primary rounded-sm transform rotate-45" />
            <h1 className="text-xl font-bold tracking-widest text-primary m-0">GRIDCORE</h1>
        </div>
        <div className="flex items-center gap-4 text-sm text-secondary">
            <span>Online: <span className="text-success">{servers.filter(s => s.status === 1).length}</span></span>
            <span>Total: <span className="text-primary">{servers.length}</span></span>
        </div>
      </Header>
      
      <Content className="p-8">
        {loading && servers.length === 0 ? (
          <div className="flex justify-center items-center h-[60vh]">
            <Spin size="large" />
          </div>
        ) : servers.length === 0 ? (
          <div className="flex justify-center items-center h-[60vh]">
            <Empty description={<span className="text-secondary">No Servers Online</span>} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {servers.map((server) => (
              <ServerCard 
                key={server.id} 
                server={server} 
                onClick={() => onServerSelect(server.id)}
              />
            ))}
          </div>
        )}
      </Content>
    </Layout>
  );
};

export default Dashboard;
