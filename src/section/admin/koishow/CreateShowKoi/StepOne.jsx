import React, { useState, useEffect } from "react";
import {
  Input,
  DatePicker,
  Select,
  message,
  Upload,
  Button,
  Checkbox,
  Card,
  Space,
} from "antd";
import {
  DeleteOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { Cloudinary } from "@cloudinary/url-gen";
const { Option } = Select;

const cloudinary = new Cloudinary({
  cloud: {
    cloudName: "dphupjpqt",
  },
});

function StepOne({ updateFormData }) {
  const [data, setData] = useState({
    name: "",
    description: "",
    startDate: null,
    endDate: null,
    startExhibitionDate: null,
    endExhibitionDate: null,
    minParticipants: "",
    maxParticipants: "",
    location: "",
    images: [],
    hasGrandChampion: false,
    hasBestInShow: false,
    createSponsorRequests: [],
    createTicketTypeRequests: [],
  });

  useEffect(() => {
    updateFormData(data);
    console.log("Current formData:", data);
  }, [data]);

  const handleImageUpload = async ({ fileList }) => {
    try {
      const uploadedImages = await Promise.all(
        fileList.map(async (file) => {
          if (file.url) {
            return file.url;
          }
          if (file.originFileObj) {
            const formData = new FormData();
            formData.append("file", file.originFileObj);
            formData.append("upload_preset", "ml_default");

            const response = await fetch(
              "https://api.cloudinary.com/v1_1/dphupjpqt/image/upload",
              {
                method: "POST",
                body: formData,
              }
            );

            const data = await response.json();

            if (!response.ok) {
              console.error("Cloudinary upload error:", data);
              throw new Error(data.error.message || "Image upload failed");
            }

            return data.secure_url;
          }
          return null;
        })
      );

      setData((prevData) => ({
        ...prevData,
        images: uploadedImages.filter((url) => url !== null),
      }));
      message.success("Ảnh đã được tải lên thành công!");
    } catch (error) {
      console.error("Error uploading images:", error);
      message.error("Lỗi khi tải ảnh lên!");
    }
  };
  const handleAddSponsor = () => {
    setData((prevData) => ({
      ...prevData,
      createSponsorRequests: [
        ...prevData.createSponsorRequests,
        { name: "", logoUrl: "", investMoney: 0 }, // Mỗi sponsor mới có 3 mục
      ],
    }));
  };
  const handleSponsorChange = (index, field, value) => {
    setData((prevData) => {
      const newSponsorRequests = prevData.createSponsorRequests.map(
        (sponsor, i) => (i === index ? { ...sponsor, [field]: value } : sponsor)
      );
      return { ...prevData, createSponsorRequests: newSponsorRequests };
    });
  };

  const handleLogoUpload = async (index, { fileList }) => {
    try {
      const uploadedLogo = await Promise.all(
        fileList.map(async (file) => {
          if (file.url) {
            return file.url;
          }
          if (file.originFileObj) {
            const formData = new FormData();
            formData.append("file", file.originFileObj);
            formData.append("upload_preset", "ml_default");

            const response = await fetch(
              "https://api.cloudinary.com/v1_1/dphupjpqt/image/upload",
              {
                method: "POST",
                body: formData,
              }
            );

            const data = await response.json();

            if (!response.ok) {
              console.error("Cloudinary upload error:", data);
              throw new Error(data.error.message || "Image upload failed");
            }

            return data.secure_url;
          }
          return null;
        })
      );

      const newSponsorRequests = [...data.createSponsorRequests];
      newSponsorRequests[index].logoUrl = uploadedLogo[0]; // Lưu URL logo vào mảng sponsor
      setData({ ...data, createSponsorRequests: newSponsorRequests });
      message.success("Logo đã được tải lên thành công!");
    } catch (error) {
      console.error("Error uploading logo:", error);
      message.error("Lỗi khi tải logo lên!");
    }
  };
  const handleRemoveSponsor = (index) => {
    const newSponsorRequests = data.createSponsorRequests.filter(
      (_, i) => i !== index
    );
    setData({ ...data, createSponsorRequests: newSponsorRequests });
  };
  // Thêm loại vé mới
  const handleAddTicketType = () => {
    setData((prevData) => ({
      ...prevData,
      createTicketTypeRequests: [
        ...prevData.createTicketTypeRequests,
        { name: "", price: 0, availableQuantity: 0 }, // Mỗi loại vé có 3 mục
      ],
    }));
  };

  // Cập nhật thông tin loại vé
  const handleTicketTypeChange = (index, field, value) => {
    const newTicketTypes = [...data.createTicketTypeRequests];
    newTicketTypes[index] = { ...newTicketTypes[index], [field]: value };
    setData({ ...data, createTicketTypeRequests: newTicketTypes });
  };

  // Xóa loại vé
  const handleRemoveTicketType = (index) => {
    const newTicketTypes = data.createTicketTypeRequests.filter(
      (_, i) => i !== index
    );
    setData({ ...data, createTicketTypeRequests: newTicketTypes });
  };
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold mb-6">
        Bước 1: Thông tin và Chi tiết
      </h2>

      {/* Form thông tin chương trình */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tên chương trình
        </label>
        <Input
          placeholder="Nhập tên chương trình"
          value={data.name}
          onChange={(e) => setData({ ...data, name: e.target.value })}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mô tả chương trình
        </label>
        <Input.TextArea
          rows={3}
          placeholder="Nhập mô tả chương trình"
          value={data.description}
          onChange={(e) => setData({ ...data, description: e.target.value })}
        />
      </div>

      <div className="flex space-x-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ngày bắt đầu đăng ký
          </label>
          <DatePicker
            showTime
            className="w-full"
            value={data.startDate ? dayjs(data.startDate) : null}
            onChange={(value) => setData({ ...data, startDate: value })}
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ngày kết thúc đăng ký
          </label>
          <DatePicker
            showTime
            className="w-full"
            value={data.endDate ? dayjs(data.endDate) : null}
            onChange={(value) => setData({ ...data, endDate: value })}
          />
        </div>
      </div>
      <div className="flex space-x-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ngày bắt đầu sự kiện và triễn lãm
          </label>
          <DatePicker
            showTime
            className="w-full"
            value={
              data.startExhibitionDate ? dayjs(data.startExhibitionDate) : null
            }
            onChange={(value) =>
              setData({ ...data, startExhibitionDate: value })
            }
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ngày kết thúc sự kiện và triễn lãm
          </label>
          <DatePicker
            showTime
            className="w-full"
            value={
              data.endExhibitionDate ? dayjs(data.endExhibitionDate) : null
            }
            onChange={(value) => setData({ ...data, endExhibitionDate: value })}
          />
        </div>
      </div>

      <div className="flex space-x-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Số lượng người tham gia tối thiểu
          </label>
          <Input
            type="number"
            placeholder="Nhập số lượng tối thiểu"
            value={data.minParticipants}
            onChange={(e) =>
              setData({ ...data, minParticipants: e.target.value })
            }
          />
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Số lượng người tham gia tối đa
          </label>
          <Input
            type="number"
            placeholder="Nhập số lượng tối đa"
            value={data.maxParticipants}
            onChange={(e) =>
              setData({ ...data, maxParticipants: e.target.value })
            }
          />
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Địa điểm
        </label>
        <Input
          placeholder="Nhập địa điểm tổ chức"
          value={data.location}
          onChange={(e) => setData({ ...data, location: e.target.value })}
        />
      </div>

      {/* Tải lên Hình ảnh */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Hình ảnh (Tải lên)
        </label>
        <Upload
          accept=".jpg,.jpeg,.png"
          listType="picture-card"
          fileList={data.images.map((url, index) => ({
            uid: index.toString(),
            name: `image-${index}`,
            status: "done",
            url,
          }))}
          onChange={handleImageUpload}
          multiple
        >
          <div>
            <UploadOutlined />
            <div className="mt-2">Upload</div>
          </div>
        </Upload>
      </div>

      {/* Phần Sponsor Requests */}
      <label className="block text-sm font-bold text-gray-700 mb-1">
        Sponsor Management{" "}
      </label>
      <Button onClick={handleAddSponsor} icon={<PlusOutlined />}>
        Thêm Sponsor
      </Button>
      <div className="mt-4 space-y-4">
        {data.createSponsorRequests.map((sponsor, index) => (
          <Card
            key={index}
            title={`Sponsor ${index + 1}`}
            extra={
              <Button
                type="text"
                icon={<DeleteOutlined />}
                danger
                onClick={() => handleRemoveSponsor(index)}
              >
                Xóa
              </Button>
            }
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tên Sponsor
                </label>
                <Input
                  value={sponsor.name}
                  onChange={(e) =>
                    handleSponsorChange(index, "name", e.target.value)
                  }
                  placeholder="Nhập tên sponsor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Logo Sponsor
                </label>
                <Upload
                  accept=".jpg,.jpeg,.png"
                  listType="picture-card"
                  fileList={
                    sponsor.logoUrl
                      ? [
                          {
                            uid: index.toString(),
                            url: sponsor.logoUrl,
                            name: "logo.png",
                            status: "done",
                          },
                        ]
                      : []
                  }
                  onChange={(fileList) => handleLogoUpload(index, fileList)}
                  multiple={false}
                >
                  <div>
                    <UploadOutlined />
                    <div className="mt-2">Upload Logo</div>
                  </div>
                </Upload>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Số Tiền Đầu Tư
                </label>
                <Input
                  type="number"
                  value={sponsor.investMoney}
                  onChange={(e) =>
                    handleSponsorChange(index, "investMoney", e.target.value)
                  }
                  placeholder="Nhập số tiền tài trợ"
                />
              </div>
            </Space>
          </Card>
        ))}
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Giải thưởng lớn
        </label>
        <Checkbox
          checked={data.hasGrandChampion}
          onChange={(e) =>
            setData({ ...data, hasGrandChampion: e.target.checked })
          }
        >
          Giải Best in Show
        </Checkbox>
        <Checkbox
          checked={data.hasBestInShow}
          onChange={(e) =>
            setData({ ...data, hasBestInShow: e.target.checked })
          }
        >
          Include Best in Show Award
        </Checkbox>
      </div>
      {/* Phần Loại Vé */}
      <h3 className="text-sm font-bold mb-4">Ticket Management</h3>

      <Button onClick={handleAddTicketType} icon={<PlusOutlined />}>
        Thêm Loại Vé
      </Button>

      <div className="mt-4 space-y-4">
        {data.createTicketTypeRequests.map((ticket, index) => (
          <Card
            key={index}
            title={`Loại Vé ${index + 1}`}
            extra={
              <Button
                type="text"
                icon={<DeleteOutlined />}
                danger
                onClick={() => handleRemoveTicketType(index)}
              >
                Xóa
              </Button>
            }
            style={{ background: "#f9f9f9", borderRadius: "8px" }}
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tên Loại Vé
                </label>
                <Input
                  value={ticket.name}
                  onChange={(e) =>
                    handleTicketTypeChange(index, "name", e.target.value)
                  }
                  placeholder="Nhập tên loại vé"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Giá Vé
                </label>
                <Input
                  type="number"
                  value={ticket.price}
                  onChange={(e) =>
                    handleTicketTypeChange(index, "price", e.target.value)
                  }
                  placeholder="Nhập giá vé"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Số Lượng Vé
                </label>
                <Input
                  type="number"
                  value={ticket.availableQuantity}
                  onChange={(e) =>
                    handleTicketTypeChange(
                      index,
                      "availableQuantity",
                      e.target.value
                    )
                  }
                  placeholder="Nhập số lượng vé"
                />
              </div>
            </Space>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default StepOne;
