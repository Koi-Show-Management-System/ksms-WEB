import React, { useState, useEffect, useRef } from "react";
import {
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Space,
  notification,
  Drawer,
  Descriptions,
  Tabs,
  Card,
  InputNumber,
  Image,
  List,
  Avatar,
} from "antd";
import {
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PictureOutlined,
  InfoCircleOutlined,
  TrophyOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CrownOutlined,
  FireOutlined,
  RiseOutlined,
} from "@ant-design/icons";
import useVote from "../../../../hooks/useVote";
import moment from "moment";
import { Loading } from "../../../../components";
import CountUp from "react-countup";
import SignalRService from "../../../../config/signalRService";
import FlipMove from "react-flip-move";
import styled from "styled-components";

const { TabPane } = Tabs;

// Hình ảnh mặc định khi không có ảnh
const PLACEHOLDER_IMAGE = "https://via.placeholder.com/150?text=No+Image";

// Styled components
const VoteListItem = styled.div`
  padding: 16px;
  background: ${(props) =>
    props.isTopVote ? "linear-gradient(to right, #f6ffed, #white)" : "white"};
  border-radius: 8px;
  margin-bottom: 8px;
  box-shadow: ${(props) =>
    props.isTopVote
      ? "0 4px 12px rgba(82, 196, 26, 0.15)"
      : "0 2px 8px rgba(0, 0, 0, 0.05)"};
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
  border-left: 4px solid ${(props) => (props.isTopVote ? "#52c41a" : "#f0f0f0")};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${(props) =>
      props.isTopVote
        ? "0 6px 16px rgba(82, 196, 26, 0.2)"
        : "0 4px 12px rgba(0, 0, 0, 0.1)"};
  }

  ${(props) =>
    props.isTopVote &&
    `
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(45deg, transparent 96%, #52c41a 97%, #52c41a 100%);
      border-radius: 8px;
      pointer-events: none;
    }
  `}
`;

const ImageWrapper = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  margin-right: 16px;
  ${(props) =>
    props.isTopVote &&
    `
    box-shadow: 0 0 0 2px #52c41a;
  `}
`;

const InfoWrapper = styled.div`
  flex: 1;
`;

const VoteCountWrapper = styled.div`
  display: flex;
  align-items: center;
  padding: 0 12px;
  font-weight: bold;
  font-size: 18px;
  flex-shrink: 0;
  color: ${(props) => (props.highlighted ? "#1890ff" : "#000")};
`;

const RankBadge = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  background: ${(props) => {
    if (props.rank === 1) return "linear-gradient(45deg, #FFD700, #FFA500)";
    if (props.rank === 2) return "linear-gradient(45deg, #C0C0C0, #A9A9A9)";
    if (props.rank === 3) return "linear-gradient(45deg, #CD7F32, #8B4513)";
    return "#f0f0f0";
  }};
  margin-right: 8px;
`;

// Component hiển thị số phiếu với animation
const AnimatedVoteCount = ({ value, previousValue }) => {
  // Nếu không có giá trị trước đó, hoặc giá trị không thay đổi, hiển thị bình thường
  if (previousValue === undefined || previousValue === value) {
    return <span>{value}</span>;
  }

  // Nếu có thay đổi, hiển thị animation
  return (
    <CountUp
      start={previousValue}
      end={value}
      duration={1}
      separator=","
      className={value > previousValue ? "text-green-600" : "text-red-600"}
    />
  );
};

const TopVoteIcon = styled(TrophyOutlined)`
  color: gold;
  font-size: 16px;
  margin-left: 8px;
`;

