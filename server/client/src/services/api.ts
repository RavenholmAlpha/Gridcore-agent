import axios from 'axios';
import { Server, ServerDetail, CreateNodeRequest } from '../types';

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

export const createNode = async (data: CreateNodeRequest): Promise<Server> => {
  const response = await api.post<{ data: Server }>('/nodes', data);
  return response.data.data;
};

export const deleteNode = async (id: number): Promise<void> => {
  await api.delete(`/nodes/${id}`);
};

export const verifySecret = async (password: string): Promise<boolean> => {
  try {
    const response = await api.post('/verify-secret', { password });
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

export const updateRemark = async (id: number, remark: string) => {
  const response = await api.put(`/nodes/${id}/remark`, { remark });
  return response.data;
};
