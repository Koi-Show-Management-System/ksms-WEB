import React from "react";
import { Collapse, Timeline, Card, Image, Tabs } from "antd";
import koiFishImage from "../../../../assets/koiFishImage.png";
import sponsorLogo1 from "../../../../assets/sponsorLogo1.png";
import sponsorLogo2 from "../../../../assets/sponsorLogo2.png";
import Category from "./Category";
import KoiList from "./KoiList";
import ManageShow from "./ManageShow";
import Votes from "./Votes";
import Awards from "./Awards";
import Rules from "./Rules";
import Sponsor from "./Sponsor";
import CompetitionRound from "./CompetitionRound";
import { useParams } from "react-router-dom";

function KoiShowDetail() {
  const { Panel } = Collapse;
  const { id } = useParams();
  console.log(id);
  const items = [
    {
      key: "category",
      label: "Danh Mục",
      children: <Category showId={id} />,
    },
    {
      key: "koiList",
      label: "Đơn Đăng Ký",
      children: <KoiList />,
    },
    {
      key: "manageShow",
      label: "Quản Lý Triển Lãm",
      children: <ManageShow />,
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
      key: "awards",
      label: "Giải Thưởng",
      children: <Awards />,
    },
    {
      key: "rules",
      label: "Quy Tắc",
      children: <Rules />,
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
        <h1 className="text-3xl font-bold mb-4">Triển Lãm Cá Koi 2025</h1>
        <p className="text-gray-600">
          Chào mừng bạn đến với Triển Lãm Cá Koi hàng năm, nơi những người đam
          mê tụ tập để trưng bày những con cá Koi quý giá và thi đấu để giành
          danh hiệu cao nhất. Tham gia cùng chúng tôi để kỷ niệm vẻ đẹp và sự đa
          dạng của cá Koi.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Image
            src={koiFishImage}
            alt="Cá Koi"
            className="w-full rounded-lg"
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="mt-4">
              <Collapse defaultActiveKey={["1"]}>
                <Panel header="Lịch Trình Sự Kiện" key="1">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>07/01/2025 - Mở Đăng Ký</span>
                    </div>
                    <div className="flex justify-between">
                      <span>10/01/2025 - Đóng Đăng Ký</span>
                    </div>
                    <div className="flex justify-between">
                      <span>12/01/2025 - Ngày Triển Lãm</span>
                    </div>
                    <div className="flex justify-between">
                      <span>12/01/2025 - Ngày Khai Mạc Giải Đấu</span>
                    </div>
                    <div className="flex justify-between">
                      <span>12/01/2025 - Ngày Kết Thúc Giải Đấu</span>
                    </div>
                  </div>
                </Panel>
              </Collapse>
            </div>

            <div className="mt-4">
              <Collapse defaultActiveKey={["2"]}>
                <Panel header="Vé" key="2">
                  <div className="space-y-2">
                    <div>Vé Đăng kí - Phí tham gia - $5</div>
                    <div>Vé Xem - Vé Cơ Bản - $45</div>
                    <div>Vé Thi đấu - Vé VIP - $75</div>
                    <div>Vé Triển Lãm - Vé Triển Lãm - $15</div>
                    <div>Số lượng tối thiểu: 100 - Số lượng tối đa: 200</div>
                  </div>
                </Panel>
              </Collapse>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-black/[0.02] p-4 rounded-lg">
              <h3 className="font-bold mb-4 text-lg">Tài Trợ</h3>
              <div className="grid grid-cols-2 gap-4">
                <Image
                  src={sponsorLogo1}
                  alt="Tài Trợ 1"
                  className="rounded-xl"
                />
                <Image
                  src={sponsorLogo2}
                  alt="Tài Trợ 2"
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="bg-black/[0.02] p-4 rounded-lg">
              <h3 className="font-bold mb-4 text-lg">Tiêu Chí Đánh Giá</h3>
              <div className="grid grid-cols-2 ">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                      1
                    </span>
                    <span>Màu sắc</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                      2
                    </span>
                    <span>Hình dáng cơ thể</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                      3
                    </span>
                    <span>Họa tiết</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                      4
                    </span>
                    <span>Kích thước</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                      5
                    </span>
                    <span>Chất lượng da</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                      6
                    </span>
                    <span>Sức khỏe</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                      7
                    </span>
                    <span>Bơi lội</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                      8
                    </span>
                    <span>Đặc điểm phân biệt</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                      9
                    </span>
                    <span>Cân bằng</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                      10
                    </span>
                    <span>Sự thanh lịch</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <Card title="Trạng Thái" className="mb-4">
            <Timeline
              items={[
                {
                  color: "gold",
                  children: (
                    <>
                      <div className="text-yellow-500 font-medium">
                        Chưa Đăng Ký
                      </div>
                      <div className="text-sm">22/08/2023- 15/08/2023</div>
                      <div className="text-sm">16:08 PM- 00:08 AM</div>
                    </>
                  ),
                },
                {
                  color: "blue",
                  children: (
                    <>
                      <div className="text-blue-500 font-medium">
                        Có Thể Đăng Ký
                      </div>
                      <div className="text-sm">15/08/2023- 19/08/2023</div>
                      <div className="text-sm">00:08 AM- 00:08 AM</div>
                    </>
                  ),
                },
                {
                  color: "orange",
                  children: (
                    <>
                      <div className="text-orange-500 font-medium">
                        Đăng Ký Kết Thúc
                      </div>
                      <div className="text-sm">19/08/2023- 20/08/2023</div>
                      <div className="text-sm">00:08 AM- 00:08 AM</div>
                    </>
                  ),
                },
                {
                  color: "green",
                  children: (
                    <>
                      <div className="text-green-500 font-medium">
                        Đánh Giá Đơn Ứng Dụng Kết Thúc
                      </div>
                      <div className="text-sm">20/08/2023- 21/08/2023</div>
                      <div className="text-sm">00:08 AM- 22:08 PM</div>
                    </>
                  ),
                },
                {
                  color: "purple",
                  children: (
                    <>
                      <div className="text-purple-500 font-medium">
                        Có Thể Tham Gia
                      </div>
                      <div className="text-sm">21/08/2023- 22/08/2023</div>
                      <div className="text-sm">22:08 PM- 00:08 AM</div>
                    </>
                  ),
                },
                {
                  color: "cyan",
                  children: (
                    <>
                      <div className="text-cyan-500 font-medium">Bắt Đầu</div>
                      <div className="text-sm">22/08/2023- 22/08/2023</div>
                      <div className="text-sm">00:08 AM- 09:08 AM</div>
                    </>
                  ),
                },
                {
                  color: "red",
                  children: (
                    <>
                      <div className="text-red-500 font-medium">Kết Thúc</div>
                      <div className="text-sm">22/08/2023</div>
                      <div className="text-sm">09:08 AM</div>
                    </>
                  ),
                },
              ]}
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
