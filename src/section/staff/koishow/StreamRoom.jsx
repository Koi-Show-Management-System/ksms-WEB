import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  Button,
  Typography,
  Space,
  Spin,
  message,
  notification,
  Alert,
  Tag,
  Input,
  Tooltip,
  Row,
  Col,
  Divider,
} from "antd";
import {
  ArrowLeftOutlined,
  UserOutlined,
  CopyOutlined,
  PlayCircleOutlined,
  StopOutlined,
  EyeOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
// Import GetStream.io SDK
import { StreamVideoClient } from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";

const { Title, Text } = Typography;

function StreamRoom({ showId, channelName, onBack }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [error, setError] = useState(null);
  const [createdLivestreamId, setCreatedLivestreamId] = useState(null);

  // GetStream.io configuration
  const [streamConfig, setStreamConfig] = useState({
    apiKey: "", // Will be retrieved from API response
    token: "", // Will be retrieved via API
    streamId: "", // Will be assigned when livestream is created
    rtmpUrl:
      "rtmps://ingress.stream-io-video.com:443/z87auffz2r8y.livestream.livestream_fd030251-d4c7-43de-9908-fbe0551a3799",
    rtmpStreamKey:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoibWluaF9oaWV1NiIsImlhdCI6MTc0NDE0MDYxN30.d2s7SeZ4aLrSrq4LMdxuvfrFtSN5SEeVjKiCMCEmGOM",
    playbackUrl: "",
  });

  // Refs cho video player và Stream SDK client
  const videoRef = useRef(null);
  const streamClientRef = useRef(null);
  const callRef = useRef(null);

  // Khởi tạo GetStream.io và tạo livestream - luồng xử lý đã sửa lại
  const createLivestream = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Tạo call ID cho livestream
      const apiKey = "z87auffz2r8y"; // API key của GetStream.io
      const callId = `livestream_${id}_${Date.now()}`; // Tạo ID duy nhất cho livestream
      
      // Tạo URL xem stream (HLS URL)
      const playbackUrl = `https://stream.mux.com/${callId}.m3u8`;
      
      // Bước 1: Tạo livestream mới trong database trước
      const response = await axios.post(
        `/api/livestream/create/${id}`,
        { 
          streamUrl: playbackUrl,
          title: channelName || "Koi Show Livestream",
          description: "Phát sóng trực tiếp cuộc thi cá Koi",
          streamId: callId // Truyền streamId để backend lưu trữ
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Xử lý response từ API
      if (!response?.data?.data?.id) {
        throw new Error("Không nhận được ID livestream từ server");
      }
      
      const livestreamId = response.data.data.id;
      setCreatedLivestreamId(livestreamId);

      // Bước 2: Lấy token phát livestream
      const tokenResponse = await axios.get(
        `/api/livestream/token/${livestreamId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (!tokenResponse?.data?.data) {
        throw new Error("Không nhận được token từ server");
      }

      const hostToken = tokenResponse.data.data;
      
      // Bước 3: Khởi tạo Stream.io Client VỚI TOKEN hợp lệ
      const client = new StreamVideoClient({
        apiKey: apiKey,
        userData: {
          id: `host_${localStorage.getItem("userId") || Date.now()}`,
          name: localStorage.getItem("username") || "Host",
          image: "https://getstream.io/random_svg/?name=Host",
        },
        token: hostToken, // Sử dụng token từ backend
      });
      
      // Giờ mới gọi getOrCreate() sau khi đã có token hợp lệ
      const call = client.call("livestream", callId);
      await call.getOrCreate();
      
      // Lấy thông tin RTMP để cấu hình OBS
      const rtmpData = await call.getRtmpInfo();

      // Lưu references cho việc sử dụng sau này
      streamClientRef.current = client;
      callRef.current = call;
      
      // Cập nhật toàn bộ thông tin cấu hình stream
      setStreamConfig({
        apiKey: apiKey,
        token: hostToken,
        streamId: callId,
        rtmpUrl: rtmpData.rtmpServer,
        rtmpStreamKey: rtmpData.streamKey,
        playbackUrl: playbackUrl // URL đã tạo ở bước 1
      });

      // Bước 4: Bắt đầu phát livestream
      setIsStreaming(true);
      message.success("Đã tạo phiên livestream thành công!");

      // Bắt đầu lắng nghe số lượng người xem
      setupViewerCountListener(call);

      setLoading(false);
    } catch (error) {
      console.error("Lỗi khi tạo stream:", error);
      setError("Không thể tạo phiên livestream. Vui lòng thử lại sau.");
      setLoading(false);
    }
  };

  // Thiết lập listener để theo dõi số lượng người xem qua GetStream.io SDK
  const setupViewerCountListener = (call) => {
    if (!call) return;

    // Lắng nghe sự kiện tham gia
    call.on("call.participant_joined", () => {
      setViewerCount((prev) => prev + 1);
    });

    // Lắng nghe sự kiện rời đi
    call.on("call.participant_left", () => {
      setViewerCount((prev) => Math.max(0, prev - 1));
    });

    // Khởi tạo số lượng người tham gia ban đầu
    setViewerCount(call.state.participants.length - 1); // Trừ người phát sóng
  };

  // Lấy số lượng người xem từ API
  const fetchViewerCount = async () => {
    if (!createdLivestreamId) return;

    try {
      const response = await axios.get(
        `/api/livestream/${createdLivestreamId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (response.data.data) {
        setViewerCount(response.data.data.viewerCount || 0);
      }
    } catch (error) {
      console.error("Lỗi khi lấy số người xem:", error);
    }
  };

  // Cập nhật số người xem theo định kỳ
  useEffect(() => {
    let interval;

    if (isStreaming && createdLivestreamId) {
      interval = setInterval(fetchViewerCount, 10000); // Cập nhật mỗi 10 giây
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStreaming, createdLivestreamId]);

  // Bước 5: Kết thúc livestream
  const endStreamSession = async () => {
    if (!createdLivestreamId) {
      message.error("Không tìm thấy ID phiên livestream");
      return;
    }

    try {
      setLoading(true);

      // Gọi API kết thúc livestream
      await axios.post(
        `/api/livestream/end/${createdLivestreamId}`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      // Kết thúc call trong GetStream.io nếu có
      if (callRef.current) {
        try {
          // Dừng ghi nếu có (optional)
          await callRef.current.stopRecording();
          // Kết thúc call
          await callRef.current.endCall();
        } catch (streamError) {
          console.warn("Lỗi khi kết thúc GetStream call:", streamError);
          // Tiếp tục xử lý ngay cả khi kết thúc stream bị lỗi
        }
      }

      // Ngắt kết nối client nếu có
      if (streamClientRef.current) {
        try {
          await streamClientRef.current.disconnectUser();
        } catch (disconnectError) {
          console.warn("Lỗi khi ngắt kết nối client:", disconnectError);
        }
      }

      // Gọi API kết thúc livestream ở backend
      await axios.post(
        `/api/livestream/end/${createdLivestreamId}`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      // Reset trạng thái
      setIsStreaming(false);
      setViewerCount(0);
      setCreatedLivestreamId(null);
      setStreamConfig({
        ...streamConfig,
        streamId: "",
        rtmpUrl: "",
        rtmpStreamKey: "",
        playbackUrl: "",
      });

      setLoading(false);

      message.success("Đã kết thúc phiên livestream thành công");
    } catch (error) {
      console.error("Lỗi khi kết thúc stream:", error);
      message.error("Có lỗi xảy ra khi kết thúc phiên livestream!");
      setLoading(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text, description) => {
    navigator.clipboard.writeText(text);
    message.success(`${description} đã được sao chép vào clipboard`);
  };

  // Chia sẻ stream
  const shareStream = () => {
    const viewerUrl = `${window.location.origin}/koishow/livestream/view?streamId=${createdLivestreamId}`;
    copyToClipboard(viewerUrl, "URL xem livestream");
    notification.success({
      message: "Đã sao chép liên kết stream!",
      description:
        "Chia sẻ liên kết này với người xem để họ xem livestream của bạn.",
    });
  };

  // Quay lại
  const handleBack = () => {
    if (isStreaming) {
      if (window.confirm("Bạn có chắc muốn dừng stream và quay lại không?")) {
        endStreamSession();
        if (onBack) onBack();
        else navigate(-1);
      }
    } else {
      if (onBack) onBack();
      else navigate(-1);
    }
  };

  return (
    <div className="stream-room-container p-4 bg-gray-50 min-h-screen">
      <Card className="mb-4 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
              className="mr-4"
            >
              Quay lại
            </Button>
            <Title level={4} className="m-0 mr-3">
              Livestream: {channelName || "Cuộc thi cá Koi"}
            </Title>
            <Tag
              color={isStreaming ? "green" : "blue"}
              style={{ fontSize: "14px" }}
            >
              {isStreaming ? (
                <>
                  <EyeOutlined /> Đang phát ({viewerCount} người xem)
                </>
              ) : (
                "Chưa phát sóng"
              )}
            </Tag>
          </div>
          <Space>
            {!isStreaming ? (
              <Button
                type="primary"
                onClick={createLivestream}
                icon={<PlayCircleOutlined />}
                loading={loading}
              >
                Bắt đầu phát sóng
              </Button>
            ) : (
              <Button
                danger
                onClick={endStreamSession}
                icon={<StopOutlined />}
                loading={loading}
              >
                Dừng phát sóng
              </Button>
            )}
            <Button
              onClick={shareStream}
              type="default"
              icon={<LinkOutlined />}
              disabled={!isStreaming}
            >
              Chia sẻ stream
            </Button>
          </Space>
        </div>
      </Card>

      {loading ? (
        <Card className="shadow-md">
          <div
            className="flex justify-center items-center"
            style={{ height: "300px" }}
          >
            <Spin size="large" />
            <Text className="ml-3">Đang tải cấu hình stream...</Text>
          </div>
        </Card>
      ) : error ? (
        <Card className="shadow-md">
          <Alert
            message="Lỗi"
            description={error}
            type="error"
            showIcon
            action={
              <Button type="primary" onClick={() => window.location.reload()}>
                Thử lại
              </Button>
            }
          />
        </Card>
      ) : (
        <Row gutter={16}>
          <Col span={16}>
            <Card title="Xem trước livestream" className="shadow-md mb-4">
              <div
                className="stream-preview bg-black rounded flex justify-center items-center"
                style={{ height: "400px", overflow: "hidden" }}
              >
                {isStreaming && streamConfig.playbackUrl ? (
                  <video
                    ref={videoRef}
                    className="w-full h-full"
                    controls
                    autoPlay
                    muted
                    poster="/path/to/placeholder-image.jpg"
                  >
                    <source
                      src={streamConfig.playbackUrl}
                      type="application/x-mpegURL"
                    />
                    Trình duyệt của bạn không hỗ trợ thẻ video.
                  </video>
                ) : (
                  <div className="text-center text-white">
                    <PlayCircleOutlined style={{ fontSize: "48px" }} />
                    <p className="mt-2">Bắt đầu phát sóng để xem trước</p>
                  </div>
                )}
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card title="Cấu hình Livestream" className="shadow-md">
              <div>
                {!isStreaming ? (
                  <>
                    <Alert
                      message="Bắt đầu livestream"
                      description={
                        <div>
                          <p>
                            Nhấn nút bên dưới để tạo một phiên livestream với
                            GetStream.io. Sau khi tạo, bạn sẽ nhận được thông
                            tin cấu hình cho OBS Studio.
                          </p>
                        </div>
                      }
                      type="info"
                      showIcon
                      className="mb-4"
                    />

                    <Button
                      type="primary"
                      onClick={createLivestream}
                      style={{ marginTop: "8px" }}
                      icon={<PlayCircleOutlined />}
                      className="mb-3"
                      loading={loading}
                    >
                      Tạo phiên livestream
                    </Button>
                  </>
                ) : (
                  <>
                    <Alert
                      message="Đang phát sóng"
                      description="Cấu hình OBS Studio hoặc phần mềm livestream khác với thông tin bên dưới và bắt đầu stream."
                      type="success"
                      showIcon
                      className="mb-4"
                    />

                    <div className="mb-3">
                      <Text strong className="block mb-2">
                        Stream ID
                      </Text>
                      <Input.Group compact>
                        <Input
                          style={{ width: "calc(100% - 32px)" }}
                          value={streamConfig.streamId}
                          readOnly
                        />
                        <Tooltip title="Sao chép">
                          <Button
                            icon={<CopyOutlined />}
                            onClick={() =>
                              copyToClipboard(
                                streamConfig.streamId,
                                "Stream ID"
                              )
                            }
                          />
                        </Tooltip>
                      </Input.Group>
                    </div>

                    <div className="mb-3">
                      <Text strong className="block mb-2">
                        RTMP URL (Server)
                      </Text>
                      <Input.Group compact>
                        <Input
                          style={{ width: "calc(100% - 32px)" }}
                          value={streamConfig.rtmpUrl}
                          readOnly
                        />
                        <Tooltip title="Sao chép">
                          <Button
                            icon={<CopyOutlined />}
                            onClick={() =>
                              copyToClipboard(streamConfig.rtmpUrl, "RTMP URL")
                            }
                          />
                        </Tooltip>
                      </Input.Group>
                    </div>

                    <div className="mb-3">
                      <Text strong className="block mb-2">
                        Stream Key
                      </Text>
                      <Input.Group compact>
                        <Input.Password
                          style={{ width: "calc(100% - 32px)" }}
                          value={streamConfig.rtmpStreamKey}
                          readOnly
                        />
                        <Tooltip title="Sao chép">
                          <Button
                            icon={<CopyOutlined />}
                            onClick={() =>
                              copyToClipboard(
                                streamConfig.rtmpStreamKey,
                                "Stream Key"
                              )
                            }
                          />
                        </Tooltip>
                      </Input.Group>
                    </div>

                    <div className="mb-3">
                      <Text strong className="block mb-2">
                        URL Xem livestream
                      </Text>
                      <Input.Group compact>
                        <Input
                          style={{ width: "calc(100% - 32px)" }}
                          value={`${window.location.origin}/koishow/livestream/view?streamId=${createdLivestreamId}`}
                          readOnly
                        />
                        <Tooltip title="Chia sẻ">
                          <Button
                            icon={<LinkOutlined />}
                            onClick={shareStream}
                          />
                        </Tooltip>
                      </Input.Group>
                    </div>

                    <Alert
                      message="Hướng dẫn cấu hình OBS Studio"
                      description={
                        <div>
                          <ol className="pl-5">
                            <li>Mở OBS Studio</li>
                            <li>Vào mục Settings {">"}Stream</li>
                            <li>Chọn Service: Custom</li>
                            <li>Dán RTMP URL vào trường Server</li>
                            <li>Dán Stream Key vào trường Stream Key</li>
                            <li>Nhấn OK và bắt đầu Stream trong OBS</li>
                          </ol>
                        </div>
                      }
                      type="info"
                      showIcon
                      className="mb-4"
                    />

                    <div className="mt-4">
                      <Button
                        danger
                        icon={<StopOutlined />}
                        onClick={endStreamSession}
                      >
                        Kết thúc livestream
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}

export default StreamRoom;
