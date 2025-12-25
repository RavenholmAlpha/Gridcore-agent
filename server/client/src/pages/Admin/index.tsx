import React, { useEffect, useState } from 'react';
import { getServers, createNode, deleteNode, verifySecret } from '@/services/api';
import { Server } from '@/types';
import ServerCard from '../Dashboard/ServerCard';
import { Layout, Spin, Empty, Button, Modal, Form, Input, App, Card } from 'antd';
import { PlusOutlined, LockOutlined, ArrowLeftOutlined } from '@ant-design/icons';

const { Header, Content } = Layout;

interface AdminProps {
  onServerSelect: (id: number) => void;
  onBack: () => void;
}

const Admin: React.FC<AdminProps> = ({ onServerSelect, onBack }) => {
  const { message } = App.useApp();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);

  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const handleLogin = async () => {
    if (!password) return;
    setVerifying(true);
    const valid = await verifySecret(password);
    setVerifying(false);
    if (valid) {
      setIsAuthenticated(true);
      message.success('Login successful');
      fetchData();
    } else {
      message.error('Invalid password');
    }
  };

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
    if (isAuthenticated) {
      fetchData();
      const interval = setInterval(fetchData, 3000); // Poll every 3s
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleCreateNode = async (values: any) => {
    try {
      await createNode(values);
      message.success('Node created successfully');
      setIsModalOpen(false);
      form.resetFields();
      fetchData(); // Refresh list
    } catch (error: any) {
      if (error.response?.status === 409) {
        message.error('Node with this UUID already exists');
      } else {
        message.error('Failed to create node');
      }
    }
  };

  const handleDeleteNode = async (id: number) => {
    try {
      await deleteNode(id);
      message.success('Node deleted successfully');
      fetchData(); // Refresh list
    } catch (error) {
      message.error('Failed to delete node');
    }
  };

  if (!isAuthenticated) {
    return (
      <Layout className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-surface border-border">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-primary">Admin Login</h1>
            <p className="text-secondary">Please enter the secret key to manage nodes</p>
          </div>
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Enter secret key"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onPressEnter={handleLogin}
            className="mb-4"
          />
          <div className="flex gap-4">
            <Button block onClick={onBack}>Back to Dashboard</Button>
            <Button type="primary" block onClick={handleLogin} loading={verifying}>
              Login
            </Button>
          </div>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout className="min-h-screen bg-background">
      <Header className="bg-background/50 backdrop-blur-md border-b border-border px-8 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
            <Button icon={<ArrowLeftOutlined />} onClick={onBack} type="text" className="text-primary" />
            <h1 className="text-xl font-bold tracking-widest text-primary m-0">GRIDCORE ADMIN</h1>
        </div>
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 text-sm text-secondary mr-4">
                <span>Online: <span className="text-success">{servers.filter(s => s.status === 1).length}</span></span>
                <span>Total: <span className="text-primary">{servers.length}</span></span>
            </div>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => setIsModalOpen(true)}
              className="bg-primary hover:bg-primary/90"
            >
              Add Node
            </Button>
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
                onDelete={handleDeleteNode}
              />
            ))}
          </div>
        )}

        <Modal
          title="Add New Node"
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          footer={null}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCreateNode}
          >
            <Form.Item
              name="name"
              label="Node Name"
              rules={[{ required: true, message: 'Please input node name!' }]}
            >
              <Input placeholder="e.g. Production Server 1" />
            </Form.Item>
            
            <Form.Item
              name="uuid"
              label="UUID"
              rules={[{ required: true, message: 'Please input UUID!' }]}
              extra={<Button type="link" size="small" onClick={() => form.setFieldValue('uuid', crypto.randomUUID())} className="p-0">Generate UUID</Button>}
            >
              <Input placeholder="Enter UUID or generate one" />
            </Form.Item>

            <Form.Item
              name="secret"
              label="Secret Key"
              rules={[{ required: true, message: 'Please input secret key!' }]}
              extra={<Button type="link" size="small" onClick={() => form.setFieldValue('secret', Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10))} className="p-0">Generate Secret</Button>}
            >
              <Input.Password placeholder="Enter a strong secret key" />
            </Form.Item>

            <Form.Item className="mb-0 flex justify-end">
              <div className="flex justify-end gap-2">
                <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="primary" htmlType="submit">Create Node</Button>
              </div>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};

export default Admin;
