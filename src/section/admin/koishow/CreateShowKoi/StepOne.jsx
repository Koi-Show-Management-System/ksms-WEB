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
  InputNumber,
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

function StepOne({ updateFormData, initialData, showErrors }) {
  const [data, setData] = useState({
    ...initialData,
    hasGrandChampion: false,
    hasBestInShow: false,
  });
  const [uploadedImages, setUploadedImages] = useState([]);
  const { accountManage, fetchAccountTeam } = useAccountTeam();
  const staff = accountManage.staff || [];
  const managers = accountManage.managers || [];
  const [timeErrors, setTimeErrors] = useState({
    startDate: "",
    endDate: "",
    startExhibitionDate: "",
    endExhibitionDate: "",
  });
  const [participantErrors, setParticipantErrors] = useState({
    minParticipants: "",
    maxParticipants: "",
  });

  useEffect(() => {
    if (JSON.stringify(data) !== JSON.stringify(initialData)) {
      setData(initialData);

      // Cập nhật lỗi khi dữ liệu thay đổi
      const newParticipantErrors = { ...participantErrors };

      if (initialData.minParticipants && initialData.maxParticipants) {
        const min = Number(initialData.minParticipants);
        const max = Number(initialData.maxParticipants);

        if (min < max) {
          newParticipantErrors.minParticipants = "";
          newParticipantErrors.maxParticipants = "";
        } else if (min >= max) {
          newParticipantErrors.minParticipants =
            "Số lượng tối thiểu phải nhỏ hơn số lượng tối đa";
        }
      }

      setParticipantErrors(newParticipantErrors);
    }
  }, [initialData]);

  useEffect(() => {
    if (JSON.stringify(data) !== JSON.stringify(initialData)) {
      updateFormData({
        ...data,
        hasGrandChampion: false,
        hasBestInShow: false,
      });
      console.log("Current formData:", data);
    }
  }, [data]);

  useEffect(() => {
    fetchAccountTeam(1, 100);
  }, []);

  useEffect(() => {
    // Kiểm tra và cập nhật lại thông báo lỗi khi data thay đổi
    if (data.minParticipants && data.maxParticipants) {
      const min = Number(data.minParticipants);
      const max = Number(data.maxParticipants);
      const newErrors = { ...participantErrors };

      if (min < max) {
        // Nếu hợp lệ, xóa cả hai thông báo lỗi
        newErrors.minParticipants = "";
        newErrors.maxParticipants = "";
        setParticipantErrors(newErrors);
      }
    }
  }, [data.minParticipants, data.maxParticipants]);

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
    if (field === "investMoney" && value < 0) {
      message.error("Số tiền đầu tư không được nhỏ hơn 0");
      return;
    }

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
        { name: "Vé Thường", price: 0, availableQuantity: 0 }, // Mặc định là Vé Thường
      ],
    }));
  };

  // Cập nhật thông tin loại vé
  const handleTicketTypeChange = (index, field, value) => {
    if (field === "price" && value < 0) {
      message.error("Giá vé không được nhỏ hơn 0");
      return;
    }

    if (field === "availableQuantity" && value < 0) {
      message.error("Số lượng vé không được nhỏ hơn 0");
      return;
    }

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

  const handleDateChange = (field, value) => {
    const newTimeErrors = { ...timeErrors };
    const newData = { ...data };

    if (!value) {
      newTimeErrors[field] = "Vui lòng chọn ngày.";
    } else {
      // Lưu giá trị mới vào newData
      newData[field] = value.tz("Asia/Ho_Chi_Minh").format();

      // Xóa lỗi cho trường hiện tại
      newTimeErrors[field] = "";

      // Nếu đang cập nhật ngày bắt đầu
      if (field === "startDate") {
        // Kiểm tra nếu ngày kết thúc hiện tại trước ngày bắt đầu mới
        if (data.endDate && value.isAfter(dayjs(data.endDate))) {
          // Tự động cập nhật ngày kết thúc thành ngày bắt đầu + 1 ngày
          const newEndDate = value.add(1, "day");
          newData.endDate = newEndDate.tz("Asia/Ho_Chi_Minh").format();

          // Xóa lỗi cho ngày kết thúc
          newTimeErrors.endDate = "";
        }
      }
      // Nếu đang cập nhật ngày kết thúc
      else if (field === "endDate") {
        // Kiểm tra xem ngày kết thúc có trước ngày bắt đầu không
        if (data.startDate && value.isBefore(dayjs(data.startDate))) {
          newTimeErrors[field] = "Ngày kết thúc phải sau ngày bắt đầu.";
        }
      }
    }

    setTimeErrors(newTimeErrors);
    setData(newData);
  };

  const handleNumberChange = (field, value) => {
    // Nếu giá trị rỗng, cập nhật dữ liệu và xóa lỗi
    if (value === "" || value === null || value === undefined) {
      setData({ ...data, [field]: "" });
      setParticipantErrors({
        ...participantErrors,
        [field]: "",
      });
      return;
    }

    // Chuyển đổi thành số
    const numValue = Number(value);

    // Tạo bản sao của state lỗi
    const newParticipantErrors = { ...participantErrors };

    // Luôn cập nhật giá trị vào state, ngay cả khi có lỗi
    const newData = { ...data, [field]: value };

    // Kiểm tra xem giá trị có hợp lệ không (phải là số và lớn hơn hoặc bằng 0)
    if (isNaN(numValue) || numValue < 0) {
      newParticipantErrors[field] = "Giá trị phải là số và lớn hơn 0";
    } else {
      // Xóa lỗi cho trường hiện tại
      newParticipantErrors[field] = "";

      // Kiểm tra logic so sánh giữa hai trường
      // Nếu đang cập nhật minParticipants
      if (field === "minParticipants") {
        if (
          newData.maxParticipants &&
          numValue >= Number(newData.maxParticipants)
        ) {
          newParticipantErrors.minParticipants =
            "Số lượng tối thiểu phải nhỏ hơn số lượng tối đa";
        }
      }

      // Nếu đang cập nhật maxParticipants
      if (field === "maxParticipants") {
        if (
          newData.minParticipants &&
          numValue <= Number(newData.minParticipants)
        ) {
          newParticipantErrors.maxParticipants =
            "Số lượng tối đa phải lớn hơn số lượng tối thiểu";
        }
      }
    }

    // Cập nhật state lỗi
    setParticipantErrors(newParticipantErrors);

    // Luôn cập nhật data để lưu giá trị người dùng đã nhập
    setData(newData);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold mb-6">
        Bước 1: Thông tin và Chi tiết
      </h2>

      <div className="mb-4">
        <h3 className="block text-sm font-medium text-gray-700 mb-1">
          Tên chương trình
        </h3>
        <Input
          placeholder="Nhập tên chương trình"
          value={data.name}
          onChange={(e) => setData({ ...data, name: e.target.value })}
        />
        {showErrors && !data.name && (
          <p className="text-red-500 text-xs mt-1">
            Tên chương trình là bắt buộc
          </p>
        )}
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
        {showErrors && !data.description && (
          <p className="text-red-500 text-xs mt-1">
            Mô tả chương trình là bắt buộc.{" "}
          </p>
        )}
      </div>

      <div className="flex space-x-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">
            Ngày bắt đầu triễn lãm
          </label>
          <DatePicker
            showTime
            className="w-full"
            value={
              data.startDate
                ? dayjs(data.startDate).tz("Asia/Ho_Chi_Minh")
                : null
            }
            onChange={(value) => handleDateChange("startDate", value)}
            format="YYYY-MM-DD HH:mm:ss"
            placeholder="Chọn ngày bắt đầu"
          />
          {timeErrors.startDate && (
            <p className="text-red-500 text-xs mt-1">{timeErrors.startDate}</p>
          )}
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">
            Ngày kết thúc triễn lãm
          </label>
          <DatePicker
            showTime
            className="w-full"
            value={
              data.endDate ? dayjs(data.endDate).tz("Asia/Ho_Chi_Minh") : null
            }
            onChange={(value) => handleDateChange("endDate", value)}
            format="YYYY-MM-DD HH:mm:ss"
            placeholder="Chọn ngày kết thúc"
            disabledDate={(current) => {
              // Vô hiệu hóa tất cả các ngày trước ngày bắt đầu
              return data.startDate
                ? current && current < dayjs(data.startDate)
                : false;
            }}
          />
          {timeErrors.endDate && (
            <p className="text-red-500 text-xs mt-1">{timeErrors.endDate}</p>
          )}
        </div>
      </div>

      {/* Trường startExhibitionDate và endExhibitionDate ẩn nhưng vẫn truyền dữ liệu */}
      <input type="hidden" value={data.startExhibitionDate || ""} />
      <input type="hidden" value={data.endExhibitionDate || ""} />

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
              handleNumberChange("minParticipants", parseInt(e.target.value))
            }
            min={0}
          />
          {participantErrors.minParticipants && (
            <p className="text-red-500 text-xs mt-1">
              {participantErrors.minParticipants}
            </p>
          )}
          {showErrors && !data.minParticipants && (
            <p className="text-red-500 text-xs mt-1">
              Số lượng tối thiểu là bắt buộc.{" "}
            </p>
          )}
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
              handleNumberChange("maxParticipants", parseInt(e.target.value))
            }
            min={0}
          />
          {participantErrors.maxParticipants && (
            <p className="text-red-500 text-xs mt-1">
              {participantErrors.maxParticipants}
            </p>
          )}
          {showErrors && !data.maxParticipants && (
            <p className="text-red-500 text-xs mt-1">
              Số lượng tối đa là bắt buộc.{" "}
            </p>
          )}
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
          {showErrors && !data.location && (
            <p className="text-red-500 text-xs mt-1">
              Địa điểm tổ chức là bắt buộc.{" "}
            </p>
          )}
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
        {showErrors && !data.imgUrl && (
          <p className="text-red-500 text-xs mt-1">
            Hình ảnh chương trình là bắt buộc.{" "}
          </p>
        )}
        {/* {data.imgUrl && (
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              Selected image URL: {data.imgUrl}
            </p>
          </div>
        )} */}
      </div>

      {/* Phần Sponsor Requests */}
      {/* Quản lý nhà tài trợ */}
      <label className="block text-sm font-bold text-gray-700 ">
        Quản lý nhà tài trợ
      </label>
      <Button onClick={handleAddSponsor} icon={<PlusOutlined />}>
        Thêm nhà tài trợ
      </Button>

      {/* Hiển thị lỗi nếu chưa có nhà tài trợ nào */}
      {showErrors && data.createSponsorRequests.length === 0 && (
        <p className="text-red-500 text-xs mt-1">
          Cần có ít nhất một nhà tài trợ.
        </p>
      )}

      <Collapse>
        {data.createSponsorRequests.map((sponsor, index) => (
          <Panel
            header={`Nhà tài trợ ${index + 1}`}
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
              {/* Tên Sponsor */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tên Nhà Tài Trợ
                </label>
                <Input
                  value={sponsor.name}
                  onChange={(e) =>
                    handleSponsorChange(index, "name", e.target.value)
                  }
                  placeholder="Nhập tên nhà tài trợ"
                />
                {showErrors && !sponsor.name && (
                  <p className="text-red-500 text-xs mt-1">
                    Tên nhà tài trợ là bắt buộc.
                  </p>
                )}
              </div>

              {/* Logo Sponsor */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Logo Nhà Tài Trợ
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
                    <div className="mt-2">Tải lên Logo</div>
                  </div>
                </Upload>
                {showErrors && !sponsor.logoUrl && (
                  <p className="text-red-500 text-xs mt-1">
                    Logo nhà tài trợ là bắt buộc.
                  </p>
                )}
              </div>

              {/* Số Tiền Đầu Tư */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Số Tiền Đầu Tư
                </label>
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                  value={sponsor.investMoney}
                  onChange={(value) =>
                    handleSponsorChange(index, "investMoney", value)
                  }
                  placeholder="Nhập số tiền tài trợ"
                  addonAfter="VND"
                />

                {showErrors &&
                  (!sponsor.investMoney || sponsor.investMoney <= 0) && (
                    <p className="text-red-500 text-xs mt-1">
                      Số tiền tài trợ phải lớn hơn 0.
                    </p>
                  )}
              </div>
            </Space>
          </Panel>
        ))}
      </Collapse>

      {/* Quản lý vé */}
      <h3 className="text-sm font-bold mb-4 text-gray-700">Quản lý vé</h3>
      <Button onClick={handleAddTicketType} icon={<PlusOutlined />}>
        Thêm Loại Vé
      </Button>

      {/* Hiển thị lỗi nếu chưa có loại vé nào */}
      {showErrors && data.createTicketTypeRequests.length === 0 && (
        <p className="text-red-500 text-xs mt-1">Cần có ít nhất một loại vé.</p>
      )}

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
              {/* Tên Loại Vé */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Loại Vé
                </label>
                <Select
                  style={{ width: "100%" }}
                  value={ticket.name}
                  onChange={(value) =>
                    handleTicketTypeChange(index, "name", value)
                  }
                  placeholder="Chọn loại vé"
                >
                  <Option value="Vé Thường">Vé Thường</Option>
                  <Option value="Vé Cao Cấp">Vé Cao Cấp</Option>
                  <Option value="Vé Triễn Lãm">Vé Triễn Lãm</Option>
                </Select>
                {showErrors && !ticket.name && (
                  <p className="text-red-500 text-xs mt-1">
                    Tên loại vé là bắt buộc.
                  </p>
                )}
              </div>

              {/* Giá Vé */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Giá Vé
                </label>
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                  value={ticket.price}
                  onChange={(value) =>
                    handleTicketTypeChange(index, "price", value)
                  }
                  placeholder="Nhập giá vé"
                  addonAfter="VND"
                />
                {showErrors && (!ticket.price || ticket.price <= 0) && (
                  <p className="text-red-500 text-xs mt-1">
                    Giá vé phải lớn hơn 0.
                  </p>
                )}
              </div>

              {/* Số Lượng Vé */}
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
                      parseInt(e.target.value)
                    )
                  }
                  placeholder="Nhập số lượng vé"
                  min={0}
                />
                {showErrors &&
                  (!ticket.availableQuantity ||
                    ticket.availableQuantity <= 0) && (
                    <p className="text-red-500 text-xs mt-1">
                      Số lượng vé phải lớn hơn 0.
                    </p>
                  )}
              </div>
            </Space>
          </Panel>
        ))}
      </Collapse>

      <div className="flex space-x-4">
        {/* Select Manager */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Chọn Quản Lý
          </label>
          <Select
            mode="multiple"
            className="w-full"
            placeholder="Chọn quản lý"
            value={data.assignManagerRequests}
            onChange={(value) =>
              setData({ ...data, assignManagerRequests: value })
            }
          >
            {managers.map((manager) => (
              <Option key={manager.id} value={manager.id}>
                {manager.fullName}
              </Option>
            ))}
          </Select>
          {/* Hiển thị lỗi nếu chưa chọn Manager */}
          {showErrors && data.assignManagerRequests.length === 0 && (
            <p className="text-red-500 text-xs mt-1">
              Bạn phải chọn ít nhất một Quản Lý.
            </p>
          )}
        </div>

        {/* Select Staff */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Chọn Nhân Viên
          </label>
          <Select
            mode="multiple"
            className="w-full"
            placeholder="Chọn nhân viên"
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
          {/* Hiển thị lỗi nếu chưa chọn Staff */}
          {showErrors && data.assignStaffRequests.length === 0 && (
            <p className="text-red-500 text-xs mt-1">
              Bạn phải chọn ít nhất một Nhân Viên.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default StepOne;
