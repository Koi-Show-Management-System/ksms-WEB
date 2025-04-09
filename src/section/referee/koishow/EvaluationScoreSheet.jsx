import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  Typography,
  Button,
  Form,
  Select,
  InputNumber,
  Table,
  Tag,
  Space,
  Alert,
  notification,
  Modal,
  Divider,
  Collapse,
  Tooltip,
  Input,
  Slider,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  InfoCircleOutlined,
  PercentageOutlined,
  EditOutlined,
} from "@ant-design/icons";
import useScore from "../../../hooks/useScore";
import { createErrorType } from "../../../api/errorType";

const { Title, Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

const EvaluationScoreSheet = ({
  criteriaList,
  registrationId,
  registrationRoundId,
  refereeAccountId,
  onScoreSubmitted,
}) => {
  const [form] = Form.useForm();
  const [criteriaErrors, setCriteriaErrors] = useState({});
  const [totalDeduction, setTotalDeduction] = useState(0);
  const [initialScore, setInitialScore] = useState(100);
  const [isPublic, setIsPublic] = useState(false);
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [addErrorModalVisible, setAddErrorModalVisible] = useState(false);
  const [currentCriteriaId, setCurrentCriteriaId] = useState(null);
  const [newErrorName, setNewErrorName] = useState("");
  const [creatingError, setCreatingError] = useState(false);
  const [sliderRange, setSliderRange] = useState([0, 30]); // Default to light error range
  const [calculatedFormula, setCalculatedFormula] = useState({
    weight: "0",
    percentage: "0",
    result: "0",
  });

  const { createScoreEvaluation } = useScore();

  // Thêm useRef để theo dõi state hiện tại
  const errorsRef = useRef({});

  // Thêm state để lưu trữ lỗi tạm thời
  const [tempErrorId, setTempErrorId] = useState(-1); // ID tạm thời bắt đầu từ -1 và giảm dần
  const [localErrorTypes, setLocalErrorTypes] = useState([]); // Lưu tất cả các error types được tạo cục bộ

  // Thêm state để theo dõi chế độ chỉnh sửa
  const [isEditing, setIsEditing] = useState(false);
  const [editingError, setEditingError] = useState(null);
  const [editingErrorIndex, setEditingErrorIndex] = useState(null);

  // Thêm state để theo dõi giá trị hiện tại của slider
  const [currentPercentage, setCurrentPercentage] = useState(10);

  // Cập nhật useEffect để theo dõi criteriaErrors
  useEffect(() => {
    errorsRef.current = criteriaErrors;
  }, [criteriaErrors]);

  // Initialize error structure for each criteria
  useEffect(() => {
    if (criteriaList && criteriaList.length > 0) {
      const initialErrors = {};
      criteriaList.forEach((criteria) => {
        initialErrors[criteria.id || criteria.criteria?.id] = [];
      });
      setCriteriaErrors(initialErrors);
    }
  }, [criteriaList]);

  // Calculate total deduction based on all errors
  useEffect(() => {
    let total = 0;
    Object.values(criteriaErrors).forEach((errors) => {
      errors.forEach((error) => {
        total += error.pointMinus || 0;
      });
    });
    setTotalDeduction(total);
  }, [criteriaErrors]);

  // Add this useEffect for debugging
  useEffect(() => {
    if (criteriaList && criteriaList.length > 0) {
      console.log("Full criteriaList:", criteriaList);

      // Kiểm tra cấu trúc ID trong từng criteria
      criteriaList.forEach((criteria, index) => {
        console.log(`Criteria ${index}:`, {
          directId: criteria.id,
          nestedId: criteria.criteria?.id,
          name: criteria.name || criteria.criteria?.name,
        });
      });
    }
  }, [criteriaList]);

  // Severity level options
  const severityLevels = [
    { label: "Lỗi nhẹ (0-30%)", value: "eb", range: [0, 30] },
    { label: "Lỗi trung bình (30-70%)", value: "mb", range: [30, 70] },
    { label: "Lỗi nghiêm trọng (70-100%)", value: "sb", range: [70, 100] },
  ];

  // Add error to a criteria
  const addError = (criteriaId, errorTypeId, severity, percentage) => {
    // Tìm tiêu chí
    const criteria = criteriaList.find(
      (c) => (c.criteria?.id || c.id) === criteriaId
    );

    if (!criteria) {
      console.error("Không tìm thấy tiêu chí với ID:", criteriaId);
      return;
    }

    // Lấy trọng số
    const criteriaWeight = criteria.weight || 0;

    // Tính điểm trừ theo công thức: Trọng số × Mức độ lỗi (%)
    const pointMinus = parseFloat(
      (criteriaWeight * (percentage / 100) * 100).toFixed(2)
    );

    // Tạo object lỗi
    const error = {
      errorTypeId, // ID từ API createErrorType
      severity, // Mức độ lỗi (eb, mb, sb)
      pointMinus, // Điểm trừ đã tính
      percentage, // % lỗi đã chọn
      errorName: newErrorName, // Tên lỗi (để hiển thị)
    };

    console.log("Adding error:", error, "to criteriaId:", criteriaId);

    // Cập nhật state sử dụng hàm cập nhật (function updater)
    setCriteriaErrors((prevErrors) => {
      // Clone state hiện tại
      const newErrors = { ...prevErrors };

      // Tạo mảng mới nếu chưa có
      if (!newErrors[criteriaId]) {
        newErrors[criteriaId] = [];
      }

      // Thêm lỗi vào mảng
      newErrors[criteriaId] = [...newErrors[criteriaId], error];

      console.log("New errors state:", newErrors);
      return newErrors;
    });
  };

  // Remove error from a criteria
  const removeError = (criteriaId, index) => {
    setCriteriaErrors((prev) => ({
      ...prev,
      [criteriaId]: prev[criteriaId].filter((_, i) => i !== index),
    }));
  };

  // Hàm tạo lỗi mới KHÔNG gọi API, chỉ lưu trữ cục bộ
  const handleCreateLocalErrorType = () => {
    if (!newErrorName || !currentCriteriaId) {
      notification.error({
        message: "Lỗi",
        description: "Vui lòng nhập tên lỗi",
      });
      return;
    }

    setCreatingError(true);
    try {
      // Tạo một ID tạm thời cho lỗi mới (ID âm để tránh xung đột với ID từ server)
      const localErrorId = tempErrorId;

      // Giảm tempErrorId để ID tiếp theo sẽ khác
      setTempErrorId((prevId) => prevId - 1);

      // Tạo error type cục bộ
      const newErrorType = {
        id: localErrorId,
        name: newErrorName,
        criteriaId: currentCriteriaId,
        isLocal: true, // Đánh dấu đây là lỗi cục bộ, chưa được lưu trên server
      };

      // Lưu error type mới vào state
      setLocalErrorTypes((prev) => [...prev, newErrorType]);

      // Lấy thông tin từ form
      const formValues = form.getFieldsValue([
        "severity",
        "percentage",
        "calculatedPointMinus",
      ]);

      // Tìm tiêu chí
      const criteria = criteriaList.find(
        (c) => (c.criteria?.id || c.id) === currentCriteriaId
      );

      if (!criteria) {
        throw new Error("Không tìm thấy tiêu chí");
      }

      // Lấy trọng số
      const criteriaWeight = criteria.weight || 0;

      // Tính điểm trừ theo công thức chính xác: Trọng số × (Mức độ lỗi/100) × 100
      const pointMinus = parseFloat(
        (criteriaWeight * (formValues.percentage / 100) * 100).toFixed(2)
      );

      // Tạo object lỗi với điểm trừ đã tính
      const error = {
        errorTypeId: localErrorId, // Sử dụng ID cục bộ
        severity: formValues.severity,
        pointMinus: pointMinus,
        percentage: formValues.percentage,
        errorName: newErrorName,
        isLocal: true, // Đánh dấu lỗi này là cục bộ
      };

      // Cập nhật state
      setCriteriaErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        if (!newErrors[currentCriteriaId]) {
          newErrors[currentCriteriaId] = [];
        }
        newErrors[currentCriteriaId] = [...newErrors[currentCriteriaId], error];
        return newErrors;
      });

      // Đóng modal và reset form
      setAddErrorModalVisible(false);
      form.resetFields();
      setNewErrorName("");

      // Thông báo thành công
      notification.success({
        message: "Thành công",
        description: "Đã thêm lỗi mới ",
      });
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: error.message || "Đã xảy ra lỗi khi tạo lỗi mới",
      });
    } finally {
      setCreatingError(false);
    }
  };

  // Thêm hàm addErrorWithCustomPoint
  const addErrorWithCustomPoint = (
    criteriaId,
    errorTypeId,
    severity,
    percentage
  ) => {
    // Tạo object lỗi với điểm trừ đã nhập
    const criteria = criteriaList.find(
      (c) => (c.criteria?.id || c.id) === criteriaId
    );
    const criteriaWeight = criteria ? criteria.weight || 0 : 0;

    const error = {
      errorTypeId, // ID từ API createErrorType
      severity, // Mức độ lỗi (eb, mb, sb)
      pointMinus: parseFloat(
        (criteriaWeight * (percentage / 100) * 100).toFixed(2)
      ),
      percentage, // % lỗi đã chọn
      errorName: newErrorName, // Tên lỗi (để hiển thị)
    };

    console.log(
      "Adding error with custom point:",
      error,
      "to criteriaId:",
      criteriaId
    );

    // Cập nhật state
    setCriteriaErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      if (!newErrors[criteriaId]) {
        newErrors[criteriaId] = [];
      }
      newErrors[criteriaId] = [...newErrors[criteriaId], error];
      return newErrors;
    });
  };

  // Sửa lại hàm handleSubmit để xử lý cả lỗi cục bộ
  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Tạo mảng để lưu trữ các lỗi cần gửi
      const createScoreDetailErrors = [];

      // Tạo mảng để lưu trữ các promise tạo error type
      const errorTypePromises = [];

      console.log("Before processing, criteriaErrors:", criteriaErrors);

      // Lặp qua tất cả các tiêu chí và lỗi
      for (const [criteriaId, errors] of Object.entries(criteriaErrors)) {
        console.log(
          `Processing criteriaId ${criteriaId} with ${errors.length} errors`
        );

        for (const error of errors) {
          console.log("Processing error:", error);

          // Tính weight từ percentage
          let errorWeight;
          try {
            // Kiểm tra giá trị percentage
            const percentageValue = parseFloat(error.percentage);
            if (isNaN(percentageValue)) {
              console.warn(
                `Invalid percentage value: ${error.percentage}, using default 0.01`
              );
              errorWeight = 0.01;
            } else {
              // Tính weight từ percentage và giới hạn từ 0 đến 1
              errorWeight = Math.min(Math.max(percentageValue / 100, 0), 1);
              console.log(
                `Calculated weight from percentage ${percentageValue}: ${errorWeight}`
              );
            }
          } catch (e) {
            console.error("Error calculating weight:", e);
            errorWeight = 0.01; // Giá trị mặc định nếu có lỗi
          }

          // Format weight thành chuỗi với 2 chữ số thập phân
          const formattedWeight = errorWeight.toFixed(2);
          console.log(`Formatted weight: ${formattedWeight}`);

          // Nếu là lỗi cục bộ, cần tạo error type trên server trước
          if (error.isLocal) {
            const errorTypePromise = createErrorType(
              criteriaId,
              error.errorName
            ).then((response) => {
              console.log("API Response for creating error type:", response);

              // Lấy ID thực từ response
              const realErrorId = response.data?.data?.id;

              if (!realErrorId) {
                throw new Error(
                  "Không thể tìm thấy ID trong response khi tạo lỗi " +
                    error.errorName
                );
              }

              // Thêm lỗi với ID thực vào mảng để gửi
              const errorDetail = {
                errorTypeId: realErrorId,
                severity: error.severity,
                weight: formattedWeight, // Sử dụng weight đã format
                pointMinus: error.pointMinus,
              };

              console.log("Adding error detail to array:", errorDetail);
              createScoreDetailErrors.push(errorDetail);

              return realErrorId;
            });

            errorTypePromises.push(errorTypePromise);
          } else {
            // Thêm lỗi với ID có sẵn vào mảng để gửi
            const errorDetail = {
              errorTypeId: error.errorTypeId,
              severity: error.severity,
              weight: formattedWeight, // Sử dụng weight đã format
              pointMinus: error.pointMinus,
            };

            console.log("Adding error detail to array:", errorDetail);
            createScoreDetailErrors.push(errorDetail);
          }
        }
      }

      // Đợi tất cả các error type được tạo xong
      await Promise.all(errorTypePromises);

      const requestBody = {
        refereeAccountId,
        registrationRoundId,
        initialScore,
        totalPointMinus: totalDeduction,
        comment: comments,
        createScoreDetailErrors,
      };

      console.log("Final request body:", JSON.stringify(requestBody, null, 2));

      // Gọi API với dữ liệu đã tính
      const result = await createScoreEvaluation(requestBody);

      console.log("Score submission result:", result);

      // Kiểm tra nếu result.success hoặc đúng status code
      if (result.success || result.status === 201 || result.status === 200) {
        console.log("result", result);

        notification.success({
          message: "Chấm điểm thành công",
          description: "Điểm đánh giá đã được lưu",
        });

        // Gọi callback nếu có
        if (onScoreSubmitted && typeof onScoreSubmitted === "function") {
          onScoreSubmitted(result);
        }
      }
    } catch (error) {
      console.error("Error submitting score:", error);

      // Kiểm tra nếu lỗi có status 201 (thành công)
      if (error.response && error.response.status === 201) {
        notification.success({
          message: "Chấm điểm thành công",
          description: "Điểm đánh giá đã được lưu",
        });

        if (onScoreSubmitted && typeof onScoreSubmitted === "function") {
          onScoreSubmitted({ success: true });
        }
      } else {
        notification.error({
          message: "Lỗi",
          description: error.message || "Đã xảy ra lỗi khi lưu điểm đánh giá",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật hàm handleSeverityChange để cập nhật cả công thức hiển thị
  const handleSeverityChange = (value) => {
    const selectedSeverity = severityLevels.find((s) => s.value === value);
    if (selectedSeverity) {
      setSliderRange(selectedSeverity.range);

      // Set default percentage to the middle of the range
      const defaultPercentage = Math.round(
        (selectedSeverity.range[0] + selectedSeverity.range[1]) / 2
      );
      form.setFieldsValue({ percentage: defaultPercentage });
      setCurrentPercentage(defaultPercentage); // Cập nhật state

      // Cập nhật công thức hiển thị với giá trị phần trăm mới
      if (currentCriteriaId) {
        const criteria = criteriaList.find(
          (c) => (c.criteria?.id || c.id) === currentCriteriaId
        );
        if (criteria) {
          const criteriaWeight = criteria.weight || 0;
          const calculatedPoint = parseFloat(
            (criteriaWeight * (defaultPercentage / 100) * 100).toFixed(2)
          );

          // Cập nhật công thức hiển thị
          setCalculatedFormula({
            weight: (criteriaWeight * 100).toFixed(0),
            percentage: defaultPercentage,
            result: calculatedPoint,
          });
        }
      }
    }
  };

  // Thêm hàm để xử lý việc mở modal để chỉnh sửa lỗi
  const handleEditError = (criteriaId, error, index) => {
    setCurrentCriteriaId(criteriaId);
    setIsEditing(true);
    setEditingError(error);
    setEditingErrorIndex(index);
    setNewErrorName(error.errorName);
    setCurrentPercentage(error.percentage); // Cập nhật state với giá trị phần trăm hiện tại

    // Tìm range cho severity
    const selectedSeverity = severityLevels.find(
      (s) => s.value === error.severity
    );
    setSliderRange(selectedSeverity ? selectedSeverity.range : [0, 30]);

    // Tìm tiêu chí
    const criteria = criteriaList.find(
      (c) => (c.criteria?.id || c.id) === criteriaId
    );

    if (criteria) {
      const criteriaWeight = criteria.weight || 0;

      // Cập nhật công thức hiển thị
      setCalculatedFormula({
        weight: (criteriaWeight * 100).toFixed(0),
        percentage: error.percentage,
        result: error.pointMinus,
      });

      // Set values for the form
      form.setFieldsValue({
        errorName: error.errorName,
        severity: error.severity,
        percentage: error.percentage,
        calculatedPointMinus: error.pointMinus,
      });
    }

    setAddErrorModalVisible(true);
  };

  // Cập nhật hàm để lưu lỗi đã chỉnh sửa
  const handleSaveError = () => {
    if (isEditing) {
      // Lưu chỉnh sửa lỗi
      const formValues = form.getFieldsValue();

      // Tìm tiêu chí
      const criteria = criteriaList.find(
        (c) => (c.criteria?.id || c.id) === currentCriteriaId
      );

      if (!criteria) {
        notification.error({
          message: "Lỗi",
          description: "Không tìm thấy tiêu chí",
        });
        return;
      }

      // Tính điểm trừ
      const criteriaWeight = criteria.weight || 0;
      const pointMinus = parseFloat(
        (criteriaWeight * (formValues.percentage / 100) * 100).toFixed(2)
      );

      // Cập nhật lỗi đang chỉnh sửa
      const updatedError = {
        ...editingError,
        errorName: newErrorName,
        severity: formValues.severity,
        percentage: formValues.percentage,
        pointMinus: pointMinus,
      };

      // Cập nhật state
      setCriteriaErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        newErrors[currentCriteriaId][editingErrorIndex] = updatedError;
        return newErrors;
      });

      notification.success({
        message: "Thành công",
        description: "Đã cập nhật lỗi",
      });
    } else {
      // Gọi hàm tạo lỗi mới nếu không phải đang chỉnh sửa
      handleCreateLocalErrorType();
    }

    // Đóng modal và reset state
    setAddErrorModalVisible(false);
    setIsEditing(false);
    setEditingError(null);
    setEditingErrorIndex(null);
    form.resetFields();
    setNewErrorName("");
  };

  // Cập nhật hàm showAddErrorModal để khởi tạo công thức hiển thị
  const showAddErrorModal = (criteriaObj) => {
    // Reset editing state
    setIsEditing(false);
    setEditingError(null);
    setEditingErrorIndex(null);
    setNewErrorName("");

    // Thiết lập giá trị phần trăm mặc định
    const defaultPercentage = 10;
    setCurrentPercentage(defaultPercentage);

    // Lấy ID tiêu chí
    const criteriaId = criteriaObj.criteria?.id || criteriaObj.id;
    setCurrentCriteriaId(criteriaId);

    // Thiết lập range mặc định cho slider (lỗi nhẹ)
    setSliderRange([0, 30]);

    // Tìm tiêu chí để lấy trọng số
    const criteria = criteriaList.find(
      (c) => (c.criteria?.id || c.id) === criteriaId
    );

    if (criteria) {
      const criteriaWeight = criteria.weight || 0;

      // Tính điểm trừ ban đầu
      const initialPointMinus = parseFloat(
        (criteriaWeight * (defaultPercentage / 100) * 100).toFixed(2)
      );

      // Cập nhật công thức hiển thị với giá trị ban đầu
      setCalculatedFormula({
        weight: (criteriaWeight * 100).toFixed(0),
        percentage: defaultPercentage,
        result: initialPointMinus,
      });

      // Thiết lập giá trị ban đầu cho form
      form.setFieldsValue({
        severity: "eb", // Mặc định là lỗi nhẹ
        percentage: defaultPercentage,
        calculatedPointMinus: initialPointMinus,
      });
    }

    setAddErrorModalVisible(true);
  };

  // Formula explanation
  const formulaExplanation = (
    <div className="bg-gray-50 p-4 rounded-md ">
      {/* <div className="flex items-center mb-2">
        <InfoCircleOutlined className="mr-2 text-blue-500" />
        <Text strong>Công thức tính điểm trừ:</Text>
      </div>
      <Text>
        Điểm trừ = Trọng số tiêu chí (W) × (Mức độ lỗi (L) / 100) × 100
      </Text> */}
    </div>
  );

  return (
    <div className="evaluation-score-sheet">
      {formulaExplanation}

      <Collapse defaultActiveKey={["criteria"]} className="mb-4">
        <Panel header="Tiêu chí đánh giá và bảng chấm điểm" key="criteria">
          {criteriaList.map((criteria) => {
            // Đảm bảo lấy đúng ID của tiêu chí
            const criteriaId = criteria.criteria?.id || criteria.id;

            // Debug để xem đang sử dụng ID nào
            console.log("Rendering criteria with ID:", criteriaId);

            // Lấy danh sách lỗi cho tiêu chí này
            const errors = criteriaErrors[criteriaId] || [];

            const criteriaName = criteria.criteria?.name || criteria.name;
            const weight = criteria.weight || 0;

            // Calculate total deduction for this criteria
            const criteriaDeduction = errors.reduce(
              (sum, error) => sum + (error.pointMinus || 0),
              0
            );

            return (
              <Card
                key={criteriaId}
                title={
                  <div className="flex justify-between items-center">
                    <span>{criteriaName}</span>
                    <Tag color="blue">
                      Trọng số: {(weight * 100).toFixed(0)}%
                    </Tag>
                  </div>
                }
                className="mb-4"
                extra={
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => showAddErrorModal(criteria)}
                  >
                    Thêm lỗi
                  </Button>
                }
              >
                {errors.length > 0 ? (
                  <div>
                    <Table
                      dataSource={errors.map((error, index) => ({
                        ...error,
                        key: index,
                      }))}
                      pagination={false}
                      size="small"
                      columns={[
                        {
                          title: "Tên lỗi",
                          dataIndex: "errorName",
                          key: "errorName",
                        },
                        {
                          title: "Mức độ",
                          dataIndex: "severity",
                          key: "severity",
                          render: (severity) => {
                            const severityObj = severityLevels.find(
                              (s) => s.value === severity
                            );
                            let color = "green";
                            if (severity === "mb") color = "orange";
                            if (severity === "sb") color = "red";
                            return (
                              <Tag color={color}>
                                {severity === "eb"
                                  ? "Lỗi nhẹ"
                                  : severity === "mb"
                                    ? "Lỗi trung bình"
                                    : severity === "sb"
                                      ? "Lỗi nghiêm trọng"
                                      : severityObj?.label || severity}
                              </Tag>
                            );
                          },
                        },
                        {
                          title: "Phần trăm",
                          dataIndex: "percentage",
                          key: "percentage",
                          render: (percentage) => `${percentage}%`,
                        },
                        {
                          title: "Điểm trừ",
                          dataIndex: "pointMinus",
                          key: "pointMinus",
                          render: (pointMinus) => (
                            <span className="text-red-500">-{pointMinus}</span>
                          ),
                        },
                        {
                          title: "Hành động",
                          key: "action",
                          render: (_, record, index) => (
                            <Space>
                              <Button
                                type="text"
                                icon={<EditOutlined />}
                                onClick={() =>
                                  handleEditError(criteriaId, record, index)
                                }
                              />
                              <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => removeError(criteriaId, index)}
                              />
                            </Space>
                          ),
                        },
                      ]}
                    />
                    <div className="mt-3 text-right">
                      <Text strong>Tổng điểm trừ: </Text>
                      <Text strong className="text-red-500">
                        -{criteriaDeduction.toFixed(2)}
                      </Text>
                    </div>
                    {/* <div className="flex justify-between mt-2">
                      <Button
                        type="default"
                        size="small"
                        onClick={() => {
                          // Force a re-render by making a copy of the state
                          setCriteriaErrors({ ...criteriaErrors });
                          console.log("Current errors:", criteriaErrors);
                        }}
                      >
                        Làm mới
                      </Button>
                    </div> */}
                  </div>
                ) : (
                  <Alert
                    message="Chưa có lỗi nào được ghi nhận"
                    type="info"
                    showIcon
                  />
                )}
              </Card>
            );
          })}
        </Panel>
      </Collapse>

      <Card className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <Title level={4}>Tổng kết</Title>
          <div>
            <Text strong>Điểm ban đầu: </Text>
            <Text strong>{initialScore}</Text>
          </div>
        </div>
        <div className="flex justify-between items-center mb-4">
          <Text>Tổng điểm trừ:</Text>
          <Text className="text-red-500 text-xl">
            -{totalDeduction.toFixed(2)}
          </Text>
        </div>
        <div className="flex justify-between items-center mb-4">
          <Text strong>Điểm cuối cùng:</Text>
          <Text strong className="text-xl">
            {(initialScore - totalDeduction).toFixed(2)}
          </Text>
        </div>
        <Divider />
        <Form layout="vertical">
          <Form.Item label="Ghi chú">
            <Input.TextArea
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Nhập ghi chú (không bắt buộc)"
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={loading}
              onClick={handleSubmit}
              block
              size="large"
            >
              Lưu kết quả đánh giá
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Modal to add new error */}
      <Modal
        title={isEditing ? "Chỉnh sửa lỗi" : "Thêm lỗi mới"}
        open={addErrorModalVisible}
        onCancel={() => {
          setAddErrorModalVisible(false);
          setIsEditing(false);
          setEditingError(null);
          setEditingErrorIndex(null);
          form.resetFields();
          setNewErrorName("");
        }}
        onOk={handleSaveError}
        confirmLoading={creatingError}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="errorName"
            label="Tên lỗi"
            rules={[{ required: true, message: "Vui lòng nhập tên lỗi" }]}
          >
            <Input
              placeholder="Nhập tên lỗi"
              value={newErrorName}
              onChange={(e) => setNewErrorName(e.target.value)}
            />
          </Form.Item>

          <Form.Item
            name="severity"
            label="Mức độ lỗi"
            initialValue="eb"
            rules={[{ required: true, message: "Vui lòng chọn mức độ lỗi" }]}
          >
            <Select onChange={handleSeverityChange}>
              {severityLevels.map((level) => (
                <Option key={level.value} value={level.value}>
                  {level.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="percentage"
            label={
              <span>
                Phần trăm lỗi: <Text strong>{currentPercentage}%</Text>
                <Tooltip title="Phần trăm trong khoảng của mức độ lỗi đã chọn">
                  <InfoCircleOutlined className="ml-1" />
                </Tooltip>
              </span>
            }
            initialValue={10}
            rules={[{ required: true, message: "Vui lòng chọn phần trăm lỗi" }]}
          >
            <Slider
              min={sliderRange[0]}
              max={sliderRange[1]}
              marks={{
                [sliderRange[0]]: `${sliderRange[0]}%`,
                [sliderRange[1]]: `${sliderRange[1]}%`,
              }}
              tooltip={{
                formatter: (value) => `${value}%`,
              }}
              onChange={(value) => {
                // Cập nhật state để hiển thị giá trị hiện tại
                setCurrentPercentage(value);

                // Tính toán điểm trừ theo công thức và hiển thị
                if (currentCriteriaId) {
                  const criteria = criteriaList.find(
                    (c) => (c.criteria?.id || c.id) === currentCriteriaId
                  );
                  if (criteria) {
                    const criteriaWeight = criteria.weight || 0;
                    const calculatedPoint = parseFloat(
                      (criteriaWeight * (value / 100) * 100).toFixed(2)
                    );

                    // Cập nhật trường ẩn điểm trừ
                    form.setFieldsValue({
                      calculatedPointMinus: calculatedPoint,
                    });

                    // Cập nhật công thức hiển thị
                    setCalculatedFormula({
                      weight: (criteriaWeight * 100).toFixed(0),
                      percentage: value,
                      result: calculatedPoint,
                    });
                  }
                }
              }}
            />
          </Form.Item>

          {/* Hiển thị công thức tính điểm trừ */}
          <div className="bg-gray-50 p-3 rounded-lg mb-4">
            <Text strong>Điểm trừ tính theo công thức:</Text>
            <div className="mt-2 text-center">
              <Text>
                {calculatedFormula.weight || "0"}% × (
                {calculatedFormula.percentage || "0"}/100) × 100 ={" "}
                <Text strong className="text-red-500">
                  {calculatedFormula.result || "0"}
                </Text>
              </Text>
            </div>
          </div>

          {/* Thêm trường ẩn để lưu điểm trừ đã tính */}
          <Form.Item name="calculatedPointMinus" hidden>
            <InputNumber />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EvaluationScoreSheet;
