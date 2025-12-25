import React, { useState } from 'react';
import { Server } from '@/types';
import { Cpu, HardDrive, Trash2, Edit2 } from 'lucide-react';
import { Popconfirm, Button, Modal, Input, message } from 'antd';
import { WindowsOutlined, AppleOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { updateRemark } from '@/services/api';
import clsx from 'clsx';

// Simple Tux Icon for Linux
const TuxIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" style={{ display: 'inline-block' }}>
    <path d="M12 0c-3.31 0-6 2.69-6 6 0 1.25.38 2.41 1.03 3.38-.45.54-.84 1.15-1.14 1.82C3.62 10.95 2 13.25 2 16c0 3.31 2.69 6 6 6h8c3.31 0 6-2.69 6-6 0-2.75-1.62-5.05-3.89-4.8-.3-.67-.69-1.28-1.14-1.82.65-.97 1.03-2.13 1.03-3.38 0-3.31-2.69-6-6-6zM9.5 3.5c.83 0 1.5.67 1.5 1.5S10.33 6.5 9.5 6.5 8 5.83 8 5 8.67 3.5 9.5 3.5zm5 0c.83 0 1.5.67 1.5 1.5S15.33 6.5 14.5 6.5 13 5.83 13 5 13.67 3.5 14.5 3.5zM12 8c1.66 0 3 1.34 3 3v5h-6v-5c0-1.66 1.34-3 3-3z"/>
  </svg>
);

interface ServerCardProps {
  server: Server;
  onClick: () => void;
  onDelete?: (id: number) => void;
  onUpdate?: () => void;
  editable?: boolean;
}

