export interface Server {
  id: number;
  uuid: string;
  name: string;
  remark?: string;
  os_info: string;
  client_ip: string;
  cpu_cores: number;
  ram_total: number;
  status: number; // 0: Offline, 1: Online
  last_seen: string;
  uptime: number;
  latest_metric?: Metric;
}

export interface Metric {
  id: number;
  server_id: number;
  cpu_usage: number;
  ram_usage: number;
  disk_usage: number;
  net_in_rate: number;
  net_out_rate: number;
  load_1: number;
  load_5: number;
  load_15: number;
  createdAt: string;
}

export interface ServerDetail {
  server: Server;
  metrics: Metric[];
}

export interface CreateNodeRequest {
  uuid: string;
  secret: string;
  name?: string;
}
