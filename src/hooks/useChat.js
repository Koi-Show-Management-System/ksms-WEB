import { useState, useCallback, useEffect, useRef } from "react";
import { StreamChat } from "stream-chat";
import Cookies from "js-cookie";

// Tạo một biến singleton để lưu trữ client instance chung cho toàn ứng dụng
let sharedChatClient = null;
// Thời gian gần nhất các hàm được gọi
const lastFunctionCall = {
  initChat: 0,
  joinChannel: 0,
};
// Thời gian chờ tối thiểu giữa các lần gọi (3 giây)
const FUNCTION_CALL_COOLDOWN = 3000;

const useChat = () => {
  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Lưu trữ thông tin kết nối cuối
  const lastConnectionInfo = useRef({
    userId: null,
    livestreamId: null,
    channelId: null,
    connectionTime: 0,
  });

  // Hàm kiểm tra xem có thể gọi hàm hay không
  const canCallFunction = (functionName) => {
    const now = Date.now();
    const lastCall = lastFunctionCall[functionName] || 0;
    const canCall = now - lastCall >= FUNCTION_CALL_COOLDOWN;

    if (!canCall) {
      console.log(
        `Cần đợi ${Math.ceil((FUNCTION_CALL_COOLDOWN - (now - lastCall)) / 1000)} giây nữa trước khi gọi ${functionName} lại`
      );
    }

    return canCall;
  };

  // Hàm khởi tạo chat client
  const initChat = useCallback(async (params) => {
    if (!canCallFunction("initChat")) {
      console.log("Đang chờ cooldown cho initChat");
      return chatClient || sharedChatClient;
    }

    lastFunctionCall.initChat = Date.now();
    const { token, userId, userName } = params;

    if (!token || !userId) {
      console.error("initChat: Thiếu token hoặc userId");
      setError("Thiếu thông tin xác thực cho chat");
      return null;
    }

    // Kiểm tra nếu đã có kết nối với cùng userId
    if (sharedChatClient && sharedChatClient.userID === userId) {
      console.log("Sử dụng lại chat client hiện có cho user:", userId);
      setChatClient(sharedChatClient);
      return sharedChatClient;
    }

    // Nếu đã có client nhưng khác userId, ngắt kết nối trước
    if (sharedChatClient && sharedChatClient.userID !== userId) {
      try {
        console.log("Ngắt kết nối client cũ trước khi tạo mới");
        await sharedChatClient.disconnectUser();
        sharedChatClient = null;
      } catch (disconnectErr) {
        console.warn("Lỗi khi ngắt kết nối chat client cũ:", disconnectErr);
      }
    }

    setLoading(true);
    setError(null);

    try {
      // Sử dụng API key từ biến môi trường
      const apiKey = import.meta.env.VITE_GETSTREAM_API_KEY || "z87auffz2r8y";

      // Tạo chat client mới
      console.log(
        `Tạo chat client mới với API Key: ${apiKey} và userId: ${userId}`
      );
      const client = new StreamChat(apiKey);

      // Kết nối người dùng
      await client.connectUser(
        {
          id: userId,
          name: userName || "Người dùng",
        },
        token
      );

      console.log("Kết nối chat thành công cho user:", userId);

      // Lưu thông tin kết nối
      lastConnectionInfo.current = {
        userId,
        connectionTime: Date.now(),
      };

      // Lưu client vào biến singleton để sử dụng lại
      sharedChatClient = client;
      setChatClient(client);
      return client;
    } catch (err) {
      console.error("Lỗi khi khởi tạo chat:", err);
      setError(
        `Lỗi khi khởi tạo chat: ${
          err.message || "Không thể kết nối đến máy chủ chat"
        }`
      );
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Hàm tham gia kênh chat
  const joinChannel = useCallback(
    async (channelId, livestreamId) => {
      if (!canCallFunction("joinChannel")) {
        console.log("Đang chờ cooldown cho joinChannel");
        return channel;
      }

      lastFunctionCall.joinChannel = Date.now();

      if (!channelId || !livestreamId) {
        console.error("joinChannel: Thiếu channelId hoặc livestreamId");
        setError("Thiếu thông tin kênh chat");
        return null;
      }

      // Kiểm tra nếu đã kết nối đến cùng một kênh
      if (
        channel &&
        lastConnectionInfo.current.channelId === channelId &&
        lastConnectionInfo.current.livestreamId === livestreamId
      ) {
        console.log("Đã kết nối đến kênh này rồi:", channelId);
        return channel;
      }

      // Đảm bảo có chat client đã được khởi tạo
      const client = chatClient || sharedChatClient;
      if (!client) {
        console.error("joinChannel: Chat client chưa được khởi tạo");
        setError("Chat client chưa được khởi tạo");
        return null;
      }

      // Đảm bảo client đã kết nối
      if (!isClientConnected()) {
        console.error("joinChannel: Chat client chưa kết nối");
        setError("Chat client chưa kết nối hoàn tất");
        return null;
      }

      setLoading(true);

      try {
        const channelName = `livestream-${livestreamId}`;
        console.log(`Tham gia kênh chat: ${channelId}, name: ${channelName}`);

        // Tạo/tham gia kênh chat
        const chatChannel = client.channel("livestream", channelId, {
          name: channelName,
          livestreamId: livestreamId,
        });

        // Theo dõi các sự kiện của kênh (không cần watch nếu đã kết nối)
        await chatChannel.watch();

        // Lưu thông tin kênh đã kết nối
        lastConnectionInfo.current = {
          ...lastConnectionInfo.current,
          channelId,
          livestreamId,
        };

        setChannel(chatChannel);
        return chatChannel;
      } catch (err) {
        console.error("Lỗi khi tham gia kênh chat:", err);
        setError(
          `Lỗi khi tham gia kênh chat: ${
            err.message || "Không thể tham gia kênh chat"
          }`
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [chatClient]
  );

  // Kiểm tra client đã kết nối đầy đủ chưa
  const isClientConnected = useCallback(() => {
    const client = chatClient || sharedChatClient;
    if (!client) return false;

    // Kiểm tra xem client có đang kết nối hoàn tất
    const isConnected =
      client.userID &&
      client.connectionID &&
      client.wsConnection &&
      client.wsConnection.isConnected;

    return !!isConnected;
  }, [chatClient]);

  // Hàm ngắt kết nối chat
  const disconnectChat = useCallback(async () => {
    // Ngắt kết nối kênh nếu có
    if (channel) {
      try {
        await channel.stopWatching();
      } catch (channelError) {
        console.warn("Lỗi khi ngừng theo dõi kênh:", channelError);
      }
      setChannel(null);
    }

    // Chỉ ngắt kết nối client nếu có sự khác biệt và cần thiết
    // Không ngắt kết nối sharedChatClient để tái sử dụng
    const client = chatClient;
    if (client && client !== sharedChatClient) {
      try {
        await client.disconnectUser();
        console.log("Đã ngắt kết nối chat client");
      } catch (err) {
        console.warn("Lỗi khi ngắt kết nối chat client:", err);
      }
    }

    // Reset state
    setChatClient(null);
    setError(null);
  }, [channel, chatClient]);

  // Làm sạch khi component unmount
  useEffect(() => {
    return () => {
      // Chỉ làm sạch khi cần thiết, không ngắt kết nối sharedChatClient
      if (channel) {
        channel.stopWatching().catch((err) => {
          console.warn("Lỗi khi dọn dẹp kênh:", err);
        });
      }
    };
  }, [channel]);

  return {
    chatClient,
    channel,
    loading,
    error,
    initChat,
    joinChannel,
    isClientConnected,
    disconnectChat,
  };
};

export default useChat;