// Component hiển thị dòng trong danh sách bình chọn
const VoteItem = React.forwardRef(
  ({ item, previousVotes, onDetails, highlighted, isTopVote }, ref) => (
    <div ref={ref} style={{ position: "relative" }}>
      <VoteListItem isTopVote={isTopVote}>
        <ImageWrapper isTopVote={isTopVote}>
          {item.koiMedia && item.koiMedia.length > 0 ? (
            <Image
              src={
                item.koiMedia.find((m) => m.mediaType === "Image")?.mediaUrl ||
                PLACEHOLDER_IMAGE
              }
              alt={item.koiName || item.registrationNumber}
              preview={false}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "#f5f5f5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PictureOutlined style={{ color: "#d9d9d9", fontSize: "24px" }} />
            </div>
          )}
        </ImageWrapper>

        <InfoWrapper>
          <div
            style={{
              fontWeight: "bold",
              marginBottom: "4px",
              display: "flex",
              alignItems: "center",
            }}
          >
            {item.koiName || item.registrationNumber}
            {isTopVote && <TopVoteIcon />}
            {highlighted && (
              <Tag color="orange" style={{ marginLeft: "8px" }}>
                Mới cập nhật
              </Tag>
            )}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            {item.registrationNumber} - {item.koiVariety}, {item.size}cm
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            Chủ sở hữu: {item.ownerName}
          </div>
        </InfoWrapper>

        <VoteCountWrapper highlighted={highlighted}>
          {highlighted ? (
            <AnimatedVoteCount
              value={item.voteCount}
              previousValue={previousVotes[item.registrationId]}
            />
          ) : (
            item.voteCount
          )}
          <FireOutlined
            style={{
              color: isTopVote ? "gold" : "#ff4d4f",
              marginLeft: "4px",
              fontSize: "16px",
            }}
          />
        </VoteCountWrapper>

        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => onDetails(item)}
          size="small"
          style={{ marginLeft: "8px" }}
        />
      </VoteListItem>
      {isTopVote && (
        <div
          style={{
            position: "absolute",
            top: -5,
            right: 10,
            background: "#52c41a",
            color: "white",
            padding: "2px 8px",
            borderRadius: "12px",
            fontSize: "12px",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.15)",
          }}
        >
          Dẫn đầu
        </div>
      )}
    </div>
  )
);

// Countdown component for time remaining
const CountdownTimer = ({ endTime, onTimerEnd }) => {
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
  });

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const total = end - now;

      if (total <= 0) {
        if (onTimerEnd) onTimerEnd();
        return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
      }

      const days = Math.floor(total / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((total % (1000 * 60)) / 1000);

      return { days, hours, minutes, seconds, total };
    };

    setTimeRemaining(calculateTimeRemaining());

    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);

      if (remaining.total <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, onTimerEnd]);

  return (
    <div className="flex items-center gap-1">
      <ClockCircleOutlined className="mr-1" />
      <span className="font-medium">
        {String(timeRemaining.hours).padStart(2, "0")}:
        {String(timeRemaining.minutes).padStart(2, "0")}:
        {String(timeRemaining.seconds).padStart(2, "0")}
      </span>
    </div>
  );
};

