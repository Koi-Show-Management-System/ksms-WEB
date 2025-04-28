import React, { useState, useEffect, useRef } from "react";
import {
  Typography,
  Flex,
  Avatar,
  Input,
  Button,
  Empty,
  Space,
  message,
  Spin,
  Badge,
  Tooltip,
} from "antd";
import {
  CommentOutlined,
  SendOutlined,
  SmileOutlined,
  InfoCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import useAuth from "../hooks/useAuth";
import Cookies from "js-cookie";

const { Text } = Typography;

const ChatComponent = ({ channel, chatClient }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const userId = Cookies.get("__id");
  // Sử dụng tên "Host" cho người phát sóng
  const userName = "Host";

  const { fetchUserInfo, infoUser } = useAuth();

  useEffect(() => {
    if (!channel) return;

    // Lấy userId từ cookie và gọi fetchUserInfo với userId
    const userId = Cookies.get("__id");
    if (userId) {
      fetchUserInfo(userId);
    }

    // Load existing messages
    const loadMessages = async () => {
      try {
        const response = await channel.query({ messages: { limit: 50 } });
        if (response.messages) {
          setMessages(response.messages);
        }
      } catch (error) {
        console.error("Error loading messages:", error);
      }
    };

    loadMessages();

    // Listen for new messages
    const handleNewMessage = (event) => {
      console.log("Tin nhắn mới:", event.message);
      console.log("Avatar trong tin nhắn:", event.message.user?.image);
      setMessages((prevMessages) => [...prevMessages, event.message]);
    };

    channel.on("message.new", handleNewMessage);

    // Cleanup
    return () => {
      channel.off("message.new", handleNewMessage);
    };
  }, [channel]);

  // Thêm useEffect để log khi infoUser thay đổi
  useEffect(() => {
  }, [infoUser]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !channel) return;

    try {
      setSending(true);
      await channel.sendMessage({
        text: newMessage,
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      message.error("Không thể gửi tin nhắn");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl overflow-hidden relative">
      {/* Messages header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm h-14">
        <div className="flex items-center gap-2">
          <Badge status="processing" color="#52c41a" />
          <Text strong>Chat trực tiếp</Text>
        </div>
        <Tooltip title="Chat với người xem">
          <InfoCircleOutlined className="text-gray-500" />
        </Tooltip>
      </div>

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 bg-white/70 isolate"
        style={{
          maxHeight: "450px",
          height: "450px",
          scrollbarWidth: "thin",
          scrollbarColor: "#e0e0e0 transparent",
        }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <CommentOutlined className="text-3xl mb-2" />
            <p>Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => {
              const isCurrentUser = msg.user?.id === userId;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isCurrentUser ? "flex-row-reverse" : "flex-row"} items-end gap-2 message-item`}
                  style={{ minHeight: "80px" }}
                >
                  <Avatar
                    src={
                      msg.user?.image ||
                      `https://getstream.io/random_svg/?name=${encodeURIComponent(msg.user?.name || "User")}`
                    }
                    className={`flex-shrink-0 ${isCurrentUser ? "ml-2" : "mr-2"} ${
                      isCurrentUser ? "border-2 border-blue-500" : ""
                    } shadow-md`}
                    size={40}
                    icon={<UserOutlined />}
                  />
                  <div className="max-w-[70%] space-y-1">
                    <div
                      className={`text-xs font-semibold ${
                        isCurrentUser
                          ? "text-blue-500 text-right"
                          : "text-gray-700"
                      }`}
                    >
                      {isCurrentUser
                        ? userName
                        : msg.user?.name || "Người dùng"}
                    </div>
                    <div className="flex flex-col">
                      <div
                        className={`inline-block px-4 py-2 rounded-2xl ${
                          isCurrentUser
                            ? "bg-blue-500 text-white rounded-br-sm"
                            : "bg-gray-100 text-gray-800 rounded-bl-sm"
                        } shadow-sm`}
                      >
                        {msg.text}
                      </div>
                      <span
                        className={`text-xs text-gray-500 mt-1 ${
                          isCurrentUser ? "text-right" : "text-left"
                        }`}
                      >
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="px-4 py-3 bg-white border-t border-gray-200 shadow-sm">
        <Input.Group compact className="flex">
          <div className="flex w-full">
            <Input
              className="flex-1 rounded-l-full border-gray-300 hover:border-blue-500 focus:border-blue-500 focus:shadow-none"
              style={{
                height: "46px",
                paddingLeft: "1rem",
              }}
              placeholder="Nhập tin nhắn..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              prefix={<SmileOutlined className="text-gray-400 mr-2" />}
              disabled={sending}
            />
            <Button
              type="primary"
              icon={sending ? <Spin size="small" /> : <SendOutlined />}
              onClick={sendMessage}
              className="rounded-r-full h-[46px] w-[46px] flex items-center justify-center"
              disabled={sending || !newMessage.trim()}
            />
          </div>
        </Input.Group>
      </div>
    </div>
  );
};

export default ChatComponent;
