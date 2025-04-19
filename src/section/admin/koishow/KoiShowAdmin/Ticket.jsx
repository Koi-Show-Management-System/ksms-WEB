import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import {
  Table,
  Button,
  Input,
  Select,
  Spin,
  Typography,
  Tag,
  Space,
  Modal,
  Pagination,
  Alert,
  Divider,
  Tooltip,
  notification,
} from "antd";
import {
  InfoCircleOutlined,
  CloseOutlined,
  EyeOutlined,
  CheckOutlined,
  StopOutlined,
} from "@ant-design/icons";
import useTicketType from "../../../../hooks/useTicketType";
import { Loading } from "../../../../components";

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

function Ticket({ showId, statusShow }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orderStatus, setOrderStatus] = useState("all");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [displayedOrders, setDisplayedOrders] = useState([]);
  const {
    isLoading,
    error,
    ticketTypes: ticketOrders,
    totalTicketTypes: totalTicketOrders,
    fetchTicketTypes: fetchTicketOrders,
    fetchTicketOrderDetails,
    orderDetails: ticketOrderDetails,
    isLoadingDetails,
    updateTicketRefund,
  } = useTicketType();

  useEffect(() => {
    if (showId) {
      fetchTicketOrders(
        showId,
        currentPage,
        pageSize,
        orderStatus !== "all" ? orderStatus : null
      );
    }
  }, [showId, currentPage, pageSize, orderStatus, fetchTicketOrders]);

  useEffect(() => {
    // Check localStorage for refunded orders when displaying order details
    const refundedOrders = JSON.parse(
      localStorage.getItem("refundedOrders") || "[]"
    );

    // If showing a list of orders, filter out refunded ones
    const filteredOrders = ticketOrderDetails.filter(
      (order) => !refundedOrders.includes(order.id)
    );
    setDisplayedOrders(filteredOrders);

    // Or mark orders as refunded if you're showing them with a status
    const ordersWithRefundStatus = ticketOrderDetails.map((order) => ({
      ...order,
      isRefunded: refundedOrders.includes(order.id),
    }));
    setDisplayedOrders(ordersWithRefundStatus);
  }, [ticketOrderDetails]);

  const handlePageChange = (page, newPageSize) => {
    if (pageSize !== newPageSize) {
      setPageSize(newPageSize);
      setCurrentPage(1);
    } else {
      setCurrentPage(page);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    // Assuming you'll add this functionality to your useTicketType hook
    const result = await updateTicketOrderStatus(orderId, newStatus);
    if (result?.success) {
      fetchTicketOrders(
        showId,
        currentPage,
        pageSize,
        orderStatus !== "all" ? orderStatus : null
      );
    }
  };

  const getStatusTag = (status, isRefunded) => {
    let statusTag;
    switch (status) {
      case "paid":
        statusTag = <Tag color="success">Đã thanh toán</Tag>;
        break;
      case "pending":
        statusTag = <Tag color="warning">Chờ thanh toán</Tag>;
        break;
      case "cancelled":
        statusTag = <Tag color="error">Đã hủy</Tag>;
        break;
      case "expired":
        statusTag = <Tag color="default">Đã hết hạn</Tag>;
        break;
      default:
        statusTag = <Tag>{status}</Tag>;
        break;
    }

    return (
      <Space>
        {statusTag}
        {isRefunded && <Tag color="red">Đã hoàn tiền</Tag>}
      </Space>
    );
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const fetchOrderDetails = async (orderId) => {
    const result = await fetchTicketOrderDetails(orderId);
    if (!result?.success) {
      console.error("Failed to fetch order details");
    }
  };

  const handleViewDetails = (orderId) => {
    setSelectedOrderId(orderId);
    fetchOrderDetails(orderId);
    setIsDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
  };

  // Filter orders
  const items = ticketOrders?.data?.data?.items || [];
  const refundedOrders = JSON.parse(
    localStorage.getItem("refundedOrders") || "[]"
  );

  const filteredOrders = Array.isArray(items)
    ? items
        .filter((order) => {
          // Không lọc theo trạng thái thanh toán vì đã được lọc qua API với tham số orderStatus

          const matchesSearch =
            order.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.transactionCode
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase());

          return matchesSearch;
        })
        .map((order) => ({
          ...order,
          isRefunded: refundedOrders.includes(order.id),
        }))
    : [];

  // Update pagination handling
  useEffect(() => {
    if (showId) {
      fetchTicketOrders(
        showId,
        currentPage,
        pageSize,
        orderStatus !== "all" ? orderStatus : null
      );
    }
  }, [showId, currentPage, pageSize, orderStatus, fetchTicketOrders]);

  // Update total count reference
  const totalItems = ticketOrders?.data?.data?.total || 0;

  // Table columns
  const columns = [
    {
      title: "Họ tên",
      dataIndex: "fullName",
      key: "fullName",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Ngày đặt",
      dataIndex: "orderDate",
      key: "orderDate",
      render: (text) => formatDate(text),
    },
    {
      title: "Mã giao dịch",
      dataIndex: "transactionCode",
      key: "transactionCode",
    },
    {
      title: "Tổng tiền",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (text) => formatCurrency(text),
    },
    {
      title: "Phương thức",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status, record) => getStatusTag(status, record.isRefunded),
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record.id)}
            />
          </Tooltip>
          {/* {record.status === "pending" && (
            <Tooltip title="Đánh dấu đã thanh toán">
              <Button
                type="text"
                size="small"
                className="text-green-500 hover:text-green-700"
                icon={<CheckOutlined />}
                onClick={() => handleStatusChange(record.id, "paid")}
              />
            </Tooltip>
          )}
          {record.status === "paid" && (
            <Tooltip title="Đánh dấu chờ thanh toán">
              <Button
                type="text"
                size="small"
                className="text-red-500 hover:text-red-700"
                icon={<StopOutlined />}
                onClick={() => handleStatusChange(record.id, "pending")}
              />
            </Tooltip>
          )} */}
        </Space>
      ),
    },
  ];

  // Details modal columns
  const detailColumns = [
    {
      title: "Loại vé",
      dataIndex: ["ticketType", "name"],
      key: "ticketType",
    },
    {
      title: "Tên show",
      dataIndex: ["ticketType", "koiShow", "name"],
      key: "showName",
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      align: "right",
    },
    {
      title: "Đơn giá",
      dataIndex: "unitPrice",
      key: "unitPrice",
      align: "right",
      render: (price) => formatCurrency(price),
    },
    {
      title: "Thành tiền",
      key: "subtotal",
      align: "right",
      render: (_, record) => formatCurrency(record.quantity * record.unitPrice),
    },
  ];

  const handleRefund = async (orderId) => {
    // Ensure we have an orderId
    if (!orderId) {
      notification.error({
        message: "Lỗi",
        description: "Không tìm thấy mã đơn hàng",
      });
      return;
    }

    const { success, data, message } = await updateTicketRefund(orderId);

    if (success) {
      notification.success({
        message: "Hoàn tiền thành công",
        description: "Đã hoàn tiền cho đơn hàng này thành công",
      });

      // Store refunded order ID in localStorage
      const refundedOrders = JSON.parse(
        localStorage.getItem("refundedOrders") || "[]"
      );
      refundedOrders.push(orderId);
      localStorage.setItem("refundedOrders", JSON.stringify(refundedOrders));

      // Đóng modal chi tiết
      setIsDetailsOpen(false);

      // Refresh order details
      fetchTicketOrderDetails(orderId);

      // Also refresh the main list
      fetchTicketOrders(
        showId,
        currentPage,
        pageSize,
        orderStatus !== "all" ? orderStatus : null
      );
    } else {
      notification.error({
        message: "Hoàn tiền thất bại",
        description: message || "Đã xảy ra lỗi khi hoàn tiền",
      });
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert message={`Error: ${error}`} type="error" />
      </div>
    );
  }

  // Calculate total from order details
  const orderTotal = Array.isArray(ticketOrderDetails)
    ? ticketOrderDetails.reduce(
        (sum, ticket) => sum + ticket.quantity * ticket.unitPrice,
        0
      )
    : 0;

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      {/* <Title level={4} className="mb-6">
        Quản lý đơn hàng vé
      </Title> */}

      <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-6">
        <Search
          placeholder="Tìm kiếm theo tên, email hoặc mã giao dịch"
          allowClear
          onSearch={(value) => setSearchTerm(value)}
          onChange={(e) => setSearchTerm(e.target.value)}
          value={searchTerm}
          style={{ width: "100%", maxWidth: "300px" }}
        />

        <Select
          value={orderStatus}
          onChange={(value) => {
            setOrderStatus(value);
            setCurrentPage(1); // Reset về trang đầu tiên khi thay đổi bộ lọc
          }}
          style={{ width: "100%", maxWidth: "180px" }}
          placeholder="Trạng thái đơn hàng"
        >
          <Option value="all">Tất cả trạng thái</Option>
          <Option value="pending">Chờ thanh toán</Option>
          <Option value="paid">Đã thanh toán</Option>
          <Option value="cancelled">Đã hủy</Option>
          <Option value="expired">Đã hết hạn</Option>
        </Select>
      </div>

      <div className="overflow-x-auto">
        <Table
          columns={columns}
          dataSource={filteredOrders}
          rowKey="id"
          pagination={false}
          className="mb-6"
          size="middle"
          locale={{ emptyText: "Không tìm thấy đơn hàng vé nào" }}
          scroll={{ x: "max-content" }}
        />
      </div>

      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row justify-between sm:justify-end items-center mt-4">
          <div className="mb-2 sm:mb-0 sm:mr-2 text-gray-600">
            {Math.min((currentPage - 1) * pageSize + 1, totalItems)}-
            {Math.min(currentPage * pageSize, totalItems)} trong {totalItems}
          </div>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={totalItems}
            onChange={handlePageChange}
            onShowSizeChange={(current, size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            showSizeChanger={true}
            pageSizeOptions={["10", "20", "50"]}
            showTotal={false}
            size="small"
            className="flex items-center"
            itemRender={(page, type, originalElement) => {
              if (type === "prev") {
                return (
                  <Button type="text" size="small">
                    &lt;
                  </Button>
                );
              }
              if (type === "next") {
                return (
                  <Button type="text" size="small">
                    &gt;
                  </Button>
                );
              }
              return originalElement;
            }}
          />
        </div>
      )}

      {/* Order Details Modal */}
      <Modal
        title="Chi tiết đơn hàng"
        open={isDetailsOpen}
        onCancel={handleCloseDetails}
        width={"90%"}
        style={{ maxWidth: "800px" }}
        maskClosable={true}
        keyboard={true}
        footer={[
          statusShow === "cancelled" && (
            <Button
              key="refund"
              danger
              onClick={() => handleRefund(selectedOrderId)}
            >
              Đã Hoàn tiền
            </Button>
          ),
          <Button key="close" onClick={handleCloseDetails}>
            Đóng
          </Button>,
        ].filter(Boolean)}
      >
        {isLoadingDetails ? (
          <div className="flex justify-center my-8">
            <Loading />
          </div>
        ) : (
          <div className="overflow-x-auto">
            {Array.isArray(ticketOrderDetails) &&
            ticketOrderDetails.length > 0 ? (
              <>
                <Table
                  columns={detailColumns}
                  dataSource={displayedOrders}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  className="mb-4"
                  scroll={{ x: "max-content" }}
                  summary={() => (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={3} />
                      <Table.Summary.Cell index={3} align="right">
                        <strong>Tổng cộng</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4} align="right">
                        <strong>{formatCurrency(orderTotal)}</strong>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                />
              </>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Không tìm thấy chi tiết vé cho đơn hàng này
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Ticket;
