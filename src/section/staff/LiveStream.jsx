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
} from "@ant-design/icons";

const { Title, Text } = Typography;

function LiveStream({ showId }) {
  const koiShowId = showId;
  const { createLiveStream, endLiveStream, liveStream, loading, error } =
    useLiveStream();
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);

  const handleCreateLiveStream = async () => {
    if (!koiShowId) {
      message.error("Không tìm thấy ID cho koi show");
      return;
    }

    setLocalLoading(true);

    try {
      // Lấy userId trực tiếp từ cookies với key __id
      const userId = Cookies.get("__id");

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
      }
    } finally {
      setLocalLoading(false);
    }
  };

  // Custom component để hiển thị video người dùng
  const UserVideoPreview = () => {
    const { useLocalParticipant } = useCallStateHooks();
    const localParticipant = useLocalParticipant();

    if (!localParticipant) {
      return (
        <Flex
          align="center"
          justify="center"
          style={{
            width: "100%",
            height: "300px",
            background: "#f0f2f5",
            borderRadius: "8px",
          }}
        >
          <Space direction="vertical" align="center">
            <Avatar size={64} icon={<UserOutlined />} />
            <Text>Không tìm thấy camera hoặc người dùng cục bộ</Text>
          </Space>
        </Flex>
      );
    }

    return (
      <div
        style={{
          width: "100%",
          height: "300px",
          position: "relative",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        }}
      >
        <ParticipantView participant={localParticipant} />
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            padding: "4px 8px",
            background: "rgba(0,0,0,0.6)",
            borderRadius: "4px",
          }}
        >
          <Text style={{ color: "white", fontSize: "12px" }}>
            <UserOutlined /> Bạn (Host)
          </Text>
        </div>
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

    const handleCameraToggle = async () => {
      try {
        await camera.toggle();
        console.log("Đã nhấn nút bật/tắt camera:", !isCamEnabled);
      } catch (cameraError) {
        console.error("Lỗi khi bật/tắt camera:", cameraError);

        if (cameraError.name === "NotReadableError") {
          message.error(
            "Không thể truy cập camera! Camera có thể đang được sử dụng bởi ứng dụng khác."
          );
        } else if (cameraError.name === "NotAllowedError") {
          message.error("Trình duyệt chưa được cấp quyền truy cập camera!");
        } else {
          message.error(`Lỗi camera: ${cameraError.message}`);
        }
      }
    };

    // Xử lý thay đổi camera
    const handleCameraChange = async (deviceId) => {
      try {
        setSelectedCamera(deviceId);
        if (camera && deviceId) {
          // Nếu là camera giả định, không cần thay đổi thiết bị
          if (deviceId === "current") {
            message.info("Đang sử dụng camera hiện tại");
            setCameraDropdownOpen(false);
            return;
          }

          console.log("Đang chuyển sang camera:", deviceId);
          console.log("Trạng thái camera hiện tại:", camera.state);
          console.log(
            "Các phương thức có sẵn:",
            Object.getOwnPropertyNames(Object.getPrototypeOf(camera))
          );

          // Thử các phương thức khác nhau của GetStream Camera API
          try {
            // Phương pháp 1: Tắt camera hiện tại trước
            if (camera.state.status === "enabled") {
              await camera.disable();
              await new Promise((resolve) => setTimeout(resolve, 300)); // Đợi một chút
            }

            // Phương pháp 2: Kích hoạt camera với deviceId cụ thể
            await camera.enable(deviceId);

            // Ghi log thiết bị đã chọn
            console.log(
              "Camera hiện tại sau khi thay đổi:",
              camera.selectedDevice
            );

            // Lưu camera ưa thích
            localStorage.setItem("preferredCameraId", deviceId);

            message.success("Đã chuyển sang camera mới");
          } catch (innerError) {
            console.error("Lỗi khi thử phương pháp chính:", innerError);

            // Phương pháp dự phòng: Thử sử dụng navigator.mediaDevices trực tiếp
            try {
              console.log("Thử phương pháp dự phòng...");

              // Tắt camera hiện tại
              await camera.disable();

              // Tạo stream mới với deviceId cụ thể
              const newStream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: deviceId } },
              });

              // Thay thế stream hiện tại của call
              if (
                call.video &&
                typeof call.video.replaceTracks === "function"
              ) {
                await call.video.replaceTracks(newStream.getVideoTracks()[0]);
                message.success("Đã thay đổi camera (phương pháp dự phòng)");
              } else {
                // Nếu không có replaceTracks, thử lại từ đầu
                await camera.enable();
                message.info(
                  "Đã bật lại camera, nhưng không thể chuyển đổi thiết bị"
                );
              }
            } catch (fallbackError) {
              console.error("Lỗi khi thử phương pháp dự phòng:", fallbackError);

              // Đảm bảo camera được bật lại nếu có lỗi
              if (camera.state.status !== "enabled") {
                await camera.enable();
              }

              throw new Error(
                "Không thể thay đổi camera. Vui lòng tải lại trang và thử lại."
              );
            }
          }

          setCameraDropdownOpen(false);
        }
      } catch (err) {
        console.error("Lỗi khi chuyển camera:", err);
        message.error(`Không thể chuyển camera: ${err.message}`);
      }
    };

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
      <div
        style={{
          padding: "16px",
          backgroundColor: "#f9f9f9",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Flex align="center" gap="small">
              <ClockCircleOutlined />
              <Text strong>{formatDuration(duration)}</Text>

              {isLive && (
                <Tag color="red" style={{ marginLeft: "8px" }}>
                  LIVE
                </Tag>
              )}
            </Flex>
          </Col>

          <Col span={8}>
            <Flex justify="center" gap="middle">
              <Button
                type={isCamEnabled ? "default" : "primary"}
                shape="circle"
                icon={<VideoCameraOutlined />}
                onClick={handleCameraToggle}
                size="large"
                danger={!isCamEnabled}
              />

              <Button
                type={isMicEnabled ? "default" : "primary"}
                shape="circle"
                icon={<AudioOutlined />}
                onClick={() => {
                  microphone.toggle();
                  console.log("Đã nhấn nút bật/tắt micro:", !isMicEnabled);
                }}
                size="large"
                danger={!isMicEnabled}
              />

              {/* Thêm nút chọn camera */}
              <div style={{ position: "relative" }}>
                <Button
                  type="default"
                  shape="circle"
                  icon={<SettingOutlined />}
                  onClick={() => setCameraDropdownOpen(!cameraDropdownOpen)}
                  size="large"
                />

                {/* Dropdown cho danh sách camera */}
                {cameraDropdownOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: "50%",
                      transform: "translateX(-50%)",
                      marginTop: "8px",
                      background: "white",
                      border: "none",
                      borderRadius: "12px",
                      padding: "12px",
                      zIndex: 1000,
                      boxShadow:
                        "0 6px 16px rgba(0,0,0,0.12), 0 3px 6px rgba(0,0,0,0.08)",
                      width: "280px",
                    }}
                  >
                    <div
                      style={{
                        marginBottom: "12px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingBottom: "8px",
                        borderBottom: "1px solid #f0f0f0",
                      }}
                    >
                      <Text strong style={{ fontSize: "14px" }}>
                        <VideoCameraOutlined
                          style={{ marginRight: "6px", color: "#1890ff" }}
                        />
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
                      <Flex justify="center" style={{ padding: "20px" }}>
                        <Spin size="small" />
                      </Flex>
                    ) : cameras.length > 0 ? (
                      <Space direction="vertical" style={{ width: "100%" }}>
                        {cameras.map((device) => (
                          <div
                            key={device.deviceId}
                            style={{ marginBottom: "8px" }}
                          >
                            <Button
                              type={
                                selectedCamera === device.deviceId
                                  ? "primary"
                                  : "text"
                              }
                              onClick={() =>
                                handleCameraChange(device.deviceId)
                              }
                              style={{
                                textAlign: "left",
                                width: "100%",
                                height: "auto",
                                padding: "10px 12px",
                                borderRadius: "8px",
                                display: "flex",
                                alignItems: "center",
                                overflow: "hidden",
                                transition: "all 0.3s",
                                border:
                                  selectedCamera === device.deviceId
                                    ? "none"
                                    : "1px solid #f0f0f0",
                                background:
                                  selectedCamera === device.deviceId
                                    ? "#1890ff"
                                    : "white",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  width: "100%",
                                }}
                              >
                                <div
                                  style={{
                                    marginRight: "12px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "50%",
                                    background:
                                      selectedCamera === device.deviceId
                                        ? "rgba(255,255,255,0.2)"
                                        : "#f5f5f5",
                                  }}
                                >
                                  <VideoCameraOutlined
                                    style={{
                                      fontSize: "16px",
                                      color:
                                        selectedCamera === device.deviceId
                                          ? "white"
                                          : "#1890ff",
                                    }}
                                  />
                                </div>
                                <div style={{ overflow: "hidden", flex: 1 }}>
                                  <div
                                    style={{
                                      fontWeight: "500",
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      color:
                                        selectedCamera === device.deviceId
                                          ? "white"
                                          : "rgba(0,0,0,0.85)",
                                    }}
                                  >
                                    {device.label ||
                                      `Camera ${device.deviceId.substring(0, 8)}...`}
                                  </div>
                                  {selectedCamera === device.deviceId && (
                                    <Text
                                      style={{
                                        fontSize: "12px",
                                        color: "rgba(255,255,255,0.85)",
                                      }}
                                    >
                                      Đang sử dụng
                                    </Text>
                                  )}
                                </div>
                                {selectedCamera === device.deviceId && (
                                  <div
                                    style={{
                                      marginLeft: "auto",
                                      fontSize: "16px",
                                      color: "white",
                                    }}
                                  >
                                    ✓
                                  </div>
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
                                  handleCameraChange(device.deviceId);
                                }}
                                icon={<SyncOutlined />}
                                style={{
                                  marginLeft: "44px",
                                  fontSize: "12px",
                                  padding: "0 0 4px 0",
                                }}
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
                          <Space direction="vertical" style={{ width: "100%" }}>
                            <Button
                              type="primary"
                              onClick={() => handleCameraChange("current")}
                              style={{
                                textAlign: "left",
                                width: "100%",
                                padding: "10px 12px",
                                borderRadius: "8px",
                                marginBottom: "10px",
                                height: "auto",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              >
                                <div
                                  style={{
                                    marginRight: "12px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "50%",
                                    background: "rgba(255,255,255,0.2)",
                                  }}
                                >
                                  <VideoCameraOutlined
                                    style={{ fontSize: "16px", color: "white" }}
                                  />
                                </div>
                                <div>
                                  <div style={{ fontWeight: "500" }}>
                                    Camera đang sử dụng
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      color: "rgba(255,255,255,0.85)",
                                    }}
                                  >
                                    Đang hoạt động
                                  </div>
                                </div>
                              </div>
                            </Button>
                            <div
                              style={{
                                padding: "12px",
                                background: "#f9f9f9",
                                borderRadius: "8px",
                                border: "1px solid #f0f0f0",
                              }}
                            >
                              <Text
                                type="secondary"
                                style={{ fontSize: "13px" }}
                              >
                                <InfoCircleOutlined
                                  style={{ marginRight: "6px" }}
                                />
                                Camera đang hoạt động nhưng không thể liệt kê
                                chi tiết
                              </Text>
                            </div>
                          </Space>
                        ) : (
                          // Nếu không có camera nào
                          <Empty
                            description={
                              <Space direction="vertical" align="center">
                                <Text>Không tìm thấy camera</Text>
                                <Text
                                  type="secondary"
                                  style={{ fontSize: "12px" }}
                                >
                                  Vui lòng kết nối thiết bị và làm mới
                                </Text>
                              </Space>
                            }
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            style={{ margin: "20px 0", padding: "10px" }}
                          />
                        )}
                      </div>
                    )}

                    <div
                      style={{
                        marginTop: "12px",
                        paddingTop: "12px",
                        borderTop: "1px solid #f0f0f0",
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <Button
                        type="default"
                        size="middle"
                        onClick={() => {
                          // Làm mới thủ công
                          setCameraDropdownOpen(false);
                          setLoadingCameras(true);

                          // Hiển thị thông báo loading
                          message.loading(
                            "Đang làm mới danh sách camera...",
                            1.5
                          );

                          // Kiểm tra quyền truy cập media
                          navigator.mediaDevices
                            .getUserMedia({ video: true })
                            .then((stream) => {
                              // Dừng stream sau khi đã xác nhận quyền truy cập
                              stream
                                .getTracks()
                                .forEach((track) => track.stop());

                              // Sau khi có quyền, lấy danh sách thiết bị
                              return navigator.mediaDevices.enumerateDevices();
                            })
                            .then((devices) => {
                              const videoCameras = devices.filter(
                                (device) => device.kind === "videoinput"
                              );

                              if (videoCameras.length > 0) {
                                // Chuyển đổi định dạng
                                const formattedCameras = videoCameras.map(
                                  (device) => ({
                                    deviceId: device.deviceId,
                                    label:
                                      device.label ||
                                      `Camera ${device.deviceId.substring(0, 8)}...`,
                                    kind: "videoinput",
                                  })
                                );

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
                                "Không thể làm mới danh sách camera: " +
                                  err.message
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
                        style={{
                          borderRadius: "6px",
                          boxShadow: "none",
                          border: "1px solid #d9d9d9",
                          padding: "0 16px",
                        }}
                      >
                        Làm mới danh sách
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Chỉ hiển thị nút Phát sóng khi chưa phát */}
              {!isLive && (
                <Button
                  type="default"
                  shape="round"
                  icon={<PlayCircleOutlined />}
                  onClick={handleLiveToggle}
                  size="large"
                >
                  Phát sóng
                </Button>
              )}
            </Flex>
          </Col>

          <Col span={8}>
            <Flex justify="end" align="middle" gap="small">
              <UserOutlined />
              <Text>{Math.max(0, participantCount - 1)} người xem</Text>
              <Tag color={callingState === "joined" ? "green" : "orange"}>
                {callingState === "joined" ? "Đã kết nối" : callingState}
              </Tag>
            </Flex>
          </Col>
        </Row>
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
    };
  }, [client]);

  const isLoading = loading || localLoading;

  return (
    <Card
      title={<Title level={3}>Quản lý Livestream</Title>}
      style={{ width: "100%" }}
      bodyStyle={{ padding: "24px" }}
    >
      {isLoading ? (
        <Flex justify="center" align="center" style={{ minHeight: "400px" }}>
          <Spin size="large" tip="Đang xử lý..." />
        </Flex>
      ) : call && client ? (
        <StreamVideo client={client}>
          <StreamCall call={call}>
            <Flex vertical gap="middle" style={{ height: "100%" }}>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  {/* Hiển thị video của chính người dùng */}
                  <Card
                    title="Camera của bạn"
                    bordered={false}
                    style={{ height: "100%" }}
                  >
                    <UserVideoPreview />
                  </Card>
                </Col>
              </Row>

              <Divider />

              <LiveStreamControls call={call} />

              <Divider />

              <Row gutter={16}>
                <Col span={24} md={16}>
                  <Card title="Cài đặt thiết bị" bordered={false}>
                    <DeviceSettings />
                  </Card>
                </Col>

                <Col span={24} md={8}>
                  <Flex vertical gap="middle" style={{ height: "100%" }}>
                    <Button
                      danger
                      type="primary"
                      icon={<CloseCircleOutlined />}
                      onClick={handleEndLiveStream}
                      size="large"
                      block
                      style={{ height: "50px" }}
                    >
                      Kết thúc Livestream
                    </Button>

                    <Text type="secondary" style={{ textAlign: "center" }}>
                      Kết thúc phiên livestream sẽ ngắt kết nối tất cả người xem
                    </Text>
                  </Flex>
                </Col>
              </Row>
            </Flex>
          </StreamCall>
        </StreamVideo>
      ) : (
        <Flex
          vertical
          gap="middle"
          align="center"
          justify="center"
          style={{
            minHeight: "400px",
            padding: "40px",
            backgroundColor: "#f7f9fc",
            borderRadius: "8px",
          }}
        >
          <VideoCameraOutlined style={{ fontSize: "48px", color: "#1890ff" }} />
          <Title level={3}>Bắt đầu livestream cho buổi triển lãm Koi</Title>
          <Text
            style={{
              maxWidth: "600px",
              textAlign: "center",
              marginBottom: "20px",
            }}
          >
            Tạo một buổi livestream để chia sẻ sự kiện với mọi người. Bạn có thể
            bật/tắt camera và micro, cũng như kết thúc buổi phát sóng bất cứ lúc
            nào.
          </Text>

          <Card
            style={{ width: "100%", maxWidth: "600px", marginBottom: "20px" }}
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              <Text strong>Sử dụng máy ghi hình ngoài:</Text>
              <Text>
                Kết nối máy ghi hình vào máy tính qua cổng USB hoặc HDMI (cần có
                bộ chuyển đổi). Sau khi tạo livestream, bạn có thể chọn giữa
                camera máy tính và máy ghi hình ngoài.
              </Text>
              <Divider dashed style={{ margin: "10px 0" }} />
              <Text type="secondary" style={{ fontSize: "12px" }}>
                Lưu ý: Nếu bạn kết nối máy ghi hình sau khi đã bắt đầu
                livestream, hãy tải lại trang để hệ thống nhận diện thiết bị
                mới.
              </Text>
            </Space>
          </Card>

          {error && (
            <Text type="danger" style={{ marginBottom: "20px" }}>
              {error}
            </Text>
          )}

          <Button
            type="primary"
            size="large"
            icon={<PlayCircleOutlined />}
            onClick={handleCreateLiveStream}
            loading={isLoading}
            style={{ height: "50px", minWidth: "200px" }}
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
