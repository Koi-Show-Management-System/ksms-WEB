import React, { useEffect } from "react";
import {
  Form,
  InputNumber,
  Button,
  Select,
  message,
  Tooltip,
  Badge,
  Typography,
  Space,
  Card,
  notification,
} from "antd";
import {
  DollarOutlined,
  NumberOutlined,
  InfoCircleOutlined,
  TagOutlined,
  CrownOutlined,
  UserOutlined,
  ScheduleOutlined,
  WarningOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const MAX_TICKET_PRICE = 10000000; // 10 million VND
const MAX_TICKET_QUANTITY = 1000000; // 1 million tickets

// Map ticket type to icons and colors
const TICKET_CONFIG = {
  "Vé Thường": {
    icon: <UserOutlined />,
    color: "#1890ff",
    badge: "blue",
  },
  "Vé Cao Cấp": {
    icon: <CrownOutlined />,
    color: "#722ed1",
    badge: "purple",
  },
};

function TicketForm({
  form,
  onFinish,
  editingTicket,
  onCancel,
  existingTickets = [],
}) {
  const TICKET_TYPES = ["Vé Thường", "Vé Cao Cấp"];

  useEffect(() => {
    // Check if all ticket types are already used when component mounts
    if (!editingTicket) {
      const usedTicketTypes = existingTickets.map((ticket) => ticket.name);
      const availableTicketTypes = TICKET_TYPES.filter(
        (type) => !usedTicketTypes.includes(type)
      );

      if (availableTicketTypes.length === 0) {
        // Silently close the form without showing notification
        onCancel();
      } else {
        // Auto-select the first available ticket type
        form.setFieldsValue({ name: availableTicketTypes[0] });
      }
    }
  }, [existingTickets, editingTicket, form, onCancel, TICKET_TYPES]);

  const handleSubmit = async () => {
    try {
      // Check if creating new ticket and all types are used
      if (!editingTicket) {
        const usedTicketTypes = existingTickets.map((ticket) => ticket.name);
        const availableTicketTypes = TICKET_TYPES.filter(
          (type) => !usedTicketTypes.includes(type)
        );

        if (availableTicketTypes.length === 0) {
          notification.error({
            message: "Không thể tạo thêm loại vé",
            description: "Đã sử dụng hết tất cả các loại vé.",
            placement: "top",
            duration: 4,
          });
          return;
        }
      }

      const values = await form.validateFields();

      // Check if price exceeds maximum
      if (values.price > MAX_TICKET_PRICE) {
        notification.error({
          message: "Giá vé không hợp lệ",
          description: `Giá vé không được vượt quá ${MAX_TICKET_PRICE.toLocaleString("vi-VN")} VND (10 triệu)`,
          placement: "top",
          duration: 4,
        });
        return;
      }

      // Check if quantity exceeds maximum
      if (values.availableQuantity > MAX_TICKET_QUANTITY) {
        notification.error({
          message: "Số lượng vé không hợp lệ",
          description: `Số lượng vé không được vượt quá ${MAX_TICKET_QUANTITY.toLocaleString("vi-VN")} vé (1 triệu)`,
          placement: "top",
          duration: 4,
        });
        return;
      }

      // Check if standard ticket price is less than premium ticket price
      if (values.name === "Vé Thường") {
        // Find premium ticket if it exists
        const premiumTicket = existingTickets.find(
          (ticket) =>
            ticket.name === "Vé Cao Cấp" &&
            (!editingTicket || ticket.id !== editingTicket.id)
        );

        if (premiumTicket && values.price >= premiumTicket.price) {
          notification.error({
            message: "Giá vé không hợp lệ",
            description: "Giá Vé Thường phải nhỏ hơn giá Vé Cao Cấp",
            placement: "top",
            duration: 4,
          });
          return;
        }
      }

      // Check if premium ticket price is greater than standard ticket price
      if (values.name === "Vé Cao Cấp") {
        // Find standard ticket if it exists
        const standardTicket = existingTickets.find(
          (ticket) =>
            ticket.name === "Vé Thường" &&
            (!editingTicket || ticket.id !== editingTicket.id)
        );

        if (standardTicket && values.price <= standardTicket.price) {
          notification.error({
            message: "Giá vé không hợp lệ",
            description: "Giá Vé Cao Cấp phải lớn hơn giá Vé Thường",
            placement: "top",
            duration: 4,
          });
          return;
        }
      }

      onFinish(values);
    } catch (validationError) {
      console.error("Validation error:", validationError);
    }
  };

  // Get the current selected ticket type to show appropriate styling
  const selectedTicketType =
    form.getFieldValue("name") ||
    (editingTicket ? editingTicket.name : TICKET_TYPES[0]);
  const ticketConfig =
    TICKET_CONFIG[selectedTicketType] || TICKET_CONFIG["Vé Thường"];

  return (
    <div className="p-0">
      <Card
        className="ticket-form-card shadow-lg border-0"
        styles={{
          body: { padding: "24px" },
          header: {
            borderBottom: `2px solid ${ticketConfig.color}`,
            padding: "16px 24px",
          },
        }}
        title={
          <div className="flex items-center">
            <Badge
              count={
                <TagOutlined style={{ color: "white", fontSize: "14px" }} />
              }
              style={{ backgroundColor: ticketConfig.color }}
            />
            <Title level={4} style={{ margin: 0, marginLeft: "12px" }}>
              {editingTicket ? "Chỉnh sửa vé" : "Tạo loại vé mới"}
            </Title>
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
          size="large"
          initialValues={editingTicket}
        >
          <Form.Item
            name="name"
            label={
              <Text strong className="text-base flex items-center">
                Loại vé
                <Tooltip title="Chọn loại vé cho triển lãm">
                  <InfoCircleOutlined className="ml-1 text-gray-400" />
                </Tooltip>
              </Text>
            }
            rules={[{ required: true, message: "Vui lòng chọn loại vé!" }]}
          >
            <Select
              placeholder="Chọn loại vé"
              className="rounded-lg"
              dropdownStyle={{ borderRadius: "8px" }}
              optionLabelProp="label"
            >
              {TICKET_TYPES.map((ticketType) => {
                // Check if ticket type is already used
                const isUsed = existingTickets.some(
                  (t) =>
                    t.name === ticketType &&
                    (!editingTicket || t.id !== editingTicket.id)
                );

                const config = TICKET_CONFIG[ticketType];

                return (
                  <Select.Option
                    key={ticketType}
                    value={ticketType}
                    disabled={isUsed}
                    label={ticketType}
                  >
                    <div className="flex items-center">
                      <Badge
                        color={config.badge}
                        text={
                          <Space>
                            {config.icon}
                            <span>{ticketType}</span>
                            {isUsed && (
                              <Text
                                type="secondary"
                                style={{ fontSize: "12px" }}
                              >
                                (Đã sử dụng)
                              </Text>
                            )}
                          </Space>
                        }
                      />
                    </div>
                  </Select.Option>
                );
              })}
            </Select>
          </Form.Item>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Form.Item
              name="price"
              label={
                <Text strong className="text-base flex items-center">
                  Giá vé
                  <Tooltip title="Giá vé tối đa là 10.000.000 VND">
                    <InfoCircleOutlined className="ml-1 text-gray-400" />
                  </Tooltip>
                </Text>
              }
              rules={[
                { required: true, message: "Vui lòng nhập giá vé!" },
                {
                  type: "number",
                  min: 0,
                  message: "Giá vé không được nhỏ hơn 0",
                },
                {
                  type: "number",
                  max: MAX_TICKET_PRICE,
                  message: `Giá vé không được vượt quá ${MAX_TICKET_PRICE.toLocaleString(
                    "vi-VN"
                  )} VND`,
                },
              ]}
              tooltip="Giá vé tối đa là 10.000.000 VND"
            >
              <InputNumber
                min={0}
                max={MAX_TICKET_PRICE}
                style={{ width: "100%" }}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                placeholder="Nhập giá vé"
                addonAfter="VND"
                className="rounded-lg"
                prefix={<DollarOutlined className="text-green-500 mr-2" />}
              />
            </Form.Item>

            <Form.Item
              name="availableQuantity"
              label={
                <Text strong className="text-base flex items-center">
                  Số lượng vé
                  <Tooltip title="Số lượng vé tối đa là 1.000.000 vé">
                    <InfoCircleOutlined className="ml-1 text-gray-400" />
                  </Tooltip>
                </Text>
              }
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập số lượng vé!",
                },
                {
                  type: "number",
                  min: 1,
                  message: "Số lượng vé phải lớn hơn 0",
                },
                {
                  type: "number",
                  max: MAX_TICKET_QUANTITY,
                  message: `Số lượng vé không được vượt quá ${MAX_TICKET_QUANTITY.toLocaleString(
                    "vi-VN"
                  )} vé`,
                },
              ]}
            >
              <InputNumber
                min={1}
                max={MAX_TICKET_QUANTITY}
                style={{ width: "100%" }}
                placeholder="Nhập số lượng vé"
                className="rounded-lg"
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                prefix={<NumberOutlined className="text-orange-400 mr-2" />}
                addonAfter="vé"
              />
            </Form.Item>
          </div>

          <div className="flex justify-end mt-8 space-x-3">
            <Button
              size="large"
              className="rounded-lg px-8 hover:bg-gray-100 border-gray-300"
              onClick={onCancel}
            >
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              className="rounded-lg px-8"
              style={{
                background: ticketConfig.color,
                borderColor: ticketConfig.color,
              }}
            >
              {editingTicket ? "Lưu thay đổi" : "Tạo vé"}
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}

export default TicketForm;
