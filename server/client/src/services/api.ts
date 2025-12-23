import axios from 'axios';
import { Server, ServerDetail } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const getServers = async (): Promise<Server[]> => {
  const response = await api.get<{ data: Server[] }>('/servers');
  return response.data.data;
};

export const getServerMetrics = async (id: number, range: string = '1h'): Promise<ServerDetail> => {
  const response = await api.get<{ data: ServerDetail }>(`/servers/${id}/metrics`, {
    params: { range },
  });
  return response.data.data;
};
