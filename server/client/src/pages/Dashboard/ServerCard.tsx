import React from 'react';
import { Server } from '@/types';
import { Activity, Cpu, HardDrive, Network } from 'lucide-react';
import clsx from 'clsx';

interface ServerCardProps {
  server: Server;
  onClick: () => void;
}

const ServerCard: React.FC<ServerCardProps> = ({ server, onClick }) => {
  const isOnline = server.status === 1;
  const metric = server.latest_metric;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div 
      onClick={onClick}
      className="bg-surface border border-border rounded-lg p-5 cursor-pointer hover:border-primary/50 transition-all duration-300 group relative overflow-hidden"
    >
      {/* Status Indicator */}
      <div className={clsx(
        "absolute top-0 right-0 w-2 h-2 m-4 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]",
        isOnline ? "bg-success shadow-success/50" : "bg-danger shadow-danger/50"
      )} />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-background rounded-md border border-border">
           <Activity size={20} className={isOnline ? "text-success" : "text-danger"} />
        </div>
        <div>
          <h3 className="font-semibold text-primary text-lg truncate max-w-[150px]" title={server.name}>{server.name}</h3>
          <p className="text-xs text-secondary truncate max-w-[150px]" title={server.os_info}>{server.os_info}</p>
        </div>
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
              className="h-full bg-primary transition-all duration-500" 
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
              className="h-full bg-primary transition-all duration-500" 
              style={{ width: `${metric?.ram_usage || 0}%` }}
            />
          </div>
          <p className="text-right font-mono text-xs">{metric?.ram_usage?.toFixed(1) || 0}%</p>
        </div>

        {/* Disk */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-secondary">
            <HardDrive size={14} />
            <span>Disk</span>
          </div>
           <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
            <div 
              className="h-full bg-secondary transition-all duration-500" 
              style={{ width: `${metric?.disk_usage || 0}%` }}
            />
          </div>
          <p className="text-right font-mono text-xs">{metric?.disk_usage?.toFixed(1) || 0}%</p>
        </div>

        {/* Network */}
        <div className="space-y-1">
           <div className="flex items-center gap-1.5 text-secondary">
            <Network size={14} />
            <span>Net</span>
          </div>
          <div className="flex justify-between items-end">
             <span className="text-[10px] text-secondary">↓</span>
             <span className="font-mono text-xs">{formatBytes(metric?.net_in_rate || 0)}/s</span>
          </div>
           <div className="flex justify-between items-end">
             <span className="text-[10px] text-secondary">↑</span>
             <span className="font-mono text-xs">{formatBytes(metric?.net_out_rate || 0)}/s</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerCard;
