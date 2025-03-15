import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Spin,
  message,
  Tabs,
  Row,
  Col,
  Collapse,
  List,
  Descriptions,
  Card,
  Tag,
  Space,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SaveOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

import useVariety from "../../../../hooks/useVariety";
import useCategory from "../../../../hooks/useCategory";
import useAccountTeam from "../../../../hooks/useAccountTeam";
import useCriteria from "../../../../hooks/useCriteria";

const { Option } = Select;
const { TextArea } = Input;
const { Panel } = Collapse;

dayjs.extend(utc);
dayjs.extend(timezone);

function EditCategory({ categoryId, onClose, onCategoryUpdated, showId }) {
  const { currentCategory, getCategoryDetail, updateCategory, isLoading } =
    useCategory();
  const { variety, fetchVariety, isLoading: isLoadingVariety } = useVariety();
  const { accountManage, fetchAccountTeam } = useAccountTeam();
  const {
    criteria,
    fetchCriteria,
    isLoading: isLoadingCriteria,
  } = useCriteria();

  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState("1");
  const [editingAwardIndex, setEditingAwardIndex] = useState(null);
  const [editingCriteria, setEditingCriteria] = useState(false);
  const [editingReferees, setEditingReferees] = useState(false);
  const [tempSelectedCriteria, setTempSelectedCriteria] = useState([]);
  const [selectedRoundForCriteria, setSelectedRoundForCriteria] =
    useState(null);

  const referee = accountManage.referees || [];

  const mainRounds = [
    { value: "Preliminary", label: "Vòng Sơ Khảo" },
    { value: "Evaluation", label: "Vòng Đánh Giá Chính" },
    { value: "Final", label: "Vòng Chung Kết" },
  ];

  const roundLabelMap = {
    Preliminary: "Vòng Sơ Khảo",
    Evaluation: "Vòng Đánh Giá Chính",
    Final: "Vòng Chung Kết",
  };

  useEffect(() => {
    getCategoryDetail(categoryId);
    fetchVariety();
    fetchAccountTeam(1, 100);
    fetchCriteria(1, 100);
  }, [categoryId]);

  useEffect(() => {
    if (currentCategory) {
      // console.log("Current category:", currentCategory);

      // Transform data for form
      const formData = {
        name: currentCategory.name,
        sizeMin: currentCategory.sizeMin,
        sizeMax: currentCategory.sizeMax,
        description: currentCategory.description,
        maxEntries: currentCategory.maxEntries,
        registrationFee: currentCategory.registrationFee,
        status: currentCategory.status,
        categoryVarieties:
          currentCategory.categoryVarieties?.map((v) => v.variety.id) || [],
        awards: currentCategory.awards || [],
        criteriaCompetitionCategories:
          currentCategory.criteriaCompetitionCategories || [],
        refereeAssignments: currentCategory.refereeAssignments || [],
        rounds: currentCategory.rounds || [],
      };

      // console.log("Setting form data:", formData);
      // console.log("Criteria data:", formData.criteriaCompetitionCategories);
      form.setFieldsValue(formData);
    }
  }, [currentCategory, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      console.log("Form values:", values);

      // Trong hàm handleSubmit, thêm dòng này trước khi tạo updatePayload
      // console.log("Form values before submit:", form.getFieldsValue());
      // console.log(
      //   "Criteria data:",
      //   form.getFieldValue("criteriaCompetitionCategories")
      // );

      // Prepare update payload
      const updatePayload = {
        name: values.name,
        koiShowId: showId || currentCategory.showId,
        sizeMin: parseFloat(values.sizeMin),
        sizeMax: parseFloat(values.sizeMax),
        description: values.description,
        maxEntries: parseInt(values.maxEntries),
        registrationFee: parseFloat(values.registrationFee || 0),
        status: values.status,

        // Map varieties to the expected format
        createCompetionCategoryVarieties: values.categoryVarieties || [],

        // Map awards to the expected format
        createAwardCateShowRequests: (values.awards || []).map((award) => ({
          name: award.name,
          awardType: award.awardType || "default",
          prizeValue: parseFloat(award.prizeValue) || 0,
          description: award.description || "",
        })),

        // Trong hàm handleSubmit, thêm dòng này vào đối tượng updatePayload:
        createCriteriaCompetitionCategoryRequests: (
          form.getFieldValue("criteriaCompetitionCategories") || []
        ).map((criteria) => ({
          criteriaId: criteria.criteriaId || criteria.criteria?.id,
          roundType: criteria.roundType,
          weight: parseFloat(criteria.weight) || 0,
          order: parseInt(criteria.order) || 0,
        })),

        createRefereeAssignmentRequests: processRefereeAssignments(
          values.refereeAssignments || []
        ),
        createRoundRequests: (values.rounds || []).map((round) => ({
          id: round.id,
          name: round.name,
          roundOrder: parseInt(round.roundOrder) || 0,
          roundType: round.roundType,
          startTime: null,
          endTime: null,
          numberOfRegistrationToAdvance:
            parseInt(round.numberOfRegistrationToAdvance) || 100,
          status: round.status || "pending",
        })),
      };

      // Thêm vào cuối hàm handleSubmit trước khi gọi updateCategory
      console.log("Final update payload:", updatePayload);
      console.log(
        "Criteria in payload:",
        updatePayload.createCriteriaCompetitionCategoryRequests
      );
      await updateCategory(categoryId, updatePayload);
      onClose();
      if (onCategoryUpdated) onCategoryUpdated();
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const processRefereeAssignments = (assignments = []) => {
    if (!assignments || assignments.length === 0) return [];

    const refereeMap = {};

    // Group assignments by referee
    assignments.forEach((assignment) => {
      const refereeId =
        assignment.refereeAccount?.id || assignment.refereeAccountId;
      if (!refereeId) return; // Skip if no refereeId

      if (!refereeMap[refereeId]) {
        refereeMap[refereeId] = {
          refereeAccountId: refereeId,
          roundTypes: [],
        };
      }

      // Add roundType if it exists and is not already in the array
      if (
        assignment.roundType &&
        !refereeMap[refereeId].roundTypes.includes(assignment.roundType)
      ) {
        refereeMap[refereeId].roundTypes.push(assignment.roundType);
      }
    });

    return Object.values(refereeMap);
  };

  // Handle adding a new award
  const handleAddAward = () => {
    const currentAwards = form.getFieldValue("awards") || [];
    form.setFieldsValue({
      awards: [
        ...currentAwards,
        { name: "", awardType: "", prizeValue: "", description: "" },
      ],
    });
    setEditingAwardIndex(currentAwards.length);
  };

  // Handle removing an award
  const handleRemoveAward = (index) => {
    const currentAwards = form.getFieldValue("awards") || [];
    form.setFieldsValue({
      awards: currentAwards.filter((_, i) => i !== index),
    });
    setEditingAwardIndex(null);
  };

  // Handle editing an award
  const handleEditAward = (index) => {
    setEditingAwardIndex(index);
  };

  // Handle saving award changes
  const handleSaveAward = () => {
    setEditingAwardIndex(null);
  };

  // Handle criteria selection
  const handleCriteriaSelection = (values) => {
    const selectedCriteriaDetails = values.map((id) => {
      const criteriaInfo = criteria.find((c) => c.id === id);
      return {
        criteriaId: id,
        weight: 0,
        order: 0,
      };
    });
    setTempSelectedCriteria(selectedCriteriaDetails);
  };

  const handleAddCriteriaToRound = (roundType) => {
    if (!tempSelectedCriteria || tempSelectedCriteria.length === 0) {
      message.warning("Vui lòng chọn tiêu chí trước");
      return;
    }

    const currentCriteria =
      form.getFieldValue("criteriaCompetitionCategories") || [];
    const existingCriteriaInRound = currentCriteria.filter(
      (c) => c.roundType === roundType
    );

    // Tạo các tiêu chí mới với cấu trúc tương tự như dữ liệu từ API
    const newCriteria = tempSelectedCriteria.map((criteriaItem, index) => {
      // Tìm thông tin chi tiết của tiêu chí
      const criteriaInfo = criteria.find(
        (c) => c.id === criteriaItem.criteriaId
      );

      return {
        criteriaId: criteriaItem.criteriaId,
        criteria: {
          id: criteriaItem.criteriaId,
          name: criteriaInfo?.name || "Tiêu chí không xác định",
        },
        roundType: roundType,
        // Đảm bảo weight đã là decimal (0-1)
        weight: criteriaItem.weight || 0,
        order: existingCriteriaInRound.length + index + 1,
      };
    });

    console.log("New criteria to add:", newCriteria);

    // Cập nhật form với các tiêu chí mới
    const updatedCriteria = [...currentCriteria, ...newCriteria];
    // Trong hàm handleAddCriteriaToRound, kiểm tra lại dòng này
    form.setFieldsValue({
      criteriaCompetitionCategories: updatedCriteria,
    });

    // Log để debug
    console.log("Updated criteria after adding new ones:", updatedCriteria);

    // Cập nhật lại state để UI hiển thị đúng
    setTempSelectedCriteria([]);
    setSelectedRoundForCriteria(null);
  };

  // Handle removing criteria
  const handleRemoveCriteria = (criteriaId, roundType) => {
    const currentCriteria =
      form.getFieldValue("criteriaCompetitionCategories") || [];
    form.setFieldsValue({
      criteriaCompetitionCategories: currentCriteria.filter(
        (c) => !(c.criteriaId === criteriaId && c.roundType === roundType)
      ),
    });
  };
  const handleWeightChange = (criteriaId, roundType, value) => {
    // Chuyển từ phần trăm sang decimal (0-1)
    const weightValue = (parseFloat(value) || 0) / 100;

    const currentCriteria =
      form.getFieldValue("criteriaCompetitionCategories") || [];

    const updatedCriteria = currentCriteria.map((criteria) => {
      if (
        (criteria.criteriaId === criteriaId ||
          criteria.criteria?.id === criteriaId) &&
        criteria.roundType === roundType
      ) {
        // Lưu trọng số dưới dạng decimal
        return { ...criteria, weight: weightValue };
      }
      return criteria;
    });

    form.setFieldsValue({
      criteriaCompetitionCategories: updatedCriteria,
    });

    // Log để debug
    console.log("Updated criteria after weight change:", updatedCriteria);
  };
  // Handle referee selection
  const handleRefereeChange = (selectedReferees) => {
    const currentAssignments = form.getFieldValue("refereeAssignments") || [];

    // Keep existing assignments for selected referees
    const existingAssignments = currentAssignments.filter((a) =>
      selectedReferees.includes(a.refereeAccount?.id || a.refereeAccountId)
    );

    // Add new referees without assignments
    const existingRefereeIds = existingAssignments.map(
      (a) => a.refereeAccount?.id || a.refereeAccountId
    );

    const newAssignments = selectedReferees
      .filter((id) => !existingRefereeIds.includes(id))
      .map((id) => ({
        refereeAccountId: id,
        refereeAccount: referee.find((r) => r.id === id),
        roundType: null,
      }));

    form.setFieldsValue({
      refereeAssignments: [...existingAssignments, ...newAssignments],
    });
  };

  // Handle referee round assignment
  const handleRefereeRoundChange = (refereeId, selectedRounds) => {
    const currentAssignments = form.getFieldValue("refereeAssignments") || [];

    // Remove existing assignments for this referee
    const otherAssignments = currentAssignments.filter(
      (a) => (a.refereeAccount?.id || a.refereeAccountId) !== refereeId
    );

    // Create new assignments for each selected round
    const newAssignments = selectedRounds.map((round) => ({
      refereeAccountId: refereeId,
      refereeAccount: referee.find((r) => r.id === refereeId),
      roundType: round,
    }));

    form.setFieldsValue({
      refereeAssignments: [...otherAssignments, ...newAssignments],
    });
  };

  // Get referee's assigned rounds
  const getRefereeRounds = (refereeId) => {
    const assignments = form.getFieldValue("refereeAssignments") || [];
    return assignments
      .filter((a) => (a.refereeAccount?.id || a.refereeAccountId) === refereeId)
      .map((a) => a.roundType);
  };

  // Thêm vòng thi mới
  const handleAddSubRound = (mainRound) => {
    const currentRounds = form.getFieldValue("rounds") || [];

    // Tìm số thứ tự lớn nhất trong các vòng cùng loại
    const roundsOfType = currentRounds.filter(
      (round) => round && round.roundType === mainRound
    );
    const maxOrder = roundsOfType.reduce(
      (max, round) => Math.max(max, round.roundOrder || 0),
      0
    );

    const newRound = {
      name: `Vòng Nhỏ ${maxOrder + 1} - ${roundLabelMap[mainRound]}`,
      roundOrder: maxOrder + 1,
      roundType: mainRound,
      numberOfRegistrationToAdvance: 10,
      status: "pending",
    };

    form.setFieldsValue({
      rounds: [...currentRounds, newRound],
    });
  };

  // Xóa vòng thi
  const handleRemoveRound = (fieldName) => {
    const currentRounds = form.getFieldValue("rounds");
    const newRounds = currentRounds.filter((_, index) => index !== fieldName);
    form.setFieldsValue({ rounds: newRounds });
  };
  return (
    <Modal
      open={true}
      title="Chỉnh sửa Danh Mục"
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="back" onClick={onClose}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          icon={<SaveOutlined />}
        >
          Lưu
        </Button>,
      ]}
    >
      {isLoading || isLoadingVariety ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : (
        <Form form={form} layout="vertical">
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <Tabs.TabPane tab="Thông tin cơ bản" key="1">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="name"
                    label="Tên hạng mục"
                    rules={[
                      { required: true, message: "Vui lòng nhập tên hạng mục" },
                    ]}
                  >
                    <Input placeholder="Nhập tên danh mục" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="status" label="Trạng thái">
                    <Select>
                      <Option value="pending">Chờ duyệt</Option>
                      <Option value="approved">Đã duyệt</Option>
                      <Option value="upcoming">Sắp diễn ra</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="sizeMin"
                    label="Kích thước tối thiểu"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập kích thước tối thiểu",
                      },
                    ]}
                  >
                    <Input
                      type="number"
                      placeholder="Nhập kích thước tối thiểu"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="sizeMax"
                    label="Kích thước tối đa"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng nhập kích thước tối đa",
                      },
                    ]}
                  >
                    <Input type="number" placeholder="Nhập kích thước tối đa" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="maxEntries" label="Số lượng tham gia tối đa">
                    <Input type="number" placeholder="Nhập số lượng tối đa" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="registrationFee" label="Phí đăng ký">
                    <Input type="number" placeholder="Nhập phí đăng ký" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="categoryVarieties"
                    label="Giống cá Koi"
                    rules={[
                      {
                        required: true,
                        message: "Vui lòng chọn ít nhất một giống cá",
                      },
                    ]}
                  >
                    <Select mode="multiple">
                      {(variety || []).map((item) => (
                        <Option key={item.id} value={item.id}>
                          {item.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="description"
                    label="Mô tả"
                    rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
                  >
                    <TextArea placeholder="Nhập mô tả" rows={4} />
                  </Form.Item>
                </Col>
              </Row>
            </Tabs.TabPane>
            <Tabs.TabPane tab="Vòng Thi Đấu" key="2">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Các loại vòng thi
                </label>
                {mainRounds.map((round) => (
                  <div key={round.value} className="mb-4">
                    <div className="flex justify-between items-center p-2 border rounded-md">
                      <span className="font-semibold">{round.label}</span>
                      <span
                        className="cursor-pointer text-blue-500 hover:text-blue-700 flex items-center"
                        onClick={() => handleAddSubRound(round.value)}
                      >
                        <PlusOutlined className="mr-1" />
                      </span>
                    </div>

                    {/* Display sub-rounds */}
                    <Form.List name="rounds">
                      {(fields) => {
                        // Filter rounds by type
                        const roundsOfType = fields.filter(
                          (field) =>
                            form.getFieldValue([
                              "rounds",
                              field.name,
                              "roundType",
                            ]) === round.value
                        );

                        return (
                          <>
                            {roundsOfType.length > 0 ? (
                              <Collapse className="mt-2">
                                {roundsOfType.map((field) => (
                                  <Panel
                                    header={form.getFieldValue([
                                      "rounds",
                                      field.name,
                                      "name",
                                    ])}
                                    key={field.key}
                                    extra={
                                      <span
                                        className="text-red-500 cursor-pointer hover:text-red-700"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoveRound(field.name);
                                        }}
                                      >
                                        <DeleteOutlined />
                                      </span>
                                    }
                                  >
                                    <Space
                                      direction="vertical"
                                      style={{ width: "100%" }}
                                    >
                                      <div>
                                        <Form.Item
                                          name={[field.name, "name"]}
                                          label="Tên Vòng"
                                          rules={[
                                            {
                                              required: true,
                                              message: "Vui lòng nhập tên vòng",
                                            },
                                          ]}
                                        >
                                          <Input placeholder="Nhập tên vòng" />
                                        </Form.Item>
                                      </div>

                                      <div>
                                        <Form.Item
                                          name={[field.name, "roundOrder"]}
                                          label="Thứ tự vòng"
                                          rules={[
                                            {
                                              required: true,
                                              message:
                                                "Vui lòng nhập thứ tự vòng",
                                            },
                                          ]}
                                        >
                                          <InputNumber
                                            min={1}
                                            className="w-full"
                                          />
                                        </Form.Item>
                                      </div>

                                      <div>
                                        <Form.Item
                                          name={[
                                            field.name,
                                            "numberOfRegistrationToAdvance",
                                          ]}
                                          label="Số lượng cá qua vòng"
                                        >
                                          <InputNumber
                                            min={0}
                                            max={100}
                                            className="w-full"
                                          />
                                        </Form.Item>
                                      </div>

                                      <div>
                                        <Form.Item
                                          name={[field.name, "status"]}
                                          label="Trạng thái"
                                        >
                                          <Select>
                                            <Option value="pending">
                                              Chờ duyệt
                                            </Option>
                                            <Option value="active">
                                              Đang diễn ra
                                            </Option>
                                            <Option value="completed">
                                              Hoàn thành
                                            </Option>
                                          </Select>
                                        </Form.Item>
                                      </div>
                                    </Space>
                                  </Panel>
                                ))}
                              </Collapse>
                            ) : (
                              <div className="text-center text-gray-500 py-4 mt-2 border border-dashed rounded-md">
                                Không có vòng thi nào thuộc {round.label}.
                              </div>
                            )}
                          </>
                        );
                      }}
                    </Form.List>
                  </div>
                ))}
              </div>
            </Tabs.TabPane>
            <Tabs.TabPane tab="Giải thưởng" key="3">
              <div className="mb-4 flex justify-between">
                <h3 className="text-lg font-bold m-0">Danh sách giải thưởng</h3>

                <Tooltip title="Thêm giải thưởng">
                  <PlusOutlined onClick={handleAddAward} />{" "}
                </Tooltip>
              </div>

              <Form.List name="awards">
                {(fields) => (
                  <div>
                    {fields.map((field, index) => (
                      <Card
                        key={field.key}
                        title={
                          form.getFieldValue(["awards", field.name, "name"]) ||
                          `Giải thưởng ${index + 1}`
                        }
                        className="mb-3"
                        size="small"
                        extra={
                          <Space>
                            {editingAwardIndex === index ? (
                              <Tooltip title="Lưu">
                                <Button
                                  type="text"
                                  icon={
                                    <CheckOutlined
                                      style={{ color: "#52c41a" }}
                                    />
                                  }
                                  onClick={handleSaveAward}
                                />
                              </Tooltip>
                            ) : (
                              <Tooltip title="Chỉnh sửa">
                                <Button
                                  type="text"
                                  icon={
                                    <EditOutlined
                                      style={{ color: "#1890ff" }}
                                    />
                                  }
                                  onClick={() => handleEditAward(index)}
                                />
                              </Tooltip>
                            )}
                            <Tooltip title="Xóa">
                              <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleRemoveAward(index)}
                              />
                            </Tooltip>
                          </Space>
                        }
                      >
                        {editingAwardIndex === index ? (
                          <Row gutter={16}>
                            <Col span={12}>
                              <Form.Item
                                name={[field.name, "name"]}
                                label="Tên giải thưởng"
                                rules={[
                                  {
                                    required: true,
                                    message: "Vui lòng nhập tên giải thưởng",
                                  },
                                ]}
                              >
                                <Input placeholder="Nhập tên giải thưởng" />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                name={[field.name, "awardType"]}
                                label="Loại giải thưởng"
                                rules={[
                                  {
                                    required: true,
                                    message: "Vui lòng nhập loại giải thưởng",
                                  },
                                ]}
                              >
                                <Input placeholder="Nhập loại giải thưởng" />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item
                                name={[field.name, "prizeValue"]}
                                label="Giá trị giải thưởng"
                                rules={[
                                  {
                                    required: true,
                                    message:
                                      "Vui lòng nhập giá trị giải thưởng",
                                  },
                                ]}
                              >
                                <InputNumber
                                  placeholder="Nhập giá trị (VND)"
                                  formatter={(value) =>
                                    `${value}`.replace(
                                      /\B(?=(\d{3})+(?!\d))/g,
                                      ","
                                    )
                                  }
                                  parser={(value) =>
                                    value.replace(/\$\s?|(,*)/g, "")
                                  }
                                  className="w-full"
                                />
                              </Form.Item>
                            </Col>
                            <Col span={24}>
                              <Form.Item
                                name={[field.name, "description"]}
                                label="Mô tả giải thưởng"
                              >
                                <TextArea
                                  rows={2}
                                  placeholder="Nhập mô tả giải thưởng"
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                        ) : (
                          <Descriptions column={1} size="small">
                            <Descriptions.Item label="Tên giải thưởng">
                              {form.getFieldValue([
                                "awards",
                                field.name,
                                "name",
                              ])}
                            </Descriptions.Item>
                            <Descriptions.Item label="Loại giải thưởng">
                              {form.getFieldValue([
                                "awards",
                                field.name,
                                "awardType",
                              ])}
                            </Descriptions.Item>
                            <Descriptions.Item label="Giá trị">
                              {form
                                .getFieldValue([
                                  "awards",
                                  field.name,
                                  "prizeValue",
                                ])
                                .toLocaleString()}
                              VND
                            </Descriptions.Item>
                            <Descriptions.Item label="Mô tả">
                              {form.getFieldValue([
                                "awards",
                                field.name,
                                "description",
                              ])}
                            </Descriptions.Item>
                          </Descriptions>
                        )}
                      </Card>
                    ))}

                    {fields.length === 0 && (
                      <div className="text-center text-gray-500 py-4">
                        Chưa có giải thưởng nào. Vui lòng thêm giải thưởng.
                      </div>
                    )}
                  </div>
                )}
              </Form.List>
            </Tabs.TabPane>
            <Tabs.TabPane tab="Tiêu chí đánh giá" key="4">
              <div className="mb-4 flex justify-between">
                <h3 className="text-lg font-bold m-0">Danh Sách Tiêu Chí</h3>
                {!editingCriteria ? (
                  <Tooltip title="Chỉnh sửa tiêu chí">
                    <Button
                      type="text"
                      icon={<EditOutlined style={{ color: "#1890ff" }} />}
                      onClick={() => setEditingCriteria(true)}
                    />
                  </Tooltip>
                ) : (
                  <Button
                    icon={<CheckOutlined />}
                    onClick={() => setEditingCriteria(false)}
                  >
                    Hoàn tất
                  </Button>
                )}
              </div>

              {/* Danh sách tiêu chí */}
              <Tabs tabPosition="left">
                {mainRounds.map((round) => {
                  const criteriaInRound = (
                    form.getFieldValue("criteriaCompetitionCategories") || []
                  )
                    .filter((c) => c.roundType === round.value)
                    .sort((a, b) => a.order - b.order);

                  return (
                    <Tabs.TabPane tab={round.label} key={round.value}>
                      {criteriaInRound.length > 0 ? (
                        // Trong phần hiển thị danh sách tiêu chí
                        <List
                          dataSource={criteriaInRound}
                          renderItem={(item) => (
                            <List.Item
                              key={item.criteriaId || item.criteria?.id}
                              actions={[
                                // Thay đổi InputNumber thành Input thông thường
                                <InputNumber
                                  min={0}
                                  max={100}
                                  formatter={(value) => `${value}%`}
                                  parser={(value) => value.replace("%", "")}
                                  value={(item.weight * 100).toFixed(0)}
                                  onChange={(value) =>
                                    handleWeightChange(
                                      item.criteriaId || item.criteria?.id,
                                      item.roundType,
                                      value
                                    )
                                  }
                                />,
                                <Tooltip title="Xóa tiêu chí">
                                  <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() =>
                                      handleRemoveCriteria(
                                        item.criteriaId || item.criteria?.id,
                                        item.roundType
                                      )
                                    }
                                    size="small"
                                  />
                                </Tooltip>,
                              ]}
                            >
                              <List.Item.Meta
                                title={`${item.order}. ${
                                  item.criteria?.name ||
                                  "Tiêu chí không xác định"
                                }`}
                              />
                            </List.Item>
                          )}
                        />
                      ) : (
                        <div className="text-center text-gray-500 rounded-md">
                          Chưa có tiêu chí nào cho {round.label}
                        </div>
                      )}
                    </Tabs.TabPane>
                  );
                })}
              </Tabs>

              {/* Chọn tiêu chí - Moved Below */}
              {editingCriteria && (
                <div className="mt-4 border-t pt-4">
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Chọn tiêu chí
                    </label>
                    <Select
                      mode="multiple"
                      placeholder="Chọn tiêu chí"
                      className="w-full mb-2"
                      onChange={handleCriteriaSelection}
                      loading={isLoadingCriteria}
                    >
                      {criteria.map((item) => (
                        <Option key={item.id} value={item.id}>
                          {item.name}
                        </Option>
                      ))}
                    </Select>
                  </div>

                  {tempSelectedCriteria.length > 0 && (
                    <>
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Thiết lập trọng số cho tiêu chí
                        </label>
                        <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2">
                          {tempSelectedCriteria.map((criteriaItem, index) => {
                            // Tìm thông tin chi tiết của tiêu chí từ danh sách criteria
                            const criteriaInfo = criteria.find(
                              (c) => c.id === criteriaItem.criteriaId
                            );
                            return (
                              <div
                                key={index}
                                className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
                              >
                                <span className="flex-1">
                                  {criteriaInfo?.name ||
                                    criteriaItem.criteriaName ||
                                    criteriaItem.criteriaId}
                                </span>
                                <InputNumber
                                  min={0}
                                  max={100}
                                  formatter={(value) => `${value}%`}
                                  parser={(value) => value.replace("%", "")}
                                  value={(criteriaItem.weight * 100).toFixed(0)}
                                  onChange={(value) => {
                                    const updatedCriteria = [
                                      ...tempSelectedCriteria,
                                    ];
                                    updatedCriteria[index].weight =
                                      Number(value) / 100;
                                    setTempSelectedCriteria(updatedCriteria);
                                  }}
                                  className="w-24"
                                />
                                <Button
                                  type="text"
                                  danger
                                  icon={<DeleteOutlined />}
                                  onClick={() => {
                                    const updatedCriteria = [
                                      ...tempSelectedCriteria,
                                    ];
                                    updatedCriteria.splice(index, 1);
                                    setTempSelectedCriteria(updatedCriteria);
                                  }}
                                  size="small"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Chọn vòng chính để gán tiêu chí
                        </label>
                        <div className="flex space-x-2">
                          <Select
                            className="flex-1"
                            placeholder="Chọn vòng chính"
                            onChange={setSelectedRoundForCriteria}
                            value={selectedRoundForCriteria}
                          >
                            {mainRounds.map((round) => (
                              <Option key={round.value} value={round.value}>
                                {round.label}
                              </Option>
                            ))}
                          </Select>

                          {selectedRoundForCriteria && (
                            <Button
                              type="primary"
                              icon={<PlusOutlined />}
                              onClick={() =>
                                handleAddCriteriaToRound(
                                  selectedRoundForCriteria
                                )
                              }
                            >
                              Thêm
                            </Button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </Tabs.TabPane>
            <Tabs.TabPane tab="Trọng tài" key="5">
              <div className="mb-4 flex justify-between">
                <h3 className="text-lg font-bold m-0">Danh Sách Trọng Tài</h3>
                {!editingReferees ? (
                  <Tooltip title="Chỉnh sửa trọng tài">
                    <Button
                      type="text"
                      icon={<EditOutlined style={{ color: "#1890ff" }} />}
                      onClick={() => setEditingReferees(true)}
                    />
                  </Tooltip>
                ) : (
                  <Button
                    icon={<CheckOutlined />}
                    onClick={() => setEditingReferees(false)}
                  >
                    Hoàn tất
                  </Button>
                )}
              </div>

              <Form.List name="refereeAssignments">
                {(fields) => {
                  // Group referees to avoid duplicates
                  const refereeIds = fields
                    .map(
                      (field) =>
                        form.getFieldValue([
                          "refereeAssignments",
                          field.name,
                          "refereeAccount",
                        ])?.id ||
                        form.getFieldValue([
                          "refereeAssignments",
                          field.name,
                          "refereeAccountId",
                        ])
                    )
                    .filter(Boolean) // Remove null/undefined
                    .filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates

                  return (
                    <div>
                      {/* Chọn trọng tài - chỉ hiển thị khi đang chỉnh sửa */}
                      {editingReferees && (
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Chọn trọng tài
                          </label>
                          <Select
                            mode="multiple"
                            placeholder="Chọn trọng tài"
                            className="w-full mb-2"
                            value={refereeIds}
                            onChange={handleRefereeChange}
                          >
                            {referee.map((r) => (
                              <Option key={r.id} value={r.id}>
                                {r.fullName}
                              </Option>
                            ))}
                          </Select>
                        </div>
                      )}

                      {/* Hiển thị danh sách trọng tài */}
                      <Collapse className="mb-4">
                        {refereeIds.map((refereeId) => {
                          const refereeInfo = referee.find(
                            (r) => r.id === refereeId
                          );
                          const assignedRounds =
                            getRefereeRounds(refereeId).filter(Boolean);

                          return (
                            <Collapse.Panel
                              key={refereeId}
                              header={`Trọng tài: ${
                                refereeInfo?.fullName || "Không xác định"
                              }`}
                              extra={
                                editingReferees && (
                                  <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRefereeChange(
                                        refereeIds.filter(
                                          (id) => id !== refereeId
                                        )
                                      );
                                    }}
                                    size="small"
                                  />
                                )
                              }
                            >
                              {editingReferees ? (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Chọn vòng chấm điểm cho trọng tài này
                                  </label>
                                  <Select
                                    mode="multiple"
                                    className="w-full"
                                    value={assignedRounds}
                                    onChange={(value) =>
                                      handleRefereeRoundChange(refereeId, value)
                                    }
                                    placeholder="Chọn vòng chấm điểm"
                                  >
                                    {mainRounds.map((round) => (
                                      <Option
                                        key={round.value}
                                        value={round.value}
                                      >
                                        {round.label}
                                      </Option>
                                    ))}
                                  </Select>
                                </div>
                              ) : (
                                <div>
                                  <p className="text-sm">
                                    <strong>Email:</strong> {refereeInfo?.email}
                                  </p>
                                  <div className="mt-2 flex">
                                    <p className="text-sm mb-1">
                                      <strong>Vòng chấm điểm:</strong>
                                    </p>
                                    <div className="flex">
                                      {assignedRounds.length > 0 ? (
                                        assignedRounds.map((round) => (
                                          <Tag
                                            key={round}
                                            color={
                                              round === "Preliminary"
                                                ? "orange"
                                                : round === "Evaluation"
                                                  ? "blue"
                                                  : round === "Final"
                                                    ? "green"
                                                    : "default"
                                            }
                                            className="mr-1 mb-1"
                                          >
                                            {roundLabelMap[round] || round}
                                          </Tag>
                                        ))
                                      ) : (
                                        <span className="text-gray-500 text-sm">
                                          Chưa được phân công vòng nào
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Collapse.Panel>
                          );
                        })}

                        {refereeIds.length === 0 && (
                          <div className="text-center text-gray-500 py-4 border border-dashed rounded-md">
                            Chưa có trọng tài nào được chọn
                          </div>
                        )}
                      </Collapse>
                    </div>
                  );
                }}
              </Form.List>
            </Tabs.TabPane>
          </Tabs>
        </Form>
      )}
    </Modal>
  );
}

export default EditCategory;