function Votes({ showId }) {
  const [isDetailDrawerVisible, setIsDetailDrawerVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [enableModal, setEnableModal] = useState(false);
  const [votingActive, setVotingActive] = useState(false);
  const [votingEndTime, setVotingEndTime] = useState(null);
  const [votingExpired, setVotingExpired] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(5);
  const [previousVotes, setPreviousVotes] = useState({});
  const unsubscribeRef = useRef(null);
  const [signalRConnected, setSignalRConnected] = useState(false);
  const [sortedVotes, setSortedVotes] = useState([]);
  const [lastUpdatedId, setLastUpdatedId] = useState(null);
  const [viewMode, setViewMode] = useState("cards"); // 'cards' or 'table'
  const [maxVotes, setMaxVotes] = useState(0);

  const {
    votes,
    loading,
    fetchVotes,
    UpdateEnableVoting,
    UpdateDisableVoting,
    updateLocalVoteCount,
  } = useVote();

  // Sắp xếp phiếu bầu theo số phiếu
  useEffect(() => {
    if (votes && votes.length > 0) {
      const sorted = [...votes].sort((a, b) => b.voteCount - a.voteCount);
      setSortedVotes(sorted);
    }
  }, [votes]);

  // Thiết lập kết nối SignalR khi component được mount
  useEffect(() => {
    // Khởi động SignalR khi component được mount
    SignalRService.startVoteConnection()
      .then(() => {
        setSignalRConnected(true);
        console.log("SignalR Vote connected successfully");

        // Đăng ký callback nhận cập nhật phiếu bầu
        const unsubscribe = SignalRService.subscribeToVoteUpdates((data) => {
          if (data && data.registrationId && data.voteCount) {
            updateVoteCount(data.registrationId, data.voteCount);
          }
        });

        unsubscribeRef.current = unsubscribe;
      })
      .catch((err) => {
        console.error("SignalR Vote connection error:", err);
        setSignalRConnected(false);
      });

    // Cleanup khi component unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []);

  // Hàm cập nhật số phiếu khi nhận được thông báo từ SignalR
  const updateVoteCount = (registrationId, newVoteCount) => {
    console.log("Updating vote count in UI:", registrationId, newVoteCount);
    if (!votes || votes.length === 0) {
      console.log("No votes data available, fetching data...");
      fetchVotes(showId);
      return;
    }

    const voteIndex = votes.findIndex(
      (vote) => vote.registrationId === registrationId
    );
    console.log("Found vote at index:", voteIndex);

    if (voteIndex !== -1) {
      // Lưu giá trị cũ để animation
      const oldVoteCount = votes[voteIndex].voteCount;
      console.log(
        "Old vote count:",
        oldVoteCount,
        "New vote count:",
        newVoteCount
      );

      // Đánh dấu ID vừa được cập nhật để hiệu ứng highlight
      setLastUpdatedId(registrationId);

      // Cập nhật dữ liệu cục bộ
      setPreviousVotes((prev) => ({
        ...prev,
        [registrationId]: oldVoteCount,
      }));

      // Cập nhật state của votes trong store
      const updated = updateLocalVoteCount(registrationId, newVoteCount);
      console.log("Local update successful:", updated);

      // Hiển thị thông báo
      notification.info({
        message: "Có bình chọn mới",
        description: `${votes[voteIndex].koiName || votes[voteIndex].registrationNumber} vừa nhận được một phiếu bầu mới!`,
        placement: "bottomRight",
        duration: 3,
      });

      // Xóa highlight sau 5 giây
      setTimeout(() => {
        setLastUpdatedId(null);
      }, 5000);
    } else {
      console.log("Vote not found in current data, fetching new data...");
      fetchVotes(showId);
    }
  };

  // Tải dữ liệu ban đầu và kiểm tra trạng thái bình chọn
  useEffect(() => {
    if (showId) {
      fetchVotes(showId).then((data) => {
        // Kiểm tra trạng thái bình chọn từ API response
        if (data && data.length > 0 && data[0].votingStatus) {
          setVotingActive(data[0].votingStatus.isActive || false);
          setVotingEndTime(data[0].votingStatus.endTime || null);
        }
      });
    }
  }, [showId, fetchVotes]);

  // Check if voting period has ended and update state
  useEffect(() => {
    if (votingActive && votingEndTime) {
      const checkTime = () => {
        const now = new Date();
        const end = new Date(votingEndTime);
        if (now >= end) {
          // Khi hết thời gian, gọi hàm handleVotingTimeout để tắt bình chọn
          // Hàm này sẽ gọi API updateDisableVote trên server để tắt bình chọn
          handleVotingTimeout();
        }
      };

      // Kiểm tra ngay lập tức một lần
      checkTime();
      // Thiết lập interval để kiểm tra mỗi giây
      const interval = setInterval(checkTime, 1000);

      return () => clearInterval(interval);
    }
  }, [votingActive, votingEndTime]);

  // Lưu giá trị phiếu bầu trước đó để so sánh
  useEffect(() => {
    if (votes && votes.length > 0) {
      const voteCounts = {};
      votes.forEach((vote) => {
        voteCounts[vote.registrationId] = vote.voteCount;
      });

      setPreviousVotes((prevState) => {
        // Lần đầu tiên không có dữ liệu cũ
        if (Object.keys(prevState).length === 0) {
          return voteCounts;
        }
        // Sau 2 giây, cập nhật dữ liệu cũ
        setTimeout(() => {
          setPreviousVotes(voteCounts);
        }, 2000);
        return prevState;
      });
    }
  }, [votes]);

  const showDetailDrawer = (record) => {
    setCurrentRecord(record);
    setIsDetailDrawerVisible(true);
  };

  const showEnableModal = () => {
    setEnableModal(true);
  };

  const handleEnableVoting = async () => {
    if (customMinutes <= 0) {
      notification.error({
        message: "Lỗi",
        description: "Vui lòng nhập số phút hợp lệ",
        placement: "topRight",
      });
      return;
    }

    try {
      // Tính thời gian kết thúc dựa trên số phút
      const finalEndTime = moment().add(customMinutes, "minutes");

      await UpdateEnableVoting(showId, finalEndTime.toISOString());
      notification.success({
        message: "Thành công",
        description: "Bật bình chọn thành công",
        placement: "topRight",
      });
      setEnableModal(false);
      setVotingActive(true);
      setVotingEndTime(finalEndTime);

      // Khi bật bình chọn, kết nối SignalR
      try {
        await SignalRService.startVoteConnection();
      } catch (error) {
        console.error("Failed to connect to SignalR on vote enable:", error);
      }

      fetchVotes(showId);
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: "Lỗi khi bật bình chọn",
        placement: "topRight",
      });
    }
  };

  const handleDisableVoting = async () => {
    try {
      await UpdateDisableVoting(showId);
      notification.success({
        message: "Thành công",
        description: "Tắt bình chọn thành công",
        placement: "topRight",
      });
      setVotingActive(false);
      setVotingEndTime(null);
      setVotingExpired(false);

      // Đóng kết nối SignalR khi tắt bình chọn
      SignalRService.stopVoteConnection();

      fetchVotes(showId);
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: "Lỗi khi tắt bình chọn",
        placement: "topRight",
      });
    }
  };

  // Xử lý khi hết thời gian bình chọn
  const handleVotingTimeout = async () => {
    if (votingActive) {
      try {
        // Gọi API tắt bình chọn thông qua useVote
        // API này sẽ gửi request đến server để tắt bình chọn
        await UpdateDisableVoting(showId);

        notification.success({
          message: "Thành công",
          description: "Đã tự động tắt bình chọn do hết thời gian",
          placement: "topRight",
        });

        // Cập nhật trạng thái UI để hiển thị đã tắt bình chọn
        setVotingActive(false);
        setVotingEndTime(null);
        setVotingExpired(true);

        // Tải lại dữ liệu bình chọn mới từ server
        fetchVotes(showId);
      } catch (error) {
        notification.error({
          message: "Lỗi",
          description: "Lỗi khi tự động tắt bình chọn",
          placement: "topRight",
        });
      }
    }
  };

  const columns = [
    {
      title: "Mã Đăng Ký",
      dataIndex: "registrationNumber",
      width: 140,
    },
    {
      title: "Hình ảnh",
      key: "image",
      render: (_, record) => {
        const imageMedia =
          record.koiMedia && record.koiMedia.length > 0
            ? record.koiMedia.find((media) => media.mediaType === "Image")
            : null;

        const imageUrl = imageMedia?.mediaUrl || PLACEHOLDER_IMAGE;

        return (
          <div className="w-[70px] h-[50px] bg-gray-100 flex items-center justify-center rounded-md overflow-hidden">
            <Image
              src={imageUrl}
              alt="Hình cá"
              width={80}
              height={50}
              className="object-cover"
              preview={{
                src: imageMedia?.mediaUrl,
                mask: (
                  <div className="text-xs">
                    <EyeOutlined />
                  </div>
                ),
              }}
              placeholder={
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <Loading />
                </div>
              }
              fallback={PLACEHOLDER_IMAGE}
            />
          </div>
        );
      },
    },
    {
      title: "Kích thước",
      dataIndex: "size",
      render: (size) => `${size} cm`,
    },
    {
      title: "Giống",
      dataIndex: "koiVariety",
    },
    {
      title: "Số Phiếu",
      dataIndex: "voteCount",
      width: 120,
      sorter: (a, b) => a.voteCount - b.voteCount,
      render: (voteCount, record) => (
        <AnimatedVoteCount
          value={voteCount}
          previousValue={previousVotes[record.registrationId]}
        />
      ),
    },
    {
      title: "Chủ sở hữu",
      dataIndex: "ownerName",
    },
    {
      title: "Bể",
      dataIndex: ["roundInfo", "tankNumber"],
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Button
          type="text"
          className="text-gray-500 hover:text-blue-500"
          icon={<EyeOutlined />}
          onClick={() => showDetailDrawer(record)}
          size="small"
        />
      ),
    },
  ];

  // Chuyển đổi giữa chế độ hiển thị
  const toggleViewMode = () => {
    setViewMode(viewMode === "cards" ? "table" : "cards");
  };

  const renderConnectionStatus = () => {
    if (votingActive) {
      return signalRConnected ? (
        <Tag color="green" className="ml-1">
          Realtime
        </Tag>
      ) : null;
    }
    return null;
  };

  // Render voting control buttons based on state
  const renderVotingControls = () => {
    if (votingActive) {
      return (
        <div className="flex items-center">
          <Tag color="green" className="mr-2">
            Bình chọn đang diễn ra
          </Tag>
          {votingEndTime && (
            <div className="flex flex-col">
              <CountdownTimer
                endTime={votingEndTime}
                onTimerEnd={handleVotingTimeout}
              />
            </div>
          )}
          {renderConnectionStatus()}
        </div>
      );
    } else if (
      votingExpired ||
      (votingEndTime && new Date() > new Date(votingEndTime))
    ) {
      return (
        <Button
          type="primary"
          danger
          icon={<CloseCircleOutlined />}
          onClick={handleDisableVoting}
        >
          Tắt bình chọn
        </Button>
      );
    } else {
      return (
        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={showEnableModal}
        >
          Bật bình chọn
        </Button>
      );
    }
  };

  // Xác định số phiếu cao nhất
  useEffect(() => {
    if (sortedVotes && sortedVotes.length > 0) {
      const highestVoteCount = sortedVotes[0].voteCount;
      setMaxVotes(highestVoteCount);
    }
  }, [sortedVotes]);

  // Kiểm tra có phải là phiếu bầu cao nhất
  const isTopVote = (voteCount) => {
    return voteCount > 0 && voteCount === maxVotes;
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">Quản lý bình chọn</h2>
        <Space>
          {renderVotingControls()}
          <Button
            type="text"
            icon={viewMode === "cards" ? <EyeOutlined /> : <FireOutlined />}
            onClick={toggleViewMode}
          >
            {viewMode === "cards" ? "Hiển thị bảng" : "Hiển thị danh sách"}
          </Button>
        </Space>
      </div>

      {viewMode === "table" ? (
        <Table
          columns={columns}
          dataSource={votes}
          rowKey="registrationId"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} trong ${total}`,
            defaultPageSize: 10,
            size: "small",
            itemRender: (page, type, originalElement) => {
              if (type === "prev") {
                return (
                  <Button type="text" size="small">
                    {"<"}
                  </Button>
                );
              }
              if (type === "next") {
                return (
                  <Button type="text" size="small">
                    {">"}
                  </Button>
                );
              }
              return originalElement;
            },
          }}
        />
      ) : (
        <div className="mb-4">
          <FlipMove
            duration={500}
            easing="ease-out"
            enterAnimation="fade"
            leaveAnimation="fade"
            typeName={null}
          >
            {sortedVotes.map((item) => (
              <VoteItem
                key={item.registrationId}
                item={item}
                previousVotes={previousVotes}
                onDetails={showDetailDrawer}
                highlighted={item.registrationId === lastUpdatedId}
                isTopVote={isTopVote(item.voteCount)}
              />
            ))}
          </FlipMove>
        </div>
      )}

      {/* Detail Drawer */}
      <Drawer
        title={
          currentRecord?.koiName
            ? `Chi tiết: ${currentRecord.koiName}`
            : "Chi tiết cá Koi"
        }
        placement="right"
        width={720}
        onClose={() => setIsDetailDrawerVisible(false)}
        open={isDetailDrawerVisible}
      >
        {currentRecord && (
          <Tabs defaultActiveKey="1">
            <TabPane
              tab={
                <span>
                  <InfoCircleOutlined /> Thông tin chung
                </span>
              }
              key="1"
            >
              <Descriptions bordered column={1} className="mb-4">
                <Descriptions.Item label="Tên cá">
                  {currentRecord.koiName}
                </Descriptions.Item>
                <Descriptions.Item label="Mã đăng ký">
                  {currentRecord.registrationNumber}
                </Descriptions.Item>
                <Descriptions.Item label="Hạng mục">
                  {currentRecord.categoryName}
                </Descriptions.Item>
                <Descriptions.Item label="Giống">
                  {currentRecord.koiVariety}
                </Descriptions.Item>
                <Descriptions.Item label="Kích thước">
                  {currentRecord.size} cm
                </Descriptions.Item>
                <Descriptions.Item label="Tuổi">
                  {currentRecord.age} năm
                </Descriptions.Item>
                <Descriptions.Item label="Giới tính">
                  {currentRecord.gender}
                </Descriptions.Item>
                <Descriptions.Item label="Dòng máu">
                  {currentRecord.bloodline}
                </Descriptions.Item>
                <Descriptions.Item label="Bể">
                  {currentRecord.roundInfo?.tankNumber}
                </Descriptions.Item>
              </Descriptions>
            </TabPane>

            <TabPane
              tab={
                <span>
                  <UserOutlined /> Thông tin chủ sở hữu & Hình ảnh
                </span>
              }
              key="2"
            >
              <div className="space-y-6">
                {/* Owner Information */}
                <h3 className="font-medium text-lg mb-4">
                  Thông tin chủ sở hữu
                </h3>
                <Descriptions bordered column={1}>
                  <Descriptions.Item label="Chủ sở hữu">
                    {currentRecord.ownerName}
                  </Descriptions.Item>
                  <Descriptions.Item label="Người đăng ký">
                    {currentRecord.registerName}
                  </Descriptions.Item>
                </Descriptions>

                {/* Images and Videos */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Hình ảnh</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {currentRecord.koiMedia
                      ?.filter((media) => media.mediaType === "Image")
                      .map((media, index) => (
                        <div
                          key={`img-${index}`}
                          className="border rounded-md overflow-hidden"
                        >
                          <img
                            src={media.mediaUrl}
                            alt={`Koi ${index + 1}`}
                            className="w-full h-48 object-cover"
                          />
                        </div>
                      ))}
                  </div>

                  <h3 className="font-medium text-lg mt-6">Video</h3>
                  <div className="space-y-4">
                    {currentRecord.koiMedia
                      ?.filter((media) => media.mediaType === "Video")
                      .map((media, index) => (
                        <div
                          key={`video-${index}`}
                          className="border rounded-md overflow-hidden"
                        >
                          <video
                            src={media.mediaUrl}
                            controls
                            className="w-full"
                          />
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </TabPane>

            <TabPane
              tab={
                <span>
                  <TrophyOutlined /> Thông tin bình chọn
                </span>
              }
              key="4"
            >
              <Descriptions bordered column={1}>
                <Descriptions.Item label="Số lượt bình chọn">
                  <span className="text-xl font-bold text-blue-600">
                    {currentRecord.voteCount}
                  </span>
                </Descriptions.Item>
                {currentRecord.award && (
                  <Descriptions.Item label="Giải thưởng">
                    <div>
                      <Tag color="gold">
                        {currentRecord.award.name || "Không có tên"}
                      </Tag>
                      {/* {currentRecord.award.awardType && (
                          <div className="mt-1">
                            Loại: {currentRecord.award.awardType}
                          </div>
                        )} */}
                      {currentRecord.award.prizeValue && (
                        <div>
                          Giá trị:{" "}
                          {currentRecord.award.prizeValue.toLocaleString()} VND
                        </div>
                      )}
                    </div>
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="Bể thi đấu">
                  {currentRecord.roundInfo?.tankNumber}
                </Descriptions.Item>
              </Descriptions>
            </TabPane>
          </Tabs>
        )}
      </Drawer>

      {/* Enable Voting Modal */}
      <Modal
        title="Bật bình chọn"
        open={enableModal}
        onCancel={() => setEnableModal(false)}
        onOk={handleEnableVoting}
        okText="Xác nhận"
        cancelText="Hủy"
      >
        <Form layout="vertical">
          <Form.Item label="Số phút bình chọn">
            <InputNumber
              min={1}
              value={customMinutes}
              onChange={setCustomMinutes}
              style={{ width: "100%" }}
              placeholder="Nhập số phút bình chọn"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Votes;
