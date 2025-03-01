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
  Collapse,
} from "antd";
import {
  DeleteOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { Cloudinary } from "@cloudinary/url-gen";
import useAccountTeam from "../../../../hooks/useAccountTeam";

const { Option } = Select;
const { Panel } = Collapse;

const cloudinary = new Cloudinary({
  cloud: {
    cloudName: "dphupjpqt",
  },
});

function StepOne({ updateFormData, initialData }) {
  const [data, setData] = useState(initialData);

  const [uploadedImages, setUploadedImages] = useState([]);
  const { accountManage, fetchAccountTeam } = useAccountTeam();
  const staff = accountManage.staff || [];
  const managers = accountManage.managers || [];

  useEffect(() => {
    if (JSON.stringify(data) !== JSON.stringify(initialData)) {
      setData(initialData);
    }
  }, [initialData]);

  // Chỉ cập nhật `updateFormData(data)` nếu `data` thay đổi thực sự
  useEffect(() => {
    if (JSON.stringify(data) !== JSON.stringify(initialData)) {
      updateFormData(data);
      console.log("Current formData:", data);
    }
  }, [data]);

  // Fetch danh sách Staff/Managers khi component mount
  useEffect(() => {
    fetchAccountTeam(1, 100);
  }, []);
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

      const filteredImages = uploadedImages.filter((url) => url !== null);

      // Store the images for display
      setUploadedImages(filteredImages);

      // Set the first image as the imgUrl (since it should be a string)
      if (filteredImages.length > 0) {
        setData((prevData) => ({
          ...prevData,
          imgUrl: filteredImages[0], // Use the first image as the imgUrl
        }));
      }

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
      // Only process if there's at least one file
      if (fileList && fileList.length > 0) {
        const file = fileList[0]; // Take only the first file
        let logoUrl = "";

        if (file.url) {
          logoUrl = file.url;
        } else if (file.originFileObj) {
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

          logoUrl = data.secure_url;
        }

        // Update the sponsor's logoUrl as a string
        const newSponsorRequests = [...data.createSponsorRequests];
        newSponsorRequests[index].logoUrl = logoUrl; // Store as string
        setData({ ...data, createSponsorRequests: newSponsorRequests });
        message.success("Logo đã được tải lên thành công!");
      }
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
        <h3 className="block text-sm font-medium text-gray-700 mb-1">
          Tên chương trình
        </h3>
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
      <div className="flex space-x-4">
        <div className="flex-1 ">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Địa điểm
          </label>
          <Input
            placeholder="Nhập địa điểm tổ chức"
            value={data.location}
            onChange={(e) => setData({ ...data, location: e.target.value })}
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phí đăng ký (VND)
          </label>
          <Input
            type="number"
            placeholder="Nhập phí đăng ký"
            value={data.registrationFee}
            onChange={(e) =>
              setData({ ...data, registrationFee: Number(e.target.value) })
            }
          />
        </div>
      </div>

      {/* Tải lên Hình ảnh */}
      <div className="">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Hình ảnh (Tải lên)
        </label>
        <Upload
          accept=".jpg,.jpeg,.png"
          listType="picture-card"
          fileList={uploadedImages.map((url, index) => ({
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
        {data.imgUrl && (
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              Selected image URL: {data.imgUrl}
            </p>
          </div>
        )}
      </div>

      {/* Phần Sponsor Requests */}
      <label className="block text-sm font-bold text-gray-700 ">
        Quản lý nhà tài trợ{" "}
      </label>
      <Button onClick={handleAddSponsor} icon={<PlusOutlined />}>
        Thêm Sponsor
      </Button>
      <Collapse className="">
        {data.createSponsorRequests.map((sponsor, index) => (
          <Panel
            header={`Sponsor ${index + 1}`}
            key={index}
            extra={
              <Button
                type="text"
                icon={<DeleteOutlined />}
                danger
                onClick={(e) => {
                  e.stopPropagation(); // Ngăn mở panel khi xóa
                  handleRemoveSponsor(index);
                }}
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
                {sponsor.logoUrl && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Logo URL: {sponsor.logoUrl}
                    </p>
                  </div>
                )}
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
          </Panel>
        ))}
      </Collapse>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
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
      <h3 className="text-sm font-bold mb-4">Quản lý vé</h3>

      <Button onClick={handleAddTicketType} icon={<PlusOutlined />}>
        Thêm Loại Vé
      </Button>

      <Collapse className="mt-4">
        {data.createTicketTypeRequests.map((ticket, index) => (
          <Panel
            header={`Loại Vé ${index + 1}`}
            key={index}
            extra={
              <Button
                type="text"
                icon={<DeleteOutlined />}
                danger
                onClick={(e) => {
                  e.stopPropagation(); // Ngăn mở panel khi xóa
                  handleRemoveTicketType(index);
                }}
              >
                Xóa
              </Button>
            }
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
          </Panel>
        ))}
      </Collapse>
      <div className="flex space-x-4">
        {/* Select Manager */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Chọn Manager
          </label>
          <Select
            mode="multiple"
            className="w-full"
            placeholder="Chọn Manager"
            value={data.assignManagerRequests}
            onChange={(value) =>
              setData({ ...data, assignManagerRequests: value })
            }
          >
            {managers.map((manager) => (
              <Option key={manager.id} value={manager.id}>
                {manager.fullName} {/* Hiển thị tên nhưng lưu ID */}
              </Option>
            ))}
          </Select>
        </div>

        {/* Select Staff */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Chọn Staff
          </label>
          <Select
            mode="multiple"
            className="w-full"
            placeholder="Chọn Staff"
            value={data.assignStaffRequests}
            onChange={(value) =>
              setData({ ...data, assignStaffRequests: value })
            }
          >
            {staff.map((s) => (
              <Option key={s.id} value={s.id}>
                {s.fullName}
              </Option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
}

export default StepOne;
