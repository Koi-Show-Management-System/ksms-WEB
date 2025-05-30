import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  useLayoutEffect,
} from "react";
import { Collapse, Timeline, Card, Image, Tabs, Modal, message } from "antd";
import dayjs from "dayjs";
import { EyeOutlined } from "@ant-design/icons";
import sponsorLogo1 from "../../assets/sponsorLogo1.png";
import Category from "./Category";
import koiFishImage from "../../assets/koiFishImage.png";
import { useParams } from "react-router-dom";
import { Loading } from "../../components";
import useKoiShow from "../../hooks/useKoiShow";
import Rules from "./Rules";
import Tank from "../admin/koishow/KoiShowAdmin/Tank";
import Registration from "../admin/koishow/KoiShowAdmin/Registration";
import ScanQr from "./ScanQr";
import CompetitionRound from "../admin/koishow/KoiShowAdmin/CompetitionRound";
import Ticket from "../admin/koishow/KoiShowAdmin/Ticket";
import ScanQrWrapper from "./ScanQrWrapper";
import LiveStream from "./LiveStream";
import RoundResult from "../admin/koishow/KoiShowAdmin/RoundResult";
import CheckOutKoi from "./CheckOutKoi";
import Votes from "../admin/koishow/KoiShowAdmin/Votes";
import StatusManager from "../admin/koishow/KoiShowAdmin/StatusManager";
import useCategory from "../../hooks/useCategory";

// Tạo một component LiveStream độc lập để ngăn re-render
function PersistentLiveStream({ showId, visible }) {
  // Dùng ref để lưu trữ phiên bản LiveStream được tạo một lần duy nhất
  const streamContainerRef = useRef(null);
  const streamInstanceRef = useRef(null);
  const [initialized, setInitialized] = useState(false);

  // Chỉ khởi tạo LiveStream một lần duy nhất
  useEffect(() => {
    if (!streamInstanceRef.current) {
      streamInstanceRef.current = <LiveStream showId={showId} />;
      setInitialized(true);
    }
  }, [showId]);

  // Chỉ ẩn/hiện container khi cần thiết
  useLayoutEffect(() => {
    if (streamContainerRef.current) {
      streamContainerRef.current.style.display = visible ? "block" : "none";
    }
  }, [visible]);

  return (
    <div
      ref={streamContainerRef}
      className="persistent-livestream-wrapper"
      style={{
        display: visible ? "block" : "none",
        position: "relative",
        zIndex: 10,
      }}
    >
      {initialized && streamInstanceRef.current}
    </div>
  );
}

// Tạo persistent component cho Registration
function PersistentRegistration({
  showId,
  statusShow,
  cancelledCategoryIds,
  visible,
}) {
  const componentRef = useRef(null);
  const instanceRef = useRef(null);
  const [initialized, setInitialized] = useState(false);

  // Chỉ khởi tạo Registration một lần duy nhất
  useEffect(() => {
    if (!instanceRef.current && showId) {
      instanceRef.current = (
        <Registration
          showId={showId}
          statusShow={statusShow}
          cancelledCategoryIds={cancelledCategoryIds}
        />
      );
      setInitialized(true);
    }
  }, [showId, statusShow, cancelledCategoryIds]);

  // Chỉ ẩn/hiện container khi cần thiết
  useLayoutEffect(() => {
    if (componentRef.current) {
      componentRef.current.style.display = visible ? "block" : "none";
    }
  }, [visible]);

  return (
    <div
      ref={componentRef}
      style={{
        display: visible ? "block" : "none",
      }}
    >
      {initialized && instanceRef.current}
    </div>
  );
}

