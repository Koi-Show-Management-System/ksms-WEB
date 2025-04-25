import React, { useState, useEffect, useRef } from "react";
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
  Spin,
  Divider,
  Tooltip,
} from "antd";
import {
  DeleteOutlined,
  PlusOutlined,
  UploadOutlined,
  ReloadOutlined,
  DownOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { Cloudinary } from "@cloudinary/url-gen";
import useAccountTeam from "../../../../hooks/useAccountTeam";

const { Option } = Select;

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
  const [nameError, setNameError] = useState("");
  const [sponsorErrors, setSponsorErrors] = useState([]);
  const [ticketErrors, setTicketErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const managerSelectRef = useRef(null);
  const staffSelectRef = useRef(null);

  // Constants for validation limits
  const MAX_NAME_LENGTH = 100;
  const MAX_INVESTMENT = 100000000000; // 100 billion VND
  const MAX_TICKET_PRICE = 10000000; // 10 million VND
  const MAX_TICKET_QUANTITY = 1000000; // 1 million tickets
  const MAX_PARTICIPANTS = 10000; // Max participants

  // Effect xử lý initialData thay đổi
  useEffect(() => {
    // Sử dụng biến tạm để theo dõi nếu đã thực hiện update
    const needsUpdate = JSON.stringify(initialData) !== JSON.stringify(data);

    if (needsUpdate) {
      // Cập nhật data một lần duy nhất
      setData(initialData);

      // Cập nhật lỗi khi dữ liệu thay đổi
      const newParticipantErrors = {};

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
  }, [initialData]); // Chỉ phụ thuộc vào initialData

  // Ref để theo dõi lần render và data trước đó
  const previousDataRef = useRef();
  const isInitialRender = useRef(true);

  // Effect gửi dữ liệu lên component cha khi data thay đổi
  useEffect(() => {
    // Bỏ qua lần render đầu tiên
    if (isInitialRender.current) {
      isInitialRender.current = false;
      previousDataRef.current = JSON.stringify(data);
      return;
    }

    const currentDataString = JSON.stringify(data);
    const prevDataString = previousDataRef.current;

    // Chỉ cập nhật nếu data thực sự thay đổi so với lần trước
    if (currentDataString !== prevDataString) {
      updateFormData({
        ...data,
        hasGrandChampion: false,
        hasBestInShow: false,
      });
      // Lưu data hiện tại cho lần so sánh tiếp theo
      previousDataRef.current = currentDataString;
    }
  }, [data, updateFormData]); // Không phụ thuộc vào initialData

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

  const handleNameChange = (e) => {
    const value = e.target.value;

    if (value.length > MAX_NAME_LENGTH) {
      setNameError(
        `Tên chương trình không được vượt quá ${MAX_NAME_LENGTH} ký tự`
      );
    } else {
      setNameError("");
    }

    setData({ ...data, name: value });
  };

  const handleAddSponsor = () => {
    setData((prevData) => ({
      ...prevData,
      createSponsorRequests: [
        ...prevData.createSponsorRequests,
        { name: "", logoUrl: "", investMoney: 0 },
      ],
    }));
    // Add a new empty error slot for the new sponsor
    setSponsorErrors([...sponsorErrors, ""]);
  };

  const handleSponsorChange = (index, field, value) => {
    if (field === "investMoney" && value < 0) {
      message.error("Số tiền đầu tư không được nhỏ hơn 0");
      return;
    }

    // Check for maximum investment amount
    if (field === "investMoney" && value > MAX_INVESTMENT) {
      message.error(
        `Số tiền đầu tư không được vượt quá ${MAX_INVESTMENT.toLocaleString("vi-VN")} VND (100 tỷ)`
      );
      return;
    }

    // Check for duplicate sponsor names
    if (field === "name") {
      const isDuplicate = data.createSponsorRequests.some(
        (sponsor, i) => i !== index && sponsor.name === value
      );

      const newSponsorErrors = [...sponsorErrors];
      if (isDuplicate) {
        newSponsorErrors[index] = "Tên nhà tài trợ không được trùng lặp";
      } else {
        newSponsorErrors[index] = "";
      }
      setSponsorErrors(newSponsorErrors);
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

  const handleAddTicketType = () => {
    // Danh sách loại vé
    const ticketTypes = ["Vé Thường", "Vé Cao Cấp", "Vé Triễn Lãm"];

    // Tìm loại vé chưa được sử dụng
    const usedTicketTypes = data.createTicketTypeRequests.map((t) => t.name);
    const availableTicketTypes = ticketTypes.filter(
      (type) => !usedTicketTypes.includes(type)
    );

    // Nếu đã sử dụng hết các loại vé
    if (availableTicketTypes.length === 0) {
      message.warning("Đã sử dụng hết tất cả các loại vé");
      return;
    }

    // Thêm vé mới với loại vé còn trống đầu tiên
    setData((prevData) => ({
      ...prevData,
      createTicketTypeRequests: [
        ...prevData.createTicketTypeRequests,
        { name: availableTicketTypes[0], price: 0, availableQuantity: 0 },
      ],
    }));

    // Add a new empty error slot for the new ticket
    setTicketErrors([...ticketErrors, ""]);
  };

  const handleTicketTypeChange = (index, field, value) => {
    if (field === "price" && value < 0) {
      message.error("Giá vé không được nhỏ hơn 0");
      return;
    }

    if (field === "availableQuantity" && value < 0) {
      message.error("Số lượng vé không được nhỏ hơn 0");
      return;
    }

    // Check for maximum ticket price
    if (field === "price" && value > MAX_TICKET_PRICE) {
      message.error(
        `Giá vé không được vượt quá ${MAX_TICKET_PRICE.toLocaleString("vi-VN")} VND (10 triệu)`
      );
      return;
    }

    // Check for maximum ticket quantity
    if (field === "availableQuantity" && value > MAX_TICKET_QUANTITY) {
      message.error(
        `Số lượng vé không được vượt quá ${MAX_TICKET_QUANTITY.toLocaleString("vi-VN")} vé (1 triệu)`
      );
      return;
    }

    const newTicketTypes = [...data.createTicketTypeRequests];
    newTicketTypes[index] = { ...newTicketTypes[index], [field]: value };
    setData({ ...data, createTicketTypeRequests: newTicketTypes });
  };

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
      // Người dùng đã xóa chọn ngày (bấm X)
      newTimeErrors[field] = "Vui lòng chọn ngày.";
      newData[field] = null; // Reset giá trị về null
    } else {
      // Người dùng đã chọn ngày
      newData[field] = value.tz("Asia/Ho_Chi_Minh").format();
      newTimeErrors[field] = ""; // Xóa lỗi

      // Kiểm tra logic giữa ngày bắt đầu và kết thúc
      if (field === "startDate") {
        if (data.endDate) {
          const endDate = dayjs(data.endDate);
          // Nếu ngày bắt đầu mới > ngày kết thúc hiện tại, cập nhật ngày kết thúc
          if (value.isAfter(endDate)) {
            // Cập nhật ngày kết thúc = ngày bắt đầu (cho phép cùng ngày)
            newData.endDate = value.tz("Asia/Ho_Chi_Minh").format();
          }
        }
      } else if (field === "endDate") {
        // Không hiển thị lỗi khi ngày kết thúc = ngày bắt đầu, chỉ khi < ngày bắt đầu
        if (data.startDate && value.isBefore(dayjs(data.startDate))) {
          newTimeErrors[field] = "Ngày kết thúc không thể trước ngày bắt đầu.";
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

    // Check for maximum participants
    if (numValue > MAX_PARTICIPANTS) {
      newParticipantErrors[field] =
        `Giá trị không được vượt quá ${MAX_PARTICIPANTS.toLocaleString("vi-VN")}`;
      setParticipantErrors(newParticipantErrors);
      return;
    }

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

  const handleRefreshTeams = async () => {
    try {
      setLoading(true);
      await fetchAccountTeam(1, 100);
      message.success("Cập nhật danh sách thành công!");
    } catch (error) {
      message.error("Không thể cập nhật danh sách!");
    } finally {
      setLoading(false);
    }
  };

  // Render nút refresh trong dropdown
  const renderDropdownWithRefresh = (menu) => {
    return (
      <div>
        {menu}
        <Divider style={{ margin: "4px 0" }} />
        <div style={{ padding: "8px", textAlign: "center" }}>
          <Tooltip title="Làm mới danh sách">
            <Button
              icon={<ReloadOutlined />}
              size="small"
              onClick={(e) => {
                e.stopPropagation(); // Ngăn đóng dropdown khi click
                handleRefreshTeams();
              }}
              loading={loading}
              type="text"
              style={{ width: "100%" }}
            >
              Làm mới
            </Button>
          </Tooltip>
        </div>
      </div>
    );
  };

  // Hàm để mở dropdown
  const openDropdown = (selectRef) => {
    if (selectRef.current) {
      selectRef.current.focus();
    }
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
          onChange={handleNameChange}
          maxLength={MAX_NAME_LENGTH}
        />
        {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
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
            allowClear={true}
            disabledDate={(current) => {
              // Disable dates before today, but allow today to be selected
              return current && current.isBefore(dayjs(), "day");
            }}
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
              // Chỉ vô hiệu hóa các ngày trước ngày bắt đầu, cho phép chọn cùng ngày
              return data.startDate
                ? current && current.isBefore(dayjs(data.startDate), "day")
                : false;
            }}
            allowClear={true}
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
            max={MAX_PARTICIPANTS}
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
            max={MAX_PARTICIPANTS}
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

      <Collapse
        items={data.createSponsorRequests.map((sponsor, index) => ({
          key: index,
          label: `Nhà tài trợ ${index + 1}`,
          extra: (
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
          ),
          children: (
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
                {sponsorErrors[index] && (
                  <p className="text-red-500 text-xs mt-1">
                    {sponsorErrors[index]}
                  </p>
                )}
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
                  max={MAX_INVESTMENT}
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
          ),
        }))}
      />

      {/* Quản lý vé */}
      <h3 className="text-sm font-bold mb-4 text-gray-700">Quản lý vé</h3>
      <Button onClick={handleAddTicketType} icon={<PlusOutlined />}>
        Thêm Loại Vé
      </Button>

      {/* Hiển thị lỗi nếu chưa có loại vé nào */}
      {showErrors && data.createTicketTypeRequests.length === 0 && (
        <p className="text-red-500 text-xs mt-1">Cần có ít nhất một loại vé.</p>
      )}

      <Collapse
        className="mt-4"
        items={data.createTicketTypeRequests.map((ticket, index) => ({
          key: index,
          label: `Loại Vé ${index + 1}`,
          extra: (
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
          ),
          children: (
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
                  {["Vé Thường", "Vé Cao Cấp", "Vé Triễn Lãm"].map(
                    (ticketType) => {
                      // Kiểm tra xem loại vé này đã được sử dụng bởi vé khác chưa
                      const isUsed = data.createTicketTypeRequests.some(
                        (t, i) => t.name === ticketType && i !== index
                      );

                      return (
                        <Option
                          key={ticketType}
                          value={ticketType}
                          disabled={isUsed}
                        >
                          {ticketType}
                        </Option>
                      );
                    }
                  )}
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
                  max={MAX_TICKET_PRICE}
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
                  max={MAX_TICKET_QUANTITY}
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
          ),
        }))}
      />

      <div className="flex space-x-4">
        {/* Select Manager */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Chọn Quản Lý
          </label>
          <Select
            ref={managerSelectRef}
            mode="multiple"
            className="w-full"
            placeholder="Chọn quản lý"
            value={data.assignManagerRequests}
            onChange={(value) =>
              setData({ ...data, assignManagerRequests: value })
            }
            loading={loading}
            dropdownRender={renderDropdownWithRefresh}
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
            ref={staffSelectRef}
            mode="multiple"
            className="w-full"
            placeholder="Chọn nhân viên"
            value={data.assignStaffRequests}
            onChange={(value) =>
              setData({ ...data, assignStaffRequests: value })
            }
            loading={loading}
            dropdownRender={renderDropdownWithRefresh}
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
