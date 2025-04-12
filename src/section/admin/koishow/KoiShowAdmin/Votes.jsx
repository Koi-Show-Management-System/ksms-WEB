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
} from "@ant-design/icons";
import useVote from "../../../../hooks/useVote";
import moment from "moment";
import { Loading } from "../../../../components";
import CountUp from "react-countup";
import SignalRService from "../../../../config/signalRService";

const { TabPane } = Tabs;

// Hình ảnh mặc định khi không có ảnh
const PLACEHOLDER_IMAGE = "https://via.placeholder.com/150?text=No+Image";

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

  const {
    votes,
    loading,
    fetchVotes,
    UpdateEnableVoting,
    UpdateDisableVoting,
  } = useVote();

  // Thiết lập kết nối SignalR
  useEffect(() => {
    const setupSignalR = async () => {
      if (votingActive && showId) {
        try {
          // Kết nối với vote hub
          await SignalRService.startVoteConnection();

          // Đăng ký nhận cập nhật phiếu bầu
          const unsubscribe = SignalRService.subscribeToVoteUpdates((data) => {
            // Cập nhật UI khi có phiếu bầu mới
            if (data && data.registrationId && data.voteCount) {
              updateVoteCount(data.registrationId, data.voteCount);
            }
          });

          // Lưu hàm unsubscribe để dọn dẹp sau này
          unsubscribeRef.current = unsubscribe;
        } catch (error) {
          console.error("Failed to connect to SignalR:", error);
        }
      }
    };

    setupSignalR();

    // Dọn dẹp khi component unmount hoặc trạng thái thay đổi
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      // Ngắt kết nối nếu không còn active
      if (!votingActive) {
        SignalRService.stopVoteConnection();
      }
    };
  }, [showId, votingActive]);

  // Hàm cập nhật số phiếu khi nhận được thông báo từ SignalR
  const updateVoteCount = (registrationId, newVoteCount) => {
    // Tạo bản sao của mảng votes
    const updatedVotes = [...votes];
    const voteIndex = updatedVotes.findIndex(
      (vote) => vote.registrationId === registrationId
    );

    if (voteIndex !== -1) {
      // Lưu giá trị cũ để animation
      const oldVoteCount = updatedVotes[voteIndex].voteCount;

      // Cập nhật dữ liệu cục bộ
      setPreviousVotes((prev) => ({
        ...prev,
        [registrationId]: oldVoteCount,
      }));

      // Cập nhật số phiếu mới
      updatedVotes[voteIndex] = {
        ...updatedVotes[voteIndex],
        voteCount: newVoteCount,
      };

      // Hiển thị thông báo
      notification.info({
        message: "Có bình chọn mới",
        description: `${updatedVotes[voteIndex].koiName || updatedVotes[voteIndex].registrationNumber} vừa nhận được một phiếu bầu mới!`,
        placement: "bottomRight",
        duration: 3,
      });
    }
  };

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

  // Thiết lập polling để cập nhật số phiếu tự động (backup khi SignalR không hoạt động)
  useEffect(() => {
    if (showId && votingActive) {
      const interval = setInterval(() => {
        fetchVotes(showId);
      }, 30000); // Cập nhật mỗi 30 giây

      return () => clearInterval(interval);
    }
  }, [showId, votingActive, fetchVotes]);

  useEffect(() => {
    if (showId) {
      fetchVotes(showId).then((data) => {
        // Assuming the API response includes voting status information
        // If not, you'll need to modify your API to include this information
        if (data && data.length > 0 && data[0].votingStatus) {
          setVotingActive(data[0].votingStatus.isActive || false);
          setVotingEndTime(data[0].votingStatus.endTime || null);
        }
      });
    }
  }, [showId]);

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

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">Quản lý bình chọn</h2>
        <Space>{renderVotingControls()}</Space>
      </div>

      <Table
        columns={columns}
        dataSource={votes}
        rowKey="registrationId"
        loading={loading}
        pagination={{
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100"],
          showTotal: (total, range) => `${range[0]}-${range[1]} trong ${total}`,
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