function KoiShowDetail() {
  const { id } = useParams();
  const { koiShowDetail, isLoading, fetchKoiShowDetail } = useKoiShow();
  const { categories, fetchCategories } = useCategory();
  const [cancelledCategoryIds, setCancelledCategoryIds] = useState([]);

  const [showAll, setShowAll] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState("category");

  // Xác định có hiển thị LiveStream hay không
  const isLiveStreamVisible = activeTabKey === "liveStream";
  // Xác định có hiển thị Registration hay không
  const isRegistrationVisible = activeTabKey === "registration";

  // Thêm useEffect để lấy danh sách hạng mục bị hủy - giống như admin
  useEffect(() => {
    const getCancelledCategories = async () => {
      try {
        await fetchCategories(id);

        // Lọc ra các hạng mục bị hủy
        const cancelledIds = categories
          .filter((category) => category.status === "cancelled")
          .map((category) => category.id);

        setCancelledCategoryIds(cancelledIds);
      } catch (error) {
        console.error("Error fetching cancelled categories:", error);
      }
    };

    if (id) {
      getCancelledCategories();
    }
  }, [id, fetchCategories]);

  // Các tab thông thường
  const renderNormalTab = (key) => {
    if (key !== activeTabKey) return null;
    if (!koiShowDetail?.data) return null;

    const showRule = koiShowDetail?.data?.showRules;

    switch (key) {
      case "category":
        return (
          <Category showId={id} statusShow={koiShowDetail.data.showStatuses} />
        );
      // Registration được quản lý riêng bởi PersistentRegistration component
      case "registration":
        return null;
      case "ticket":
        return <Ticket showId={id} />;
      case "tank":
        return <Tank showId={id} />;
      case "scanQr":
        return <ScanQrWrapper />;
      case "competitionRound":
        return <CompetitionRound showId={id} />;
      case "roundResult":
        return <RoundResult showId={id} />;
      case "votes":
        return <Votes showId={id} />;
      case "checkOutKoi":
        return <CheckOutKoi showId={id} />;
      case "rules":
        return <Rules showId={id} showRule={showRule} />;
      default:
        return null;
    }
  };

  // Xây dựng danh sách tabs
  const items = useMemo(() => {
    if (!koiShowDetail?.data) return [];

    return [
      {
        key: "category",
        label: "Hạng Mục",
        children: renderNormalTab("category"),
      },
      {
        key: "registration",
        label: "Đơn Đăng Ký",
        children: renderNormalTab("registration"),
      },
      {
        key: "ticket",
        label: "Quản lý vé",
        children: renderNormalTab("ticket"),
      },
      {
        key: "tank",
        label: "Quản Lý bể",
        children: renderNormalTab("tank"),
      },
      {
        key: "scanQr",
        label: "Quét mã",
        children: renderNormalTab("scanQr"),
      },
      {
        key: "competitionRound",
        label: "Vòng thi",
        children: renderNormalTab("competitionRound"),
      },
      {
        key: "roundResult",
        label: "Kết quả cuối cùng",
        children: renderNormalTab("roundResult"),
      },
      {
        key: "votes",
        label: "Bình chọn",
        children: renderNormalTab("votes"),
      },
      {
        key: "checkOutKoi",
        label: "Check out",
        children: renderNormalTab("checkOutKoi"),
      },
      {
        key: "rules",
        label: "Quy tắc",
        children: renderNormalTab("rules"),
      },
      {
        key: "liveStream",
        label: "LiveStream",
        children: <div className="livestream-placeholder"></div>,
      },
    ];
  }, [id, koiShowDetail?.data, activeTabKey]);

  useEffect(() => {
    fetchKoiShowDetail(id);
  }, [id, fetchKoiShowDetail]);

  if (isLoading) return <Loading />;

  if (!koiShowDetail) {
    return (
      <p className="text-red-500 text-center">Không có thông tin triển lãm.</p>
    );
  }

  const sponsors = koiShowDetail?.data?.sponsors || [];
  const displaySponsors = showAll ? sponsors : sponsors.slice(0, 2);
  const extraCount = sponsors.length - 2;
  const showRule = koiShowDetail?.data?.showRules;

  const statusMapping = {
    RegistrationOpen: { label: "Có Thể Đăng Ký", color: "blue" },
    RegistrationClosed: { label: "Đóng Đăng Ký", color: "red" },
    CheckIn: { label: "Điểm danh", color: "cyan" },
    Preliminary: { label: "Vòng Sơ Khảo", color: "green" },
    Evaluation: { label: "Vòng Đánh Giá Chính", color: "purple" },
    Final: { label: "Vòng Chung Kết", color: "orange" },
    GrandChampion: { label: "Grand Champion", color: "yellow" },
    Completed: { label: "Hoàn Thành ", color: "gray" },
    Exhibition: { label: "Triễn Lãm ", color: "teal" },
    Finished: { label: "Kết Thúc", color: "brown" },
  };

  const formatDate = (date) => dayjs(date).format("DD/MM/YYYY");
  const formatTime = (date) => dayjs(date).format("hh:mm A");

  return (
    <div className="max-w-8xl mx-auto p-2 md:p-4">
      <Collapse
        defaultActiveKey={["info"]}
        ghost
        items={[
          {
            key: "info",
            label: (
              <div className="flex items-center justify-between w-full">
                <h1 className="text-xl md:text-2xl font-semibold">
                  {koiShowDetail.data.name}
                </h1>
              </div>
            ),
            children: (
              <>
                <p className="text-gray-600 text-sm md:text-base">
                  {koiShowDetail.data.description}
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 my-4">
                  <div className="lg:col-span-2">
                    <div className="mb-4">
                      <div className="flex justify-center lg:justify-start mb-6">
                        <Image
                          src={koiShowDetail.data.imgUrl || koiFishImage}
                          alt="Cá Koi"
                          className="w-full h-[280px] sm:h-[320px] md:h-[380px] lg:h-[420px] xl:h-[480px] object-cover rounded-lg shadow-md"
                          preview={{
                            mask: (
                              <div className="flex items-center justify-center">
                                <span className="font-medium text-base">
                                  <EyeOutlined />
                                </span>
                              </div>
                            ),
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="mt-2">
                          <Collapse
                            defaultActiveKey={["1"]}
                            items={[
                              {
                                key: "1",
                                label: (
                                  <span className="font-medium">
                                    Lịch Trình Sự Kiện
                                  </span>
                                ),
                                children: (
                                  <div className="space-y-2 text-sm md:text-sm">
                                    <div className="flex flex-col md:flex-row md:justify-between">
                                      <span className="font-medium">
                                        Thời gian bắt đầu:
                                      </span>
                                      <span>
                                        {new Date(
                                          koiShowDetail.data.startDate
                                        ).toLocaleDateString("vi-VN")}{" "}
                                        {formatTime(
                                          koiShowDetail.data.startDate
                                        )}
                                      </span>
                                    </div>
                                    <div className="flex flex-col md:flex-row md:justify-between">
                                      <span className="font-medium">
                                        Thời gian kết thúc:
                                      </span>
                                      <span>
                                        {new Date(
                                          koiShowDetail.data.endDate
                                        ).toLocaleDateString("vi-VN")}{" "}
                                        {formatTime(koiShowDetail.data.endDate)}
                                      </span>
                                    </div>
                                    <div className="flex flex-col md:flex-row md:justify-between">
                                      <span className="font-medium">
                                        Số người tham gia:
                                      </span>
                                      <span>
                                        {koiShowDetail.data.minParticipants} -{" "}
                                        {koiShowDetail.data.maxParticipants}{" "}
                                        người
                                      </span>
                                    </div>
                                    <div className="flex flex-col md:flex-row md:justify-between">
                                      <span className="font-medium">
                                        Địa điểm:
                                      </span>
                                      <span>{koiShowDetail.data.location}</span>
                                    </div>
                                  </div>
                                ),
                              },
                            ]}
                          />
                        </div>

                        <div className="mt-2">
                          <Collapse
                            defaultActiveKey={["2"]}
                            items={[
                              {
                                key: "2",
                                label: <span className="font-medium">Vé</span>,
                                children: (
                                  <div className="space-y-2 text-sm md:text-sm">
                                    {koiShowDetail.data.ticketTypes.length >
                                    0 ? (
                                      koiShowDetail.data.ticketTypes.map(
                                        (ticket) => (
                                          <div
                                            key={ticket.id}
                                            className="flex flex-col md:flex-row md:justify-between"
                                          >
                                            <span>{ticket.name}</span>
                                            <div className="flex justify-between md:block">
                                              <span className="text-blue-600">
                                                {new Intl.NumberFormat(
                                                  "vi-VN",
                                                  {
                                                    style: "currency",
                                                    currency: "VND",
                                                  }
                                                ).format(ticket.price)}
                                              </span>
                                              <span className="ml-2 text-gray-500">
                                                ({ticket.availableQuantity} vé)
                                              </span>
                                            </div>
                                          </div>
                                        )
                                      )
                                    ) : (
                                      <div className="text-gray-500">
                                        Chưa có thông tin vé
                                      </div>
                                    )}
                                  </div>
                                ),
                              },
                            ]}
                          />
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-black/[0.02] p-3 md:p-4 rounded-lg">
                          <h3 className="font-bold mb-3 text-base md:text-lg">
                            Tài Trợ
                          </h3>
                          <div className="grid grid-cols-2 gap-3 md:gap-4 relative">
                            {displaySponsors.map((sponsor, index) => (
                              <div
                                key={sponsor.id}
                                className="relative flex justify-center items-center"
                              >
                                <Image
                                  src={sponsor.logoUrl || sponsorLogo1}
                                  alt={`Tài Trợ ${index + 1}`}
                                  className="rounded-xl"
                                  width={180}
                                  height={180}
                                />
                                {index === 1 && extraCount > 0 && (
                                  <div
                                    onClick={() => setIsModalOpen(true)}
                                    className="absolute inset-0 bg-black bg-opacity-50 rounded-xl flex items-center justify-center cursor-pointer"
                                  >
                                    <span className="text-white font-semibold text-base md:text-lg">
                                      +{extraCount}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          <Modal
                            title="Tất cả nhà tài trợ"
                            open={isModalOpen}
                            onCancel={() => setIsModalOpen(false)}
                            footer={null}
                            width={700}
                          >
                            <div className="grid grid-cols-2 gap-5">
                              {sponsors.map((sponsor) => (
                                <Image
                                  key={sponsor.id}
                                  src={sponsor.logoUrl || sponsorLogo1}
                                  alt="Tài trợ"
                                  className="rounded-xl"
                                  width={250}
                                  height={250}
                                />
                              ))}
                            </div>
                          </Modal>
                        </div>

                        <div className="bg-black/[0.02] p-3 md:p-4 rounded-lg">
                          <h3 className="font-bold mb-3 text-base md:text-lg">
                            Tiêu Chí Đánh Giá{" "}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                            {/* Cột 1: Chứa 5 phần tử đầu tiên */}
                            <div className="space-y-2 md:space-y-3">
                              {koiShowDetail.data.criteria
                                .slice(0, 5)
                                .map((criteriaList, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center"
                                  >
                                    <div className="w-6 h-6 md:w-7 md:h-7 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs md:text-sm mr-2 flex-shrink-0">
                                      {index + 1}
                                    </div>
                                    <div className="text-xs md:text-sm">
                                      {criteriaList}
                                    </div>
                                  </div>
                                ))}
                            </div>

                            {/* Cột 2: Chứa các phần tử còn lại */}
                            <div className="space-y-2 md:space-y-3">
                              {koiShowDetail.data.criteria
                                .slice(5)
                                .map((criteriaList, index) => (
                                  <div
                                    key={index + 5}
                                    className="flex items-center"
                                  >
                                    <div className="w-6 h-6 md:w-7 md:h-7 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs md:text-sm mr-2 flex-shrink-0">
                                      {index + 6}
                                    </div>
                                    <div className="text-xs md:text-sm">
                                      {criteriaList}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="mb-4">
                      <StatusManager
                        showId={id}
                        showStatus={koiShowDetail.data.status}
                        showStatuses={koiShowDetail.data.showStatuses}
                        disabled={true}
                      />
                    </div>
                  </div>
                </div>
              </>
            ),
          },
        ]}
      />

      <div className="mt-2 md:mt-4 p-2 md:p-4 relative">
        <Tabs
          defaultActiveKey="category"
          activeKey={activeTabKey}
          onChange={setActiveTabKey}
          items={items}
          size="small"
          tabBarGutter={12}
          className="koishow-tabs"
        />

        {/* Component Registration tách biệt */}
        <PersistentRegistration
          showId={id}
          statusShow={koiShowDetail.data.status}
          cancelledCategoryIds={cancelledCategoryIds}
          visible={isRegistrationVisible}
        />

        {/* Component LiveStream hoàn toàn tách biệt */}
        <PersistentLiveStream showId={id} visible={isLiveStreamVisible} />
      </div>
    </div>
  );
}

export default KoiShowDetail;
