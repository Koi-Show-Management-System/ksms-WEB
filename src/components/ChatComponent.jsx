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
      console.log("Đã gọi fetchUserInfo với userId:", userId);
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
    console.log("infoUser hiện tại:", infoUser);
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "linear-gradient(to bottom, #f8f9fa, #e9ecef)",
        borderRadius: "12px",
        overflow: "hidden",
      }}
      className="chat-component"
    >
      {/* Messages header */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #eaeaea",
          background: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Badge status="processing" color="#52c41a" />
          <Text strong>Chat trực tiếp</Text>
        </div>
        <Tooltip title="Chat với người xem">
          <InfoCircleOutlined style={{ color: "#8c8c8c" }} />
        </Tooltip>
      </div>

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        style={{
          flexGrow: 1,
          overflowY: "auto",
          padding: "16px",
          backgroundColor: "rgba(255,255,255,0.7)",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23dddddd' fill-opacity='0.2' fill-rule='evenodd'/%3E%3C/svg%3E\")",
        }}
        className="messages-container"
      >
        {messages.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "20px",
              color: "#999",
              marginTop: "30%",
            }}
            className="empty-messages"
          >
            <CommentOutlined style={{ fontSize: "32px" }} />
            <p>Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</p>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((msg, index) => {
              const isCurrentUser = msg.user?.id === userId;
              return (
                <div
                  key={msg.id}
                  style={{
                    marginBottom: "16px",
                    display: "flex",
                    flexDirection: isCurrentUser ? "row-reverse" : "row",
                    alignItems: "flex-end",
                    opacity: 1,
                    animation: "fadeInUp 0.3s ease-out",
                    transform: "translateY(0)",
                    transition: "all 0.3s ease-out",
                  }}
                  className={`message-item ${isCurrentUser ? "message-mine" : "message-other"}`}
                >
                  <Avatar
                    src={
                      msg.user?.image ||
                      `https://getstream.io/random_svg/?name=${encodeURIComponent(msg.user?.name || "User")}`
                    }
                    style={{
                      marginRight: isCurrentUser ? 0 : "12px",
                      marginLeft: isCurrentUser ? "12px" : 0,
                      flexShrink: 0,
                      border: isCurrentUser ? "2px solid #1677ff" : "none",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                    }}
                    size={40}
                    icon={<UserOutlined />}
                  />
                  <div style={{ maxWidth: "70%" }}>
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: "13px",
                        marginBottom: "4px",
                        color: isCurrentUser ? "#1677ff" : "#555",
                        textAlign: isCurrentUser ? "right" : "left",
                        paddingLeft: isCurrentUser ? 0 : "8px",
                        paddingRight: isCurrentUser ? "8px" : 0,
                      }}
                    >
                      {isCurrentUser
                        ? userName
                        : msg.user?.name || "Người dùng"}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isCurrentUser ? "flex-end" : "flex-start",
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: isCurrentUser
                            ? "linear-gradient(135deg, #1677ff 0%, #0e5cda 100%)"
                            : "linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)",
                          color: isCurrentUser ? "white" : "#333",
                          borderRadius: isCurrentUser
                            ? "18px 4px 18px 18px"
                            : "4px 18px 18px 18px",
                          padding: "12px 16px",
                          display: "inline-block",
                          maxWidth: "100%",
                          minWidth: "40px",
                          wordBreak: "normal",
                          wordWrap: "break-word",
                          whiteSpace: "pre-wrap",
                          boxShadow: isCurrentUser
                            ? "0 2px 8px rgba(22, 119, 255, 0.3)"
                            : "0 1px 4px rgba(0,0,0,0.05)",
                          position: "relative",
                          border: isCurrentUser
                            ? "none"
                            : "1px solid rgba(0,0,0,0.05)",
                          background: isCurrentUser ? "#1677ff" : "#f0f0f0",
                        }}
                        className={`message-bubble ${isCurrentUser ? "mine" : "other"}`}
                      >
                        {msg.text}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          marginTop: "4px",
                          color: "#999",
                          paddingLeft: isCurrentUser ? 0 : "8px",
                          paddingRight: isCurrentUser ? "8px" : 0,
                          textAlign: isCurrentUser ? "right" : "left",
                        }}
                        className="message-time"
                      >
                        {formatTime(msg.created_at)}
                      </div>
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
      <div
        style={{
          borderTop: "1px solid #e8e8e8",
          padding: "12px 16px",
          backgroundColor: "white",
          boxShadow: "0 -1px 3px rgba(0,0,0,0.05)",
        }}
        className="chat-input-area"
      >
        <Input.Group compact style={{ display: "flex" }}>
          <div style={{ display: "flex", width: "100%" }}>
            <Input
              style={{
                flex: 1,
                borderRadius: "30px 0 0 30px",
                padding: "8px 16px",
                boxShadow: "none",
                borderColor: "#d9d9d9",
                height: "46px",
              }}
              placeholder="Nhập tin nhắn..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              prefix={
                <SmileOutlined
                  style={{ color: "#bfbfbf", marginRight: "6px" }}
                />
              }
              className="chat-input"
              disabled={sending}
            />
            <Button
              type="primary"
              icon={sending ? <Spin size="small" /> : <SendOutlined />}
              onClick={sendMessage}
              style={{
                borderRadius: "0 30px 30px 0",
                height: "46px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "46px",
              }}
              disabled={sending || !newMessage.trim()}
              className="send-button"
            />
          </div>
        </Input.Group>
      </div>

      {/* CSS cho các hiệu ứng */}
      <style jsx="true">{`
        .message-item {
          transition: all 0.3s ease;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .message-bubble {
          transition: all 0.2s ease;
        }

        .message-bubble:hover {
          transform: scale(1.02);
        }

        .message-bubble.mine:hover {
          box-shadow: 0 4px 12px rgba(22, 119, 255, 0.4);
        }

        .message-bubble.other:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .chat-input {
          transition: all 0.3s ease;
        }

        .chat-input:focus {
          box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.2);
          border-color: #1677ff;
        }

        .send-button {
          transition: all 0.3s ease;
        }

        .send-button:hover:not(:disabled) {
          transform: scale(1.05);
        }

        .messages-container::-webkit-scrollbar {
          width: 6px;
        }

        .messages-container::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }

        .messages-container::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
        }

        .messages-container::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
};

export default ChatComponent;
