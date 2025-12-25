import React, { useEffect, useState } from 'react';
import { getServerMetrics, updateRemark } from '@/services/api';
import { ServerDetail } from '@/types';
import { Drawer, Spin, Select, Descriptions, Tag, Button, Modal, Input, message } from 'antd';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { EditOutlined, WindowsOutlined, AppleOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

// Simple Tux Icon for Linux (Same as ServerCard)
const TuxIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" style={{ display: 'inline-block' }}>
    <path d="M12 0c-3.31 0-6 2.69-6 6 0 1.25.38 2.41 1.03 3.38-.45.54-.84 1.15-1.14 1.82C3.62 10.95 2 13.25 2 16c0 3.31 2.69 6 6 6h8c3.31 0 6-2.69 6-6 0-2.75-1.62-5.05-3.89-4.8-.3-.67-.69-1.28-1.14-1.82.65-.97 1.03-2.13 1.03-3.38 0-3.31-2.69-6-6-6zM9.5 3.5c.83 0 1.5.67 1.5 1.5S10.33 6.5 9.5 6.5 8 5.83 8 5 8.67 3.5 9.5 3.5zm5 0c.83 0 1.5.67 1.5 1.5S15.33 6.5 14.5 6.5 13 5.83 13 5 13.67 3.5 14.5 3.5zM12 8c1.66 0 3 1.34 3 3v5h-6v-5c0-1.66 1.34-3 3-3z"/>
  </svg>
);

interface DetailDrawerProps {
  serverId: number | null;
  onClose: () => void;
  canEdit?: boolean;
}

const DetailDrawer: React.FC<DetailDrawerProps> = ({ serverId, onClose, canEdit = false }) => {
  const [data, setData] = useState<ServerDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState('1h');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [remarkInput, setRemarkInput] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchData = async () => {
    if (!serverId) return;
    try {
      // setLoading(true); // Don't show full spinner on refresh
      const result = await getServerMetrics(serverId, range);
      setData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (serverId) {
      setLoading(true);
      fetchData();
    } else {
      setData(null);
    }
  }, [serverId, range]);

  const handleEditRemark = () => {
    if (data?.server) {
      setRemarkInput(data.server.remark || '');
      setIsModalOpen(true);
    }
  };

  const handleSaveRemark = async () => {
    if (!data?.server) return;
    setUpdating(true);
    try {
      await updateRemark(data.server.id, remarkInput);
      message.success('Remark updated');
      setIsModalOpen(false);
      fetchData(); // Refresh data to show new remark
    } catch (error) {
      message.error('Failed to update remark');
    } finally {
      setUpdating(false);
    }
  };

  const getOSIcon = (osInfo?: string) => {
    if (!osInfo) return <QuestionCircleOutlined />;
    const lower = osInfo.toLowerCase();
    if (lower.includes('windows')) return <WindowsOutlined style={{ color: '#0078D6' }} />;
    if (lower.includes('mac') || lower.includes('darwin')) return <AppleOutlined style={{ color: '#fff' }} />;
    if (lower.includes('linux') || lower.includes('ubuntu') || lower.includes('debian') || lower.includes('centos')) {
      return <span style={{ color: '#fff' }}><TuxIcon /></span>;
    }
    return <QuestionCircleOutlined />;
  };

  if (!serverId) return null;

  // Custom Title Component
  const DrawerTitle = (
    <div className="flex items-center gap-3">
      <div className="text-xl">{getOSIcon(data?.server.os_info)}</div>
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span>{data?.server.remark || data?.server.name || 'Loading...'}</span>
          {canEdit && (
            <Button 
              type="text" 
              size="small" 
              icon={<EditOutlined />} 
              className="text-secondary hover:text-primary"
              onClick={(e) => { e.stopPropagation(); handleEditRemark(); }}
            />
          )}
        </div>
        {data?.server.remark && (
          <span className="text-xs text-secondary font-normal">{data.server.name}</span>
        )}
      </div>
    </div>
  );

  return (
    <>
      <Drawer
        title={DrawerTitle}
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

              <div className="space-y-6">
                {/* CPU Chart */}
                <div className="bg-surface p-4 rounded-lg border border-border">
                  <h4 className="text-sm font-medium mb-4 text-secondary">CPU Usage</h4>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.metrics}>
                        <defs>
                          <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis 
                          dataKey="createdAt" 
                          tickFormatter={(str) => dayjs(str).format('HH:mm')}
                          stroke="#52525b"
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis stroke="#52525b" tick={{ fontSize: 12 }} domain={[0, 100]} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#ededed' }}
                          itemStyle={{ color: '#ededed' }}
                          labelFormatter={(label) => dayjs(label).format('YYYY-MM-DD HH:mm:ss')}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="cpu_usage" 
                          stroke="#3b82f6" 
                          fillOpacity={1} 
                          fill="url(#colorCpu)" 
                          strokeWidth={2}
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* RAM Chart */}
                <div className="bg-surface p-4 rounded-lg border border-border">
                  <h4 className="text-sm font-medium mb-4 text-secondary">RAM Usage</h4>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.metrics}>
                        <defs>
                          <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis 
                          dataKey="createdAt" 
                          tickFormatter={(str) => dayjs(str).format('HH:mm')}
                          stroke="#52525b"
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis stroke="#52525b" tick={{ fontSize: 12 }} domain={[0, 100]} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#ededed' }}
                          itemStyle={{ color: '#ededed' }}
                          labelFormatter={(label) => dayjs(label).format('YYYY-MM-DD HH:mm:ss')}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="ram_usage" 
                          stroke="#8b5cf6" 
                          fillOpacity={1} 
                          fill="url(#colorRam)" 
                          strokeWidth={2}
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </section>
          </div>
        ) : null}
      </Drawer>

      <Modal
        title="Edit Node Remark"
        open={isModalOpen}
        onOk={handleSaveRemark}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={updating}
        centered
      >
        <p className="mb-2 text-secondary">Set a custom name for this node:</p>
        <Input 
          placeholder="Enter remark name" 
          value={remarkInput} 
          onChange={(e) => setRemarkInput(e.target.value)}
          onPressEnter={handleSaveRemark}
        />
      </Modal>
    </>
  );
};

export default DetailDrawer;
