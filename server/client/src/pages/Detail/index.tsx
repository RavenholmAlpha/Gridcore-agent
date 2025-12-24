import React, { useEffect, useState } from 'react';
import { getServerMetrics } from '@/services/api';
import { ServerDetail } from '@/types';
import { Drawer, Spin, Select, Descriptions, Tag } from 'antd';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';

interface DetailDrawerProps {
  serverId: number | null;
  onClose: () => void;
}

const DetailDrawer: React.FC<DetailDrawerProps> = ({ serverId, onClose }) => {
  const [data, setData] = useState<ServerDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState('1h');

  useEffect(() => {
    if (serverId) {
      setLoading(true);
      const fetchData = async () => {
        try {
          const result = await getServerMetrics(serverId, range);
          setData(result);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
      // const interval = setInterval(fetchData, 5000);
      // return () => clearInterval(interval);
    } else {
      setData(null);
    }
  }, [serverId, range]);

  if (!serverId) return null;

  return (
    <Drawer
      title={data?.server.name || 'Server Details'}
      placement="right"
      width={720}
      onClose={onClose}
      open={!!serverId}
      styles={{
        header: { background: '#141414', borderBottom: '1px solid #27272a', color: '#ededed' },
        body: { background: '#0a0a0a', padding: 0 },
        mask: { backdropFilter: 'blur(4px)' }
      }}
    >
      {loading && !data ? (
        <div className="flex justify-center items-center h-full">
          <Spin />
        </div>
      ) : data ? (
        <div className="p-6 space-y-8 text-primary">
          {/* Info Section */}
          <section>
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-semibold text-primary">System Info</h3>
               <Tag color={data.server.status === 1 ? 'success' : 'error'}>
                 {data.server.status === 1 ? 'Online' : 'Offline'}
               </Tag>
             </div>
             <Descriptions column={2} layout="vertical" contentStyle={{ color: '#ededed' }} labelStyle={{ color: '#a1a1aa' }}>
                <Descriptions.Item label="OS">{data.server.os_info}</Descriptions.Item>
                <Descriptions.Item label="IP">{data.server.client_ip}</Descriptions.Item>
                <Descriptions.Item label="CPU Cores">{data.server.cpu_cores || '-'}</Descriptions.Item>
                <Descriptions.Item label="RAM Total">{data.server.ram_total ? (data.server.ram_total / 1024 / 1024 / 1024).toFixed(1) + ' GB' : '-'}</Descriptions.Item>
                <Descriptions.Item label="Uptime">{data.server.uptime ? (data.server.uptime / 3600 / 24).toFixed(1) + ' Days' : '-'}</Descriptions.Item>
                <Descriptions.Item label="Last Seen">{dayjs(data.server.last_seen).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
             </Descriptions>
          </section>

          {/* Charts Section */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-primary">Performance</h3>
              <div className="flex gap-4">
                <div className="flex flex-col items-end">
                    <span className="text-xs text-secondary">Load Average (1/5/15)</span>
                    <span className="font-mono text-sm text-primary">
                      {data.metrics.length > 0 
                        ? `${data.metrics[data.metrics.length-1].load_1?.toFixed(2) || '-'} / ${data.metrics[data.metrics.length-1].load_5?.toFixed(2) || '-'} / ${data.metrics[data.metrics.length-1].load_15?.toFixed(2) || '-'}`
                        : '- / - / -'
                      }
                    </span>
                </div>
                <Select 
                defaultValue="1h" 
                style={{ width: 120 }} 
                onChange={setRange}
                options={[
                  { value: '1h', label: 'Last 1 Hour' },
                  { value: '24h', label: 'Last 24 Hours' },
                  { value: '7d', label: 'Last 7 Days' },
                ]}
              />
              </div>
            </div>

            {/* CPU Chart */}
            <div className="mb-8">
              <h4 className="text-sm text-secondary mb-2">CPU Usage (%)</h4>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.metrics}>
                    <defs>
                      <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ededed" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ededed" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis 
                        dataKey="createdAt" 
                        tickFormatter={(str: string) => dayjs(str).format('HH:mm')} 
                        stroke="#52525b" 
                        tick={{ fontSize: 10 }}
                    />
                    <YAxis stroke="#52525b" tick={{ fontSize: 10 }} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#141414', borderColor: '#27272a', color: '#ededed' }}
                        labelFormatter={(str: string) => dayjs(str).format('YYYY-MM-DD HH:mm:ss')}
                    />
                    <Area type="monotone" dataKey="cpu_usage" stroke="#ededed" fillOpacity={1} fill="url(#colorCpu)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

             {/* RAM Chart */}
             <div className="mb-8">
              <h4 className="text-sm text-secondary mb-2">RAM Usage (%)</h4>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.metrics}>
                    <defs>
                      <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a1a1aa" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#a1a1aa" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis 
                        dataKey="createdAt" 
                        tickFormatter={(str: string) => dayjs(str).format('HH:mm')} 
                        stroke="#52525b" 
                        tick={{ fontSize: 10 }}
                    />
                    <YAxis stroke="#52525b" tick={{ fontSize: 10 }} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#141414', borderColor: '#27272a', color: '#ededed' }}
                        labelFormatter={(str: string) => dayjs(str).format('YYYY-MM-DD HH:mm:ss')}
                    />
                    <Area type="monotone" dataKey="ram_usage" stroke="#a1a1aa" fillOpacity={1} fill="url(#colorRam)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </section>
        </div>
      ) : (
        <div className="p-6 text-center text-secondary">No data available</div>
      )}
    </Drawer>
  );
};

export default DetailDrawer;