const ServerCard: React.FC<ServerCardProps> = ({ server, onClick, onDelete, onUpdate, editable = false }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [remarkInput, setRemarkInput] = useState('');
  const [loading, setLoading] = useState(false);

  const isOnline = server.status === 1;
  const metric = server.latest_metric;

  // OS Icon Helper
  const getOSIcon = (osInfo: string) => {
    if (!osInfo) return <QuestionCircleOutlined className="text-xl" />;
    const lower = osInfo.toLowerCase();
    if (lower.includes('windows')) return <WindowsOutlined className="text-xl text-[#0078D6]" />;
    if (lower.includes('mac') || lower.includes('darwin')) return <AppleOutlined className="text-xl text-white" />;
    if (lower.includes('linux') || lower.includes('ubuntu') || lower.includes('debian') || lower.includes('centos')) {
      return <span className="text-white"><TuxIcon /></span>;
    }
    return <QuestionCircleOutlined className="text-xl" />;
  };

  // Progress Color Helper
  const getProgressColor = (percent: number, type: 'cpu' | 'ram' | 'disk') => {
    let threshold = 90;
    if (type === 'cpu') threshold = 95;
    if (type === 'ram') threshold = 90;
    if (type === 'disk') threshold = 90;

    return percent > threshold ? 'bg-danger' : 'bg-primary';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleEditRemark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRemarkInput(server.remark || '');
    setIsModalOpen(true);
  };

  const handleSaveRemark = async () => {
    setLoading(true);
    try {
      await updateRemark(server.id, remarkInput);
      message.success('Remark updated');
      setIsModalOpen(false);
      onUpdate?.();
    } catch (error) {
      message.error('Failed to update remark');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div 
        onClick={onClick}
        className="bg-surface border border-border rounded-lg p-5 cursor-pointer hover:border-primary/50 transition-all duration-300 group relative overflow-hidden"
      >
        {/* Delete Button */}
        {onDelete && (
          <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" onClick={handleDelete}>
            <Popconfirm
              title="Delete Node"
              description="Are you sure to delete this node?"
              onConfirm={(e) => {
                e?.stopPropagation();
                onDelete(server.id);
              }}
              onCancel={(e) => e?.stopPropagation()}
              okText="Yes"
              cancelText="No"
            >
              <Button 
                type="text" 
                danger 
                icon={<Trash2 size={16} />} 
                size="small"
                className="flex items-center justify-center"
              />
            </Popconfirm>
          </div>
        )}

        {/* Status Indicator */}
        <div className={clsx(
          "absolute top-0 right-0 w-2 h-2 m-4 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]",
          isOnline ? "bg-success shadow-success/50" : "bg-danger shadow-danger/50"
        )} />

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-background rounded-md border border-border flex items-center justify-center w-10 h-10">
             {getOSIcon(server.os_info)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-primary text-lg truncate" title={server.remark || server.name}>
                {server.remark || server.name}
              </h3>
              {editable && (
                <Button 
                  type="text" 
                  size="small" 
                  icon={<Edit2 size={12} />} 
                  className="text-secondary hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity p-0 h-auto"
                  onClick={handleEditRemark}
                />
              )}
            </div>
            {/* If remark exists, show original name as subtitle. Else show OS info or nothing. User said "machine's own name in small characters" */}
            <p className="text-xs text-secondary truncate" title={server.name}>
              {server.remark ? server.name : server.os_info}
            </p>
          </div>
        </div>

        {/* System Specs (Cores / RAM) */}
        <div className="flex items-center justify-between text-xs text-secondary mb-4 px-1">
          <span>{server.cpu_cores ? `${server.cpu_cores} Cores` : '-'}</span>
          <span>{server.ram_total ? formatBytes(server.ram_total) : '-'}</span>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {/* CPU */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-secondary">
              <Cpu size={14} />
              <span>CPU</span>
            </div>
            <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
              <div 
                className={clsx("h-full transition-all duration-500", getProgressColor(metric?.cpu_usage || 0, 'cpu'))}
                style={{ width: `${metric?.cpu_usage || 0}%` }}
              />
            </div>
            <p className="text-right font-mono text-xs">{metric?.cpu_usage?.toFixed(1) || 0}%</p>
          </div>

          {/* RAM */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-secondary">
              <div className="w-3.5 h-3.5 border border-current rounded-[2px]" />
              <span>RAM</span>
            </div>
            <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
              <div 
                className={clsx("h-full transition-all duration-500", getProgressColor((metric?.ram_usage || 0), 'ram'))}
                style={{ width: `${metric?.ram_usage || 0}%` }}
              />
            </div>
            <p className="text-right font-mono text-xs">{metric?.ram_usage?.toFixed(1) || 0}%</p>
          </div>
          
          {/* Disk (If available in metric, assuming disk_usage is there) */}
           {/* If you want to show Disk usage as well, add it. The user asked for "Disk > 90% red". */}
           {/* The original card didn't show Disk, but metric has it. I'll add a small row or just keep 2 cols and add disk below? */}
           {/* Layout is grid-cols-2. I'll add Disk below CPU/RAM or make it 3 cols? 2 cols is tight. */}
           {/* I'll add a third item for Disk spanning full width or just squeeze it in. */}
           {/* Let's just add it below. */}
        </div>
        
        {/* Disk Usage (Added per request) */}
        <div className="space-y-1 mt-3">
            <div className="flex items-center gap-1.5 text-secondary">
              <HardDrive size={14} />
              <span>Disk</span>
            </div>
            <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
              <div 
                className={clsx("h-full transition-all duration-500", getProgressColor((metric?.disk_usage || 0), 'disk'))}
                style={{ width: `${metric?.disk_usage || 0}%` }}
              />
            </div>
            <p className="text-right font-mono text-xs">{metric?.disk_usage?.toFixed(1) || 0}%</p>
        </div>

      </div>

      {/* Edit Remark Modal */}
      <Modal
        title="Edit Node Remark"
        open={isModalOpen}
        onOk={handleSaveRemark}
        onCancel={(e) => { e.stopPropagation(); setIsModalOpen(false); }}
        confirmLoading={loading}
        centered
      >
        <div onClick={(e) => e.stopPropagation()}>
          <p className="mb-2 text-secondary">Set a custom name for this node:</p>
          <Input 
            placeholder="Enter remark name" 
            value={remarkInput} 
            onChange={(e) => setRemarkInput(e.target.value)}
            onPressEnter={handleSaveRemark}
          />
        </div>
      </Modal>
    </>
  );
};

export default ServerCard;
