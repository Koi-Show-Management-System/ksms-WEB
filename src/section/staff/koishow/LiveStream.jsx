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
import useLiveStream from "../../../hooks/useLiveStream";
import { GetHostToken } from "../../../api/liveStreamApi";
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
              await livestreamCall.camera.enable();
              console.log("Đã bật camera tự động", livestreamCall.camera.state);
            } catch (cameraError) {
              console.error("Không thể bật camera:", cameraError);

              // Hiển thị thông báo chi tiết về lỗi camera
              if (cameraError.name === "NotReadableError") {
                message.error(
                  "Không thể truy cập camera! Camera đang được sử dụng bởi ứng dụng khác hoặc không hoạt động."
                );
                console.log("Hướng dẫn khắc phục lỗi camera:");
                console.log(
                  "1. Đóng tất cả các ứng dụng khác đang sử dụng camera (Zoom, Teams, ...)"
                );
                console.log("2. Tải lại trang web");
                console.log(
                  "3. Kiểm tra camera có hoạt động trong ứng dụng khác không"
                );
                console.log("4. Khởi động lại máy tính");
              } else if (cameraError.name === "NotAllowedError") {
                message.error(
                  "Trình duyệt chưa được cấp quyền truy cập camera!"
                );
              } else {
                message.error(`Lỗi camera: ${cameraError.message}`);
              }
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
          message.error(
            "Không thể truy cập thiết bị âm thanh và hình ảnh. Vui lòng kiểm tra quyền truy cập và thử lại."
          );
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

              <Button
                type={isLive ? "primary" : "default"}
                danger={isLive}
                shape="round"
                icon={isLive ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                onClick={() => (isLive ? call.stopLive() : call.goLive())}
                size="large"
              >
                {isLive ? "Dừng phát sóng" : "Phát sóng"}
              </Button>
            </Flex>
          </Col>

          <Col span={8}>
            <Flex justify="end" align="middle" gap="small">
              <UserOutlined />
              <Text>{participantCount} người xem</Text>
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
                <Col span={24} md={12}>
                  {/* Hiển thị video của chính người dùng */}
                  <Card
                    title="Camera của bạn"
                    bordered={false}
                    style={{ height: "100%" }}
                  >
                    <UserVideoPreview />
                  </Card>
                </Col>

                <Col span={24} md={12}>
                  {/* Hiển thị chế độ livestream */}
                  <Card
                    title="Chế độ xem trực tiếp"
                    bordered={false}
                    style={{ height: "100%" }}
                  >
                    <div
                      style={{
                        height: "300px",
                        position: "relative",
                        overflow: "hidden",
                        borderRadius: "8px",
                      }}
                    >
                      <LivestreamLayout />
                    </div>
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
