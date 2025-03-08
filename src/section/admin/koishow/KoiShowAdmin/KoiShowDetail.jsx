import React, { useEffect, useState } from "react";
import {
  Collapse,
  Timeline,
  Card,
  Image,
  Tabs,
  Spin,
  notification,
  Modal,
} from "antd";
import dayjs from "dayjs";
import koiFishImage from "../../../../assets/koiFishImage.png";
import sponsorLogo1 from "../../../../assets/sponsorLogo1.png";
import Category from "./Category";
import KoiList from "./KoiList";
import ManageShow from "./ManageShow";
import Votes from "./Votes";
import Rules from "./Rules";
import Sponsor from "./Sponsor";
import CompetitionRound from "./CompetitionRound";
import { useParams } from "react-router-dom";
import useKoiShow from "../../../../hooks/useKoiShow";

function KoiShowDetail() {
  const { Panel } = Collapse;
  const { id } = useParams();
  const { koiShowDetail, isLoading, fetchKoiShowDetail } = useKoiShow();

  const [showAll, setShowAll] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const sponsors = koiShowDetail?.data?.sponsors || [];
  const displaySponsors = showAll ? sponsors : sponsors.slice(0, 2);
  const extraCount = sponsors.length - 2;
  const showRule = koiShowDetail?.data?.showRules;

  const statusMapping = {
    RegistrationOpen: { label: "Có Thể Đăng Ký", color: "blue" },
    RegistrationClosed: { label: "Đóng Đăng Ký", color: "red" },
    CheckIn: { label: "Điểm danh", color: "cyan" },
    Preliminary: { label: "Vòng Sơ Loại", color: "green" },
    Evaluation: { label: "Vòng Đánh Giá", color: "purple" },
    Final: { label: "Vòng Chung Kết", color: "orange" },
    GrandChampion: { label: "Grand Champion", color: "yellow" },
    Completed: { label: "Hoàn Thành ", color: "gray" },
    Exhibition: { lablel: "Triễn Lãm ", color: "teal" },
    Finished: { lablel: "Kết Thúc", color: "brown" },
  };

  const formatDate = (date) => dayjs(date).format("DD/MM/YYYY");
  const formatTime = (date) => dayjs(date).format("hh:mm A");

  useEffect(() => {
    fetchKoiShowDetail(id);
  }, [id]);

  if (isLoading)
    return <Spin size="large" className="flex justify-center mt-10" />;

  if (!koiShowDetail) {
    console.log("Lỗi dữ liệu");

    return (
      <p className="text-red-500 text-center">Không có thông tin triển lãm.</p>
    );
  }
  const items = [
    {
      key: "category",
      label: "Danh Mục",
      children: <Category showId={id} />,
    },
    {
      key: "koiList",
      label: "Đơn Đăng Ký",
      children: <KoiList showId={id} />,
    },
    {
      key: "manageShow",
      label: "Quản Lý Triển Lãm",
      children: <ManageShow showId={id} />,
    },
    {
      key: "competitionRound",
      label: "Vòng Thi",
      children: <CompetitionRound />,
    },
    {
      key: "votes",
      label: "Bình Chọn",
      children: <Votes />,
    },

    {
      key: "rules",
      label: "Quy Tắc",
      children: <Rules showId={id} showRule={showRule} />,
    },
    {
      key: "sponsor",
      label: "Tài Trợ",
      children: <Sponsor />,
    },
  ];

  return (
    <div className="max-w-8xl mx-auto p-3">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">{koiShowDetail.data.name}</h1>
        <p className="text-gray-600">{koiShowDetail.data.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Image
            src={koiShowDetail.data.imgUrl || koiFishImage}
            alt="Cá Koi"
            className="w-[300px] h-[200px] object-cover rounded-lg"
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="mt-4">
              <Collapse defaultActiveKey={["1"]}>
                <Panel header="Lịch Trình Sự Kiện" key="1">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>
                        {new Date(
                          koiShowDetail.data.startDate
                        ).toLocaleDateString("vi-VN")}{" "}
                        - Mở Đăng Ký
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>
                        {new Date(
                          koiShowDetail.data.endDate
                        ).toLocaleDateString("vi-VN")}{" "}
                        - Đóng Đăng Ký
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>
                        {new Date(
                          koiShowDetail.data.startExhibitionDate
                        ).toLocaleDateString("vi-VN")}{" "}
                        - Ngày Bắt Đầu Giải Đấu & Triển Lãm
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>
                        {new Date(
                          koiShowDetail.data.endExhibitionDate
                        ).toLocaleDateString("vi-VN")}{" "}
                        - Ngày Kết Thúc Giải Đấu & Triễn Lãm
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Địa điểm: {koiShowDetail.data.location}</span>
                    </div>
                  </div>
                </Panel>
              </Collapse>
            </div>

            <div className="mt-4">
              <Collapse defaultActiveKey={["2"]}>
                <Panel header="Vé" key="2">
                  <div className="space-y-2">
                    <div>
                      Phí Đăng Ký -{" "}
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(koiShowDetail.data.registrationFee)}
                    </div>

                    {koiShowDetail.data.ticketTypes.map((ticket) => (
                      <div key={ticket.id}>
                        <div>
                          {ticket.name} -{" "}
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(ticket.price)}{" "}
                          || Số lượng : {ticket.availableQuantity} vé
                        </div>
                      </div>
                    ))}

                    <div>
                      Tham gia tối thiểu: {koiShowDetail.data.minParticipants} -
                      Tham gia tối đa: {koiShowDetail.data.maxParticipants}
                    </div>
                  </div>
                </Panel>
              </Collapse>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-black/[0.02] p-4 rounded-lg">
              <h3 className="font-bold mb-4 text-lg">Tài Trợ</h3>
              <div className="grid grid-cols-2 gap-4 relative">
                {displaySponsors.map((sponsor, index) => (
                  <div key={sponsor.id} className="relative">
                    <Image
                      src={sponsor.logoUrl || sponsorLogo1}
                      alt={`Tài Trợ ${index + 1}`}
                      className="rounded-xl"
                      width={150}
                      height={150}
                    />
                    {index === 1 && extraCount > 0 && (
                      <div
                        onClick={() => setIsModalOpen(true)}
                        className="absolute inset-0 bg-black bg-opacity-50 rounded-xl flex items-center justify-center cursor-pointer"
                      >
                        <span className="text-white font-semibold">
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
              >
                <div className="grid grid-cols-2 gap-4">
                  {sponsors.map((sponsor) => (
                    <Image
                      key={sponsor.id}
                      src={sponsor.logoUrl || sponsorLogo1}
                      alt="Tài trợ"
                      className="rounded-xl"
                      width={150}
                      height={150}
                    />
                  ))}
                </div>
              </Modal>
            </div>

            <div className="bg-black/[0.02] p-4 rounded-lg">
              <h3 className="font-bold mb-4 text-lg">Tiêu Chí Đánh Giá </h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Cột 1: Chứa 5 phần tử đầu tiên */}
                <div className="space-y-4">
                  {koiShowDetail.data.criteria
                    .slice(0, 5)
                    .map((criteriaList, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                          {index + 1}
                        </span>
                        <span>{criteriaList}</span>
                      </div>
                    ))}
                </div>

                {/* Cột 2: Chứa các phần tử còn lại */}
                <div className="space-y-4">
                  {koiShowDetail.data.criteria
                    .slice(5)
                    .map((criteriaList, index) => (
                      <div key={index + 5} className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                          {index + 6}
                        </span>
                        <span>{criteriaList}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <Card title="Trạng Thái" className="mb-4">
            <Timeline
              items={koiShowDetail.data.showStatuses.map((status) => {
                const { label, color } = statusMapping[status.statusName] || {
                  label: status.statusName,
                  color: "gray",
                };
                return {
                  key: status.id,
                  color: color,
                  children: (
                    <>
                      <div className={`text-${color}-500 font-medium`}>
                        {label}
                      </div>
                      <div className="text-sm">
                        {formatDate(status.startDate)} -{" "}
                        {formatDate(status.endDate)}
                      </div>
                      <div className="text-sm">
                        {formatTime(status.startDate)} -{" "}
                        {formatTime(status.endDate)}
                      </div>
                    </>
                  ),
                };
              })}
            />
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-between mx-2">
        <div className="flex-1">
          <Tabs defaultActiveKey="category" items={items} />
        </div>
      </div>
    </div>
  );
}

export default KoiShowDetail;
