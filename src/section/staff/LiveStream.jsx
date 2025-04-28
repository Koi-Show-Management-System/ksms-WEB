import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import {
  Button,
  Card,
  Typography,
  Flex,
  Spin,
  message,
  Row,
  Col,
  Tag,
  Divider,
  Space,
  Avatar,
  Select,
  Empty,
  Input,
} from "antd";
import {
  StreamVideo,
  StreamCall,
  CallControls,
  DeviceSettings,
  LivestreamLayout,
  useCallStateHooks,
  StreamVideoClient,
  PaginatedGridLayout,
  SpeakerLayout,
  ParticipantView,
  CallingState,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { StreamChat } from "stream-chat";
import useLiveStream from "../../hooks/useLiveStream";
import { GetHostToken, StartLiveStream } from "../../api/liveStreamApi";
import Cookies from "js-cookie";
import {
  VideoCameraOutlined,
  AudioOutlined,
  CloseCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  SettingOutlined,
  UserOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  SyncOutlined,
  CommentOutlined,
  SendOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import useAuth from "../../hooks/useAuth";
import ChatComponent from "../../components/ChatComponent";
const { Title, Text } = Typography;

function LiveStream({ showId }) {
  const koiShowId = showId;
  const { createLiveStream, endLiveStream, liveStream, loading, error } =
    useLiveStream();
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);

  // Chat related states
  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);

  const { fetchUserInfo, infoUser } = useAuth();
  useEffect(() => {
    // Lấy userId từ cookie và gọi fetchUserInfo với userId
    const userId = Cookies.get("__id");
    if (userId) {
      fetchUserInfo(userId);
    }
  }, []);

  // Thêm useEffect để log khi infoUser thay đổi
  useEffect(() => {
  }, [infoUser]);

  const handleCreateLiveStream = async () => {
    if (!koiShowId) {
      message.error("Không tìm thấy ID cho koi show");
      return;
    }

    setLocalLoading(true);

    try {
      // Lấy userId trực tiếp từ cookies với key __id
      let userId = Cookies.get("__id");

      if (!userId) {
        console.warn("Không tìm thấy userId trong cookies");
        message.warning(
          "Không tìm thấy thông tin đăng nhập, vui lòng đăng nhập lại"
        );
        return;
      }

      console.log("Đã lấy userId từ cookies:", userId);

      // Gọi API backend để tạo livestream từ useLiveStream hook
      const result = await createLiveStream(koiShowId);

      if (!result || !result.data) {
        throw new Error(result?.message || "Không thể tạo livestream");
      }

      // API trả về thông tin cho GetStream SDK
      const { callId, id, token } = result.data;

      // Lưu livestream ID vào localStorage để có thể sử dụng sau này
      localStorage.setItem("currentLivestreamId", id);

      try {
        // Nếu token đã được trả về từ createLiveStream, sử dụng nó
        // Nếu không, gọi GetHostToken để lấy token mới
        let streamToken = token;

        if (!streamToken) {
          const tokenResponse = await GetHostToken(id);
          if (!tokenResponse?.data?.data?.token) {
            throw new Error("Không thể lấy token cho livestream");
          }
          streamToken = tokenResponse.data.data.token;
        }

        console.log("Host token:", streamToken);

        // Kiểm tra token để xem ID của nó là gì
        try {
          console.log("Phân tích token để kiểm tra ID...");

          // Nếu token là JWT, thử phân tích nó
          if (streamToken.split(".").length === 3) {
            const payload = JSON.parse(atob(streamToken.split(".")[1]));
            console.log("Payload từ token:", payload);

            // Nếu payload chứa user_id dạng chuỗi JSON
            if (payload.payload && typeof payload.payload === "string") {
              try {
                const tokenData = JSON.parse(payload.payload);
                console.log("ID người dùng từ token:", tokenData.user_id);

                if (tokenData.user_id !== userId) {
                  console.warn(
                    `ID không khớp: token có ID ${tokenData.user_id}, nhưng cookies có ID ${userId}`
                  );
                  // Ưu tiên sử dụng ID từ token
                  userId = tokenData.user_id;
                  console.log("Sử dụng ID từ token:", userId);
                }
              } catch (e) {
                console.error("Lỗi khi phân tích payload:", e);
              }
            }
          }
        } catch (e) {
          console.error("Lỗi khi phân tích token:", e);
        }

        // Sử dụng API key từ biến môi trường
        const apiKey = import.meta.env.VITE_GETSTREAM_API_KEY || "z87auffz2r8y";

        // Log thông tin người dùng trước khi kết nối
        console.log("Thông tin người dùng trước khi kết nối video:", {
          infoUser,
          avatar: infoUser?.data?.avatar,
        });

        // Khởi tạo client
        const videoClient = new StreamVideoClient({
          apiKey,
        });

        // Đảm bảo userId có đúng định dạng mà GetStream mong đợi
        const cleanUserId = userId.trim();
        console.log("ID người dùng đã làm sạch để kết nối:", cleanUserId);

        // Kết nối user với userId đã làm sạch
        await videoClient.connectUser(
          {
            id: cleanUserId,
            name: "Host",
            image: "https://getstream.io/random_svg/?name=Host",
          },
          streamToken
        );

        console.log("Đã kết nối người dùng thành công với ID:", cleanUserId);

        // Tạo đối tượng cuộc gọi
        const livestreamCall = videoClient.call("livestream", callId);

        // Tham gia cuộc gọi và tạo nếu chưa tồn tại
        await livestreamCall.join({ create: true });

        // Thiết lập chat
        try {
          console.log("Đang thiết lập chat cho livestream...");

          // Sử dụng API key từ biến môi trường
          const apiKey =
            import.meta.env.VITE_GETSTREAM_API_KEY || "z87auffz2r8y";

          // Tạo chat client
          const newChatClient = StreamChat.getInstance(apiKey);

          // Log thông tin người dùng trước khi kết nối chat
          console.log("Thông tin người dùng trước khi kết nối chat:", {
            infoUser,
            avatar: infoUser?.data?.avatar,
          });

          // Kết nối user với chat client
          await newChatClient.connectUser(
            {
              id: cleanUserId,
              name: "Host",
              image:
                infoUser?.data?.avatar ||
                `https://getstream.io/random_svg/?name=Host`,
            },
            streamToken // Sử dụng cùng token từ livestream
          );

          // Cập nhật thông tin người dùng để đảm bảo tên "Host" được lưu
          try {
            await newChatClient.upsertUser({
              id: cleanUserId,
              name: "Host",
              role: "admin",
              isHost: true,
              image:
                infoUser?.data?.avatar ||
                `https://getstream.io/random_svg/?name=Host`,
            });
            console.log("Đã cập nhật thông tin người dùng với tên 'Host'");
          } catch (updateError) {
            console.error(
              "Không thể cập nhật thông tin người dùng:",
              updateError
            );
          }

          // Tạo hoặc kết nối với channel
          const channelId = `livestream-${callId}`;
          const newChannel = newChatClient.channel("livestream", channelId, {
            name: `Chat for livestream`,
            members: [cleanUserId],
            // Thêm metadata để đánh dấu user là host
            hostUser: cleanUserId,
          });

          await newChannel.watch();

          setChatClient(newChatClient);
          setChannel(newChannel);
          console.log("Đã thiết lập chat thành công");
        } catch (chatError) {
          console.error("Lỗi khi thiết lập chat:", chatError);
          setChatError("Không thể thiết lập chat: " + chatError.message);
        }

        // Kiểm tra camera và microphone
        console.log("Danh sách thiết bị:", livestreamCall.devices);
        console.log(
          "Trạng thái camera trước khi bật:",
          livestreamCall.camera.state
        );

        // Tự động bật camera và microphone khi tham gia cuộc gọi
        try {
          // Kiểm tra xem camera có sẵn sàng không trước khi bật
          const devices = await livestreamCall.camera.listInputDevices();
          console.log("Danh sách camera:", devices);

          if (devices && devices.length > 0) {
            try {
              // Kiểm tra xem có camera ưa thích không
              const preferredCameraId =
                localStorage.getItem("preferredCameraId");

              if (
                preferredCameraId &&
                devices.some((d) => d.deviceId === preferredCameraId)
              ) {
                // Sử dụng camera ưa thích
                console.log("Đang sử dụng camera ưa thích:", preferredCameraId);
                await livestreamCall.camera.enable(preferredCameraId);
              } else {
                // Sử dụng camera mặc định
                await livestreamCall.camera.enable();
              }

              console.log("Đã bật camera tự động", livestreamCall.camera.state);
            } catch (cameraError) {
              console.error("Không thể bật camera:", cameraError);

              // Hiển thị thông báo chi tiết về lỗi camera
            }
          } else {
            message.warning(
              "Không tìm thấy thiết bị camera nào trên máy tính của bạn"
            );
          }

          // Bật microphone
          try {
            await livestreamCall.microphone.enable();
            console.log(
              "Đã bật microphone tự động",
              livestreamCall.microphone.state
            );
          } catch (micError) {
            console.error("Không thể bật microphone:", micError);
            message.warning(
              "Không thể bật microphone, nhưng bạn vẫn có thể tiếp tục livestream"
            );
          }
        } catch (mediaError) {
          console.error("Lỗi thiết bị media:", mediaError);
        }

        setClient(videoClient);
        setCall(livestreamCall);

        message.success(result.message || "Đã tạo livestream thành công!");
      } catch (streamError) {
        console.error("Lỗi kết nối với GetStream:", streamError);
        message.error("Lỗi kết nối với GetStream: " + streamError.message);
      }
    } catch (err) {
      console.error("Lỗi khi tạo livestream:", err);
      message.error(
        "Không thể tạo livestream: " + (err.message || "Lỗi không xác định")
      );
    } finally {
      setLocalLoading(false);
    }
  };

  const handleEndLiveStream = async () => {
    if (!call || !client) return;

    try {
      setLocalLoading(true);

      // Kết thúc cuộc gọi trên GetStream
      if (call.state.isLive) {
        await call.stopLive();
      }
      await call.leave();

      // Đóng kết nối chat
      if (chatClient) {
        try {
          console.log("Đang ngắt kết nối chat...");
          await chatClient.disconnectUser();
          console.log("Đã ngắt kết nối chat thành công");
        } catch (chatError) {
          console.error("Lỗi khi ngắt kết nối chat:", chatError);
        }
        setChatClient(null);
        setChannel(null);
      }

      // Lấy livestream ID từ state hoặc localStorage
      const livestreamId =
        liveStream?.id || localStorage.getItem("currentLivestreamId");

      if (!livestreamId) {
        throw new Error("Không tìm thấy ID livestream");
      }

      // Ngắt kết nối người dùng
      try {
        await client.disconnectUser();
        console.log("Đã ngắt kết nối người dùng");
      } catch (disconnectError) {
        console.error("Lỗi khi ngắt kết nối:", disconnectError);
      }

      setClient(null);
      setCall(null);

      // Gọi API để kết thúc cuộc gọi sử dụng useLiveStream hook
      const success = await endLiveStream(livestreamId);

      if (success) {
        message.success("Đã kết thúc livestream");
        localStorage.removeItem("currentLivestreamId");
      }
    } catch (err) {
      console.error("Lỗi khi kết thúc livestream:", err);
      message.error(
        "Không thể kết thúc livestream: " +
          (err.message || "Lỗi không xác định")
      );

      // Cleanup ngay cả khi có lỗi
      if (client) {
        try {
          await client.disconnectUser();
        } catch (disconnectError) {
          console.error("Lỗi khi ngắt kết nối:", disconnectError);
        }
        setClient(null);
        setCall(null);
        setChatClient(null);
        setChannel(null);
      }
    } finally {
      setLocalLoading(false);
    }
  };

  // Custom component để hiển thị video người dùng
  const UserVideoPreview = () => {
    const { useLocalParticipant } = useCallStateHooks();
    const localParticipant = useLocalParticipant();
    const { useCameraState, useMicrophoneState, useIsCallLive } =
      useCallStateHooks();

    const { camera, isEnabled: isCamEnabled } = useCameraState();
    const { microphone, isEnabled: isMicEnabled } = useMicrophoneState();
    const isLive = useIsCallLive();

    if (!localParticipant) {
      return (
        <Flex
          align="center"
          justify="center"
          className="w-full h-full bg-gray-100 rounded-xl"
        >
          <Space direction="vertical" align="center">
            <Avatar size={80} icon={<UserOutlined />} />
            <Text>Không tìm thấy camera hoặc người dùng cục bộ</Text>
          </Space>
        </Flex>
      );
    }

    const handleCameraToggle = async () => {
      try {
        await camera.toggle();
      } catch (cameraError) {
        console.error("Lỗi khi bật/tắt camera:", cameraError);
        message.error(`Lỗi camera: ${cameraError.message}`);
      }
    };

    const handleMicToggle = async () => {
      try {
        await microphone.toggle();
      } catch (micError) {
        console.error("Lỗi khi bật/tắt microphone:", micError);
        message.error(`Lỗi microphone: ${micError.message}`);
      }
    };

    return (
      <div className="w-full h-full relative rounded-none overflow-hidden bg-black">
        <ParticipantView participant={localParticipant} />

        <div className="absolute top-4 left-4 py-1.5 px-3 bg-black/60 rounded-full backdrop-blur-sm shadow-lg">
          <Text className="text-white text-sm font-medium">
            <UserOutlined className="mr-1.5" /> Bạn (Host)
          </Text>
        </div>

        {/* Thanh điều khiển ở góc dưới phải */}
        {/* <div className="absolute bottom-4 right-4 flex gap-2.5 p-2 bg-black/50 rounded-full backdrop-blur-md shadow-lg">
          <Button
            type={isCamEnabled ? "primary" : "default"}
            shape="circle"
            icon={
              <VideoCameraOutlined
                className={isCamEnabled ? "text-white" : "text-red-500"}
              />
            }
            onClick={handleCameraToggle}
            className={`${
              isCamEnabled
                ? "bg-blue-500 border-blue-500"
                : "bg-red-50 border-red-500"
            } shadow-md`}
          />

          <Button
            type={isMicEnabled ? "primary" : "default"}
            shape="circle"
            icon={
              <AudioOutlined
                className={isMicEnabled ? "text-white" : "text-red-500"}
              />
            }
            onClick={handleMicToggle}
            className={`${
              isMicEnabled
                ? "bg-blue-500 border-blue-500"
                : "bg-red-50 border-red-500"
            } shadow-md`}
          />

          {isLive ? (
            <Tag color="red" className="m-0 rounded-full py-0 px-2">
              LIVE
            </Tag>
          ) : null}
        </div> */}
      </div>
    );
  };

  // Custom LiveStreamControls Component
  const LiveStreamControls = ({ call }) => {
    const {
      useCameraState,
      useMicrophoneState,
      useParticipantCount,
      useIsCallLive,
      useCallCallingState,
    } = useCallStateHooks();

    const { camera, isEnabled: isCamEnabled } = useCameraState();
    const { microphone, isEnabled: isMicEnabled } = useMicrophoneState();
    const participantCount = useParticipantCount();
    const isLive = useIsCallLive();
    const callingState = useCallCallingState();

    // Tạo đồng hồ đếm thời gian thay vì sử dụng useCallDuration
    const [duration, setDuration] = useState(0);
    const intervalRef = useRef(null);

    // Thêm state cho camera selector dropdown
    const [cameraDropdownOpen, setCameraDropdownOpen] = useState(false);
    const [cameras, setCameras] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState("");
    const [loadingCameras, setLoadingCameras] = useState(false);
    const [switchingCamera, setSwitchingCamera] = useState(false);

    // Hàm xử lý chuyển đổi camera
    const handleSwitchCamera = async (deviceId) => {
      try {
        if (deviceId === selectedCamera) return;

        setSwitchingCamera(true);
        message.loading({
          content: "Đang chuyển đổi camera...",
          key: "switchCamera",
        });

        // Tắt camera hiện tại
        if (camera.state.status === "enabled") {
          await camera.disable();
        }

        // Bật camera mới với deviceId
        await camera.enable(deviceId);

        // Cập nhật camera đã chọn
        setSelectedCamera(deviceId);

        message.success({
          content: "Đã chuyển đổi camera thành công",
          key: "switchCamera",
        });
      } catch (error) {
        console.error("Lỗi khi chuyển đổi camera:", error);
        message.error({
          content: "Không thể chuyển đổi camera: " + error.message,
          key: "switchCamera",
        });

        // Thử bật lại camera cũ nếu có lỗi
        try {
          if (selectedCamera && selectedCamera !== "current") {
            await camera.enable(selectedCamera);
          } else {
            await camera.enable();
          }
        } catch (enableError) {
          console.error("Không thể bật lại camera cũ:", enableError);
        }
      } finally {
        setSwitchingCamera(false);
      }
    };

    // Lấy danh sách camera khi component mount
    useEffect(() => {
      const fetchCameras = async () => {
        try {
          setLoadingCameras(true);

          // Kiểm tra camera hoạt động trên toàn hệ thống trước
          let systemCameras = [];
          try {
            // Lấy danh sách thiết bị từ navigator.mediaDevices
            const devices = await navigator.mediaDevices.enumerateDevices();
            systemCameras = devices.filter(
              (device) => device.kind === "videoinput"
            );
            console.log("Camera phát hiện từ hệ thống:", systemCameras);
          } catch (systemErr) {
            console.error(
              "Lỗi khi lấy danh sách thiết bị từ hệ thống:",
              systemErr
            );
          }

          // Lấy danh sách camera từ GetStream SDK
          if (call?.camera) {
            try {
              const streamDevices = await call.camera.listInputDevices();
              console.log("Camera phát hiện từ GetStream SDK:", streamDevices);

              // Nếu có camera từ SDK, sử dụng danh sách đó
              if (streamDevices && streamDevices.length > 0) {
                setCameras(streamDevices);
              }
              // Nếu không có camera từ SDK nhưng camera đang hoạt động
              // và có camera từ hệ thống, sử dụng danh sách từ hệ thống
              else if (systemCameras.length > 0) {
                // Chuyển đổi định dạng từ hệ thống sang định dạng GetStream SDK mong đợi
                const formattedCameras = systemCameras.map((device) => ({
                  deviceId: device.deviceId,
                  label:
                    device.label ||
                    `Camera ${device.deviceId.substring(0, 8)}...`,
                  kind: "videoinput",
                }));
                setCameras(formattedCameras);
                console.log(
                  "Sử dụng danh sách camera từ hệ thống:",
                  formattedCameras
                );
              }

              // Nếu camera đang được sử dụng nhưng không có trong danh sách
              // thêm camera giả định với deviceId là current
              if (
                call.camera.state.status === "enabled" &&
                (streamDevices?.length === 0 || !streamDevices) &&
                systemCameras.length === 0
              ) {
                const fakeCameraList = [
                  {
                    deviceId: "current",
                    label: "Camera đang sử dụng",
                    kind: "videoinput",
                  },
                ];
                setCameras(fakeCameraList);
                setSelectedCamera("current");
                console.log(
                  "Đã thêm camera giả định vì không phát hiện được danh sách:",
                  fakeCameraList
                );
              }

              // Lấy thông tin camera đang sử dụng
              const currentDevice = call.camera.selectedDevice;
              if (currentDevice?.deviceId) {
                setSelectedCamera(currentDevice.deviceId);
              } else if (call.camera.state.status === "enabled") {
                // Nếu camera đang bật nhưng không biết deviceId
                setSelectedCamera("current");
              } else if (systemCameras.length > 0) {
                setSelectedCamera(systemCameras[0].deviceId);
              }
            } catch (streamErr) {
              console.error("Lỗi khi lấy danh sách camera từ SDK:", streamErr);

              // Nếu có lỗi nhưng có camera từ hệ thống, sử dụng danh sách từ hệ thống
              if (systemCameras.length > 0) {
                const formattedCameras = systemCameras.map((device) => ({
                  deviceId: device.deviceId,
                  label:
                    device.label ||
                    `Camera ${device.deviceId.substring(0, 8)}...`,
                  kind: "videoinput",
                }));
                setCameras(formattedCameras);
                setSelectedCamera(systemCameras[0].deviceId);
              }
            }
          }
        } catch (err) {
          console.error("Lỗi khi lấy danh sách camera:", err);
        } finally {
          setLoadingCameras(false);
        }
      };

      fetchCameras();
    }, [call]);

    // Bắt đầu và dừng đồng hồ đếm thời gian dựa trên trạng thái isLive
    useEffect(() => {
      if (isLive) {
        // Bắt đầu đếm thời gian khi livestream đang chạy
        intervalRef.current = setInterval(() => {
          setDuration((prev) => prev + 1);
        }, 1000);
      } else {
        // Dừng đếm thời gian và đặt lại về 0 khi không livestream
        clearInterval(intervalRef.current);
        if (!isLive && callingState === "joined") {
          setDuration(0);
        }
      }

      // Cleanup khi component unmount
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }, [isLive, callingState]);

    // Format duration
    const formatDuration = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    // Hiển thị trạng thái cuộc gọi để debug
    console.log("Trạng thái cuộc gọi:", callingState);
    console.log("Camera có bật không:", isCamEnabled);
    console.log("Micro có bật không:", isMicEnabled);

    // Lấy livestreamId từ localStorage để sử dụng khi gọi API phát sóng
    const livestreamId = localStorage.getItem("currentLivestreamId");

    // Xử lý khi nhấn nút phát sóng/dừng phát sóng
    const handleLiveToggle = async () => {
      try {
        if (isLive) {
          // Nếu đang phát sóng, kết thúc luôn thay vì chỉ dừng tạm thời
          message.loading({
            content: "Đang kết thúc livestream...",
            key: "endLive",
          });

          // Dừng phát sóng trên GetStream
          await call.stopLive();

          // Kết thúc livestream hoàn toàn thay vì chỉ tạm dừng
          // Lấy livestreamId từ state hoặc localStorage
          const id = localStorage.getItem("currentLivestreamId");

          if (id) {
            try {
              // Gọi API kết thúc livestream
              await endLiveStream(id);
              console.log("Đã kết thúc livestream thành công qua API");

              // Rời khỏi cuộc gọi trên GetStream
              await call.leave();

              // Ngắt kết nối người dùng
              await client.disconnectUser();

              // Reset các state
              setClient(null);
              setCall(null);
              localStorage.removeItem("currentLivestreamId");

              message.success({
                content: "Đã kết thúc livestream hoàn toàn",
                key: "endLive",
              });

              // Không cần hiển thị thông báo nữa vì chúng ta đã reset về màn hình ban đầu
              return;
            } catch (endError) {
              console.error("Lỗi khi kết thúc livestream hoàn toàn:", endError);
              // Vẫn hiển thị thông báo đã dừng phát sóng nếu có lỗi
            }
          }

          message.success({ content: "Đã dừng phát sóng", key: "endLive" });
        } else {
          // Nếu chưa phát sóng, bắt đầu phát
          message.loading({
            content: "Đang bắt đầu phát sóng...",
            key: "startLive",
          });

          // Gọi API thông báo bắt đầu phát sóng trước
          if (livestreamId) {
            try {
              await StartLiveStream(livestreamId);
              console.log("Đã gọi API bắt đầu phát sóng thành công");
            } catch (apiError) {
              console.error("Lỗi khi gọi API bắt đầu phát sóng:", apiError);
              // Vẫn tiếp tục phát sóng ngay cả khi API có lỗi
            }
          } else {
            console.warn("Không tìm thấy ID livestream để bắt đầu phát sóng");
          }

          // Bắt đầu phát sóng trên GetStream
          await call.goLive();
          message.success({
            content: "Đã bắt đầu phát sóng",
            key: "startLive",
          });
        }
      } catch (err) {
        console.error(
          "Lỗi khi " + (isLive ? "kết thúc" : "bắt đầu") + " phát sóng:",
          err
        );
        message.error({
          content:
            "Lỗi khi " +
            (isLive ? "kết thúc" : "bắt đầu") +
            " phát sóng: " +
            err.message,
          key: "startLive",
        });
      }
    };

    return (
      <div className="w-auto min-w-[300px] max-w-[600px] py-3 px-5 bg-black/80 rounded-xl backdrop-blur-md shadow-lg z-40">
        {/* Thông tin thời gian và người xem */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            {/* Đồng hồ thời gian */}
            <div className="bg-white/10 py-1 px-2.5 rounded-full flex items-center gap-1.5">
              <ClockCircleOutlined className="text-white" />
              <Text strong className="text-white m-0">
                {formatDuration(duration)}
              </Text>
            </div>

            {/* Tag LIVE */}
            {isLive && (
              <Tag color="red" className="m-0 rounded-full py-0 px-2">
                LIVE
              </Tag>
            )}

            {/* Số người xem */}
            <div className="bg-white/10 py-1 px-2.5 rounded-full flex items-center gap-1.5">
              <UserOutlined className="text-white" />
              <Text strong className="text-white m-0">
                {Math.max(0, participantCount - 1)} người xem
              </Text>
            </div>
          </div>

          {/* Các nút điều khiển */}
          <div className="flex items-center gap-2">
            {/* Nút camera */}
            <Button
              type="text"
              shape="circle"
              icon={
                <VideoCameraOutlined
                  className={isCamEnabled ? "text-white" : "text-red-500"}
                />
              }
              onClick={() => handleSwitchCamera(selectedCamera)}
              className="hover:bg-white/10"
            />

            {/* Nút mic */}
            <Button
              type="text"
              shape="circle"
              icon={
                <AudioOutlined
                  className={isMicEnabled ? "text-white" : "text-red-500"}
                />
              }
              onClick={() => microphone.toggle()}
              className="hover:bg-white/10"
            />

            {/* Nút cài đặt */}
            <Button
              type="text"
              shape="circle"
              icon={<SettingOutlined className="text-white" />}
              onClick={() => setCameraDropdownOpen(!cameraDropdownOpen)}
              className="border-0 hover:bg-white/10"
            />

            {/* Nút phát sóng */}
            {!isLive && (
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleLiveToggle}
                className="py-0 px-4 h-8 bg-red-500 hover:bg-red-600 border-0 shadow-md ml-2"
              >
                Phát sóng
              </Button>
            )}
          </div>
        </div>

        {/* Dropdown chọn camera */}
        {cameraDropdownOpen && (
          <div className="absolute bottom-full right-0 mb-2 bg-white border-none rounded-xl p-3 z-50 shadow-lg w-[280px]">
            <div className="mb-3 flex justify-between items-center pb-2 border-b border-gray-100">
              <Text strong className="text-sm">
                <VideoCameraOutlined className="mr-1.5 text-blue-500" />
                Chọn Camera
              </Text>
              <Button
                type="text"
                size="small"
                shape="circle"
                icon={<CloseCircleOutlined />}
                onClick={() => setCameraDropdownOpen(false)}
              />
            </div>

            {loadingCameras ? (
              <Flex justify="center" className="py-5">
                <Spin size="small" />
              </Flex>
            ) : cameras.length > 0 ? (
              <Space direction="vertical" className="w-full">
                {cameras.map((device) => (
                  <div key={device.deviceId} className="mb-2">
                    <Button
                      type={
                        selectedCamera === device.deviceId ? "primary" : "text"
                      }
                      onClick={() => handleSwitchCamera(device.deviceId)}
                      className={`text-left w-full h-auto py-2.5 px-3 rounded-lg flex items-center overflow-hidden transition-all ${
                        selectedCamera === device.deviceId
                          ? "border-none bg-blue-500"
                          : "border border-gray-100 bg-white"
                      }`}
                    >
                      <div className="flex items-center w-full">
                        <div
                          className={`mr-3 flex items-center justify-center w-8 h-8 rounded-full ${
                            selectedCamera === device.deviceId
                              ? "bg-white/20"
                              : "bg-gray-100"
                          }`}
                        >
                          <VideoCameraOutlined
                            className={`text-base ${
                              selectedCamera === device.deviceId
                                ? "text-white"
                                : "text-blue-500"
                            }`}
                          />
                        </div>
                        <div className="overflow-hidden flex-1">
                          <div
                            className={`font-medium whitespace-nowrap overflow-hidden text-ellipsis ${
                              selectedCamera === device.deviceId
                                ? "text-white"
                                : "text-gray-900"
                            }`}
                          >
                            {device.label ||
                              `Camera ${device.deviceId.substring(0, 8)}...`}
                          </div>
                          {selectedCamera === device.deviceId && (
                            <Text className="text-xs text-white/85">
                              Đang sử dụng
                            </Text>
                          )}
                        </div>
                        {selectedCamera === device.deviceId && (
                          <div className="ml-auto text-base text-white">✓</div>
                        )}
                      </div>
                    </Button>

                    {/* Thêm nút chuyển đổi triệt để nếu không phải camera đang được chọn */}
                    {selectedCamera !== device.deviceId && (
                      <Button
                        type="link"
                        size="small"
                        onClick={() => {
                          message.info(
                            "Đang thử chuyển camera. Vui lòng đợi..."
                          );
                          handleSwitchCamera(device.deviceId);
                        }}
                        icon={<SyncOutlined />}
                        className="ml-11 text-xs py-0 pb-1"
                      >
                        Chuyển camera
                      </Button>
                    )}
                  </div>
                ))}
              </Space>
            ) : (
              <div>
                {call.camera.state.status === "enabled" ? (
                  // Nếu camera đang hoạt động nhưng không tìm thấy trong danh sách
                  <Space direction="vertical" className="w-full">
                    <Button
                      type="primary"
                      onClick={() => handleSwitchCamera(selectedCamera)}
                      className="text-left w-full py-2.5 px-3 rounded-lg mb-2.5 h-auto"
                    >
                      <div className="flex items-center">
                        <div className="mr-3 flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
                          <VideoCameraOutlined className="text-base text-white" />
                        </div>
                        <div>
                          <div className="font-medium">Camera đang sử dụng</div>
                          <div className="text-xs text-white/85">
                            Đang hoạt động
                          </div>
                        </div>
                      </div>
                    </Button>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <Text type="secondary" className="text-sm">
                        <InfoCircleOutlined className="mr-1.5" />
                        Camera đang hoạt động nhưng không thể liệt kê chi tiết
                      </Text>
                    </div>
                  </Space>
                ) : (
                  // Nếu không có camera nào
                  <Empty
                    description={
                      <Space direction="vertical" align="center">
                        <Text>Không tìm thấy camera</Text>
                        <Text type="secondary" className="text-xs">
                          Vui lòng kết nối thiết bị và làm mới
                        </Text>
                      </Space>
                    }
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    className="my-5 py-2.5"
                  />
                )}
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-center">
              <Button
                type="default"
                size="middle"
                onClick={() => {
                  // Giữ nguyên nội dung hàm
                  // Làm mới thủ công
                  setCameraDropdownOpen(false);
                  setLoadingCameras(true);

                  // Hiển thị thông báo loading
                  message.loading("Đang làm mới danh sách camera...", 1.5);

                  // Kiểm tra quyền truy cập media
                  navigator.mediaDevices
                    .getUserMedia({ video: true })
                    .then((stream) => {
                      // Dừng stream sau khi đã xác nhận quyền truy cập
                      stream.getTracks().forEach((track) => track.stop());

                      // Sau khi có quyền, lấy danh sách thiết bị
                      return navigator.mediaDevices.enumerateDevices();
                    })
                    .then((devices) => {
                      const videoCameras = devices.filter(
                        (device) => device.kind === "videoinput"
                      );

                      if (videoCameras.length > 0) {
                        // Chuyển đổi định dạng
                        const formattedCameras = videoCameras.map((device) => ({
                          deviceId: device.deviceId,
                          label:
                            device.label ||
                            `Camera ${device.deviceId.substring(0, 8)}...`,
                          kind: "videoinput",
                        }));

                        setCameras(formattedCameras);
                        message.success(
                          `Đã tìm thấy ${formattedCameras.length} camera`
                        );

                        // Mở lại dropdown sau khi cập nhật
                        setTimeout(() => {
                          setCameraDropdownOpen(true);
                          setLoadingCameras(false);
                        }, 300);
                      } else {
                        message.info("Không tìm thấy camera nào");
                        setLoadingCameras(false);

                        // Nếu camera đang hoạt động, thêm camera giả định
                        if (call.camera.state.status === "enabled") {
                          setCameras([
                            {
                              deviceId: "current",
                              label: "Camera đang sử dụng",
                              kind: "videoinput",
                            },
                          ]);
                          setSelectedCamera("current");

                          // Mở lại dropdown sau khi cập nhật
                          setTimeout(() => {
                            setCameraDropdownOpen(true);
                          }, 300);
                        }
                      }
                    })
                    .catch((err) => {
                      console.error("Lỗi khi làm mới camera:", err);
                      message.error(
                        "Không thể làm mới danh sách camera: " + err.message
                      );
                      setLoadingCameras(false);

                      // Nếu camera đang hoạt động, thêm camera giả định
                      if (call.camera.state.status === "enabled") {
                        setCameras([
                          {
                            deviceId: "current",
                            label: "Camera đang sử dụng",
                            kind: "videoinput",
                          },
                        ]);
                        setSelectedCamera("current");
                      }
                    });
                }}
                icon={<SyncOutlined />}
                className="rounded-md shadow-none border border-gray-300 py-0 px-4"
              >
                Làm mới danh sách
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      if (client) {
        client
          .disconnectUser()
          .catch((err) => console.error("Lỗi khi ngắt kết nối:", err));
      }
      if (chatClient) {
        chatClient
          .disconnectUser()
          .catch((err) => console.error("Lỗi khi ngắt kết nối chat:", err));
      }
    };
  }, [client, chatClient]);

  const isLoading = loading || localLoading;

  return (
    <Card
      title={<Title level={3}>Quản lý Livestream</Title>}
      className="w-full rounded-2xl shadow-lg overflow-hidden livestream-card border-0"
    >
      {isLoading ? (
        <Flex justify="center" align="center" className="min-h-[400px]">
          <Spin size="large" tip="Đang xử lý..." />
        </Flex>
      ) : call && client ? (
        <StreamVideo client={client}>
          <StreamCall
            call={call}
            callControlsProps={{ hideDefaultCallControls: true }}
            layout={LivestreamLayout}
            layoutProps={{
              params: {
                showParticipantControls: false,
                showControls: false,
              },
            }}
          >
            <Flex vertical gap="24px" className="h-full">
              <Row gutter={[16, 16]} className="flex items-stretch">
                <Col span={24} md={14} className="flex">
                  {/* Hiển thị video của chính người dùng */}
                  <Card
                    title={
                      <Space>
                        <VideoCameraOutlined className="text-blue-500" />
                        <span>Camera của bạn</span>
                      </Space>
                    }
                    bordered={false}
                    className="w-full shadow-md rounded-xl overflow-hidden bg-gray-900 camera-card"
                    styles={{
                      body: {
                        height: "450px",
                        padding: "0",
                        position: "relative",
                        overflow: "hidden",
                      },
                    }}
                    headStyle={{
                      borderBottom: "1px solid rgba(255,255,255,0.1)",
                      backgroundColor: "rgba(0,0,0,0.3)",
                      color: "white",
                      height: "57px",
                    }}
                    extra={
                      <Space>
                        <Button
                          type="primary"
                          danger
                          icon={<CloseCircleOutlined />}
                          onClick={handleEndLiveStream}
                          size="middle"
                          className="shadow-md"
                        >
                          Kết thúc Livestream
                        </Button>
                      </Space>
                    }
                  >
                    <UserVideoPreview />
                  </Card>
                </Col>

                <Col span={24} md={10} className="flex">
                  <Card
                    title={
                      <Space>
                        <CommentOutlined className="text-blue-500" />
                        <span>Chat Trực tiếp</span>
                      </Space>
                    }
                    bordered={false}
                    className="w-full shadow-md rounded-xl overflow-hidden bg-white chat-card"
                    styles={{
                      body: {
                        height: "450px",
                        padding: 0,
                        position: "relative",
                        overflow: "hidden",
                      },
                    }}
                    headStyle={{
                      borderBottom: "1px solid #f0f0f0",
                      height: "57px",
                    }}
                  >
                    {channel && chatClient ? (
                      <ChatComponent
                        channel={channel}
                        chatClient={chatClient}
                      />
                    ) : chatError ? (
                      <div className="p-4 text-center">
                        <Text type="danger">{chatError}</Text>
                        <div className="mt-4">
                          <Button
                            type="primary"
                            onClick={() => window.location.reload()}
                          >
                            Thử lại
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-center">
                        <Spin tip="Đang kết nối đến chat..." />
                      </div>
                    )}
                  </Card>
                </Col>
              </Row>

              {/* Thanh điều khiển đơn giản */}
              <div className="flex justify-center w-full mt-3">
                <LiveStreamControls call={call} />
              </div>
            </Flex>
          </StreamCall>
        </StreamVideo>
      ) : (
        <Flex vertical align="center" className="min-h-[400px] p-8 bg-gray-50">
          <div className="text-5xl text-blue-500 mb-4">
            <VideoCameraOutlined />
          </div>

          <Title level={2} className="text-center mb-4">
            Bắt đầu livestream cho buổi triển lãm Koi
          </Title>

          <Text className="text-center max-w-[700px] mb-8 text-base">
            Tạo một buổi livestream để chia sẻ sự kiện với mọi người. Bạn có thể
            bật/tắt camera và micro, cũng như kết thúc buổi phát sóng bất cứ lúc
            nào.
          </Text>

          <Card
            className="w-full max-w-[700px] rounded-xl border border-gray-200 mb-8"
            styles={{
              body: { padding: "24px" },
            }}
          >
            <Title level={5} className="mb-4">
              Sử dụng máy ghi hình ngoài:
            </Title>

            <Text className="block mb-2">
              Kết nối máy ghi hình vào máy tính qua cổng USB hoặc HDMI (cần có
              bộ chuyển đổi).
            </Text>

            <Text className="block mb-4">
              Sau khi tạo livestream, bạn có thể chọn giữa camera máy tính và
              máy ghi hình ngoài.
            </Text>

            <Text type="secondary" className="block text-sm italic">
              Lưu ý: Nếu bạn kết nối máy ghi hình sau khi đã bắt đầu livestream,
              hãy tải lại trang để hệ thống nhận diện thiết bị mới.
            </Text>
          </Card>

          <Button
            type="primary"
            shape="round"
            icon={<PlayCircleOutlined />}
            onClick={handleCreateLiveStream}
            size="large"
            className="shadow-md px-6 h-12 text-base"
          >
            Tạo Livestream mới
          </Button>
        </Flex>
      )}
    </Card>
  );
}

LiveStream.propTypes = {
  showId: PropTypes.string.isRequired,
};

export default LiveStream;
