import React, { useState, useEffect, useRef } from 'react';
import { Card, Spin, Alert, Typography, Input, Button, List, Space, message } from 'antd';
import { SendOutlined, UserOutlined, EyeOutlined, PlayCircleOutlined } from '@ant-design/icons';
import axiosClient from '../../../config/axiosClient';
import { useLocation } from 'react-router-dom';
// Import GetStream.io SDK
import {
  StreamVideoClient
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
// Import Stream Chat SDK separately
import { StreamChat } from 'stream-chat';

const { Title, Text } = Typography;

function Livestream({showId}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [streamData, setStreamData] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const videoRef = useRef(null);
  const location = useLocation();
  const navigate = useLocation().pathname;
  const streamClientRef = useRef(null);
  const callRef = useRef(null);
  const chatClientRef = useRef(null);
  const channelRef = useRef(null);
  
  // Lấy streamId từ URL
  const searchParams = new URLSearchParams(location.search);
  const streamId = searchParams.get('streamId');
  
  useEffect(() => {
    const loadStream = async () => {
      if (!streamId) {
        setError('Không tìm thấy ID stream');
        setLoading(false);
        return;
      }
      
      try {
        // Bước 1: Lấy thông tin livestream từ API
        const response = await axiosClient.get(`/livestream/${streamId}`);
        
        if (!response?.data?.data) {
          throw new Error('Không nhận được dữ liệu livestream từ server');
        }
        
        const livestreamData = response.data.data;
        
        if (!livestreamData.isActive) {
          setStreamData({
            ...livestreamData,
            isLive: false
          });
          setLoading(false);
          return;
        }
        
        // Bước 2: Lấy token người xem từ API
        const tokenResponse = await axiosClient.get(`/livestream/viewer-token/${streamId}`);
        
        if (!tokenResponse?.data?.data) {
          throw new Error('Không nhận được token người xem từ server');
        }
        
        const viewerToken = tokenResponse.data.data;
        
        // Bước 3: Khởi tạo Stream.io Client
        const client = new StreamVideoClient({
          apiKey: livestreamData.apiKey,
          user: {
            id: `viewer_${localStorage.getItem('userId') || Date.now()}`,
            name: localStorage.getItem('username') || 'Khách',
            image: 'https://getstream.io/random_svg/?name=Viewer',
          },
          token: viewerToken,
        });
        
        // Bước 4: Kết nối đến phiên livestream với callId tương ứng
        const callId = `livestream_${streamId}`;
        const call = client.call('livestream', callId);
        await call.join({ create: false }); // Chỉ tham gia, không tạo mới
        
        // Thiết lập chat nếu có
        let channel = null;
        let chatClient = null;
        
        try {
          // Thiết lập chat (không bắt buộc)
          chatClient = new StreamChat(livestreamData.apiKey, viewerToken);
          await chatClient.connectUser({
            id: `viewer_${localStorage.getItem('userId') || Date.now()}`,
            name: localStorage.getItem('username') || 'Khách',
          }, viewerToken);
          
          // Kết nối vào kênh chat của livestream
          channel = chatClient.channel('livestream', callId, {
            name: livestreamData.title
          });
          
          await channel.watch();
          
          // Lắng nghe tin nhắn chat
          channel.on('message.new', event => {
            const newMsg = {
              id: event.message.id,
              user: event.user.name,
              content: event.message.text,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            
            setChatMessages(prev => [...prev, newMsg]);
          });
        } catch (chatError) {
          console.warn('Không thể kết nối chat:', chatError);
          // Không ảnh hưởng đến việc xem livestream
        }
        
        // Lắng nghe số người xem
        call.on('call.participant_joined', () => {
          setViewerCount(prev => prev + 1);
        });
        
        call.on('call.participant_left', () => {
          setViewerCount(prev => Math.max(0, prev - 1));
        });
        
        // Lưu references để sử dụng sau này
        streamClientRef.current = client;
        callRef.current = call;
        chatClientRef.current = chatClient;
        channelRef.current = channel;
        
        // Lưu thông tin vào state
        setStreamData({
          title: livestreamData.title,
          description: livestreamData.description,
          playbackUrl: livestreamData.playbackUrl,
          isLive: true,
          viewerCount: call.state.participants.length - 1 // Trừ người phát sóng
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Lỗi khi tải stream:', error);
        setError(error.message || 'Không thể tải stream. Vui lòng thử lại sau.');
        setLoading(false);
      }
    };
    
    loadStream();
    
    // Cleanup khi unmount
    return () => {
      // Đóng các kết nối
      if (callRef.current) {
        callRef.current.leave();
      }
      
      if (streamClientRef.current) {
        streamClientRef.current.disconnectUser();
      }
      
      if (channelRef.current) {
        channelRef.current.stopWatching();
      }
      
      if (chatClientRef.current) {
        chatClientRef.current.disconnectUser();
      }
    };
  }, [streamId]);
  
  // Gửi tin nhắn chat
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !channelRef.current) return;
    
    try {
      // Gửi tin nhắn tới GetStream.io chat
      await channelRef.current.sendMessage({
        text: newMessage,
      });
      
      // Không cần thêm tin nhắn vào state, vì sẽ nhận được sự kiện message.new
      setNewMessage('');
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error);
      message.error('Không thể gửi tin nhắn.');
    }
  };

  // Hàm để chuyển đến trang tạo livestream
  const handleCreateLivestream = () => {
    // Lấy koiShowId từ URL hiện tại (giả sử URL có dạng /koishow/:id/livestream)
    const pathSegments = location.pathname.split('/');
    // let koiShowId = null;
    
    // Tìm id của koishow trong URL
    for (let i = 0; i < pathSegments.length; i++) {
      if (pathSegments[i] === 'koishow' && i + 1 < pathSegments.length) {
        showId = pathSegments[i + 1];
        break;
      }
    }
    
    if (showId) {
      // Chuyển hướng đến trang tạo livestream với koiShowId
      window.location.href = `/staff/koishow/${showId}/livestream/create`;
    } else {
      // Nếu không tìm thấy koiShowId, hiển thị thông báo lỗi
      message.error('Không thể xác định ID triển lãm cá Koi. Vui lòng thử lại.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <Card style={{ width: 400 }}>
          <div className="text-center">
            <Spin size="large" />
            <p className="mt-4">Đang tải livestream...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center h-screen bg-gray-100 p-4">
        <div className="w-full max-w-4xl mb-4 flex justify-between items-center">
          <div>
            <Title level={3}>Livestream</Title>
          </div>
          <Button 
            type="primary" 
            icon={<PlayCircleOutlined />} 
            onClick={handleCreateLivestream}
          >
            Tạo Livestream Mới
          </Button>
        </div>
        
        <Card style={{ width: '100%', maxWidth: '800px' }}>
          <Alert
            message="Lỗi"
            description={error}
            type="error"
            showIcon
          />
        </Card>
      </div>
    );
  }

  if (!streamData?.isLive) {
    return (
      <div className="flex flex-col items-center h-screen bg-gray-100 p-4">
        <div className="w-full max-w-4xl mb-4 flex justify-between items-center">
          <div>
            <Title level={3}>Livestream</Title>
          </div>
          <Button 
            type="primary" 
            icon={<PlayCircleOutlined />} 
            onClick={handleCreateLivestream}
          >
            Tạo Livestream Mới
          </Button>
        </div>
        
        <Card style={{ width: '100%', maxWidth: '800px' }}>
          <Alert
            message="Thông báo"
            description="Livestream này hiện không hoạt động hoặc đã kết thúc. Bạn có thể tạo phiên livestream mới."
            type="info"
            showIcon
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="w-full mb-4 flex justify-between items-center">
        <Title level={3}>{streamData.title}</Title>
        <Button 
          type="primary" 
          icon={<PlayCircleOutlined />} 
          onClick={handleCreateLivestream}
        >
          Tạo Livestream Mới
        </Button>
      </div>
      
      <Card className="mb-4">
        <Space>
          <EyeOutlined /> <Text>{viewerCount} người xem</Text>
        </Space>
        <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
          {streamData.description}
        </Text>
      </Card>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-2/3">
          <Card>
            <div className="bg-black rounded overflow-hidden" style={{ aspectRatio: '16/9' }}>
              <video
                ref={videoRef}
                className="w-full h-full"
                controls
                autoPlay
                poster="/path/to/placeholder-image.jpg"
              >
                <source src={streamData.playbackUrl} type="application/x-mpegURL" />
                Trình duyệt của bạn không hỗ trợ thẻ video.
              </video>
            </div>
          </Card>
        </div>
        
        <div className="w-full md:w-1/3">
          <Card title={`Chat (${chatMessages.length})`} style={{ height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 40px)' }}>
              <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: 16 }}>
                <List
                  dataSource={chatMessages}
                  renderItem={item => (
                    <List.Item key={item.id}>
                      <Space>
                        <UserOutlined />
                        <Text strong>{item.user}:</Text>
                        <Text>{item.content}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{item.timestamp}</Text>
                      </Space>
                    </List.Item>
                  )}
                />
              </div>
              
              <div>
                <Input.Group compact>
                  <Input
                    style={{ width: 'calc(100% - 40px)' }}
                    placeholder="Nhập tin nhắn..."
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onPressEnter={handleSendMessage}
                  />
                  <Button 
                    type="primary" 
                    icon={<SendOutlined />}
                    onClick={handleSendMessage}
                  />
                </Input.Group>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Livestream;