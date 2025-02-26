import React, { useState } from "react";
import { Input, Button, List, Checkbox, message } from "antd";
import {
  DeleteOutlined,
  CheckCircleOutlined,
  EditOutlined,
} from "@ant-design/icons";

// Dữ liệu quy định
const initialRules = [
  { text: "Phí tham gia là $5 / con cá Koi. Chúng tôi cũng chào đón", completed: false },
  { text: "Đội ngũ của chúng tôi sẽ tải lên thông tin của bạn với phí $", completed: false },
  {
    text: "Cuộc thi Koi này mở cho tất cả những người yêu thích cá Koi, bao gồm cả những người chơi và người bán.",
    completed: false,
  },
  {
    text: "Người tham gia phải đến từ Mỹ (Bắc, Trung và Nam Mỹ) để giành giải thưởng.",
    completed: false,
  },
  {
    text: "Tất cả các cá Koi phải được đăng ký dưới tên cá nhân, không phải dưới tên công ty.",
    completed: false,
  },
  {
    text: "Tất cả các cá Koi phải thuộc sở hữu của người tham gia vào thời điểm đăng ký.",
    completed: false,
  },
  {
    text: "Tất cả các hình ảnh và thông tin gửi phải là của người tham gia.",
    completed: false,
  },
  {
    text: "Hình ảnh và video chỉ được hiển thị cá Koi, không có gì khác.",
    completed: false,
  },
];

const Rules = () => {
  const [rules, setRules] = useState(initialRules);
  const [newRule, setNewRule] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingText, setEditingText] = useState("");

  // Thêm quy tắc mới
  const addRule = () => {
    if (newRule) {
      setRules([...rules, { text: newRule, completed: false }]);
      setNewRule("");
    }
  };

  // Thay đổi trạng thái hoàn thành của quy tắc
  const toggleCompletion = (index) => {
    const updatedRules = [...rules];
    updatedRules[index].completed = !updatedRules[index].completed;
    setRules(updatedRules);
  };

  // Xóa quy tắc
  const deleteRule = (index) => {
    const updatedRules = rules.filter((_, idx) => idx !== index);
    setRules(updatedRules);
  };

  // Chỉnh sửa quy tắc
  const handleInlineEdit = (e, index) => {
    const updatedRules = [...rules];
    updatedRules[index].text = e.target.value;
    setRules(updatedRules);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-6 text-center">Quy Định & Quy Tắc</h1>

      {/* Input field to add new rule */}
      <div className="flex mb-6">
        <Input
          value={newRule}
          onChange={(e) => setNewRule(e.target.value)}
          placeholder="Nhập quy tắc mới ..."
          className="mr-2"
        />
        <Button type="primary" onClick={addRule}>
          Thêm Quy Tắc
        </Button>
      </div>

      {/* List of rules */}
      <List
        bordered
        dataSource={rules}
        renderItem={(rule, index) => (
          <List.Item
            actions={[
              <DeleteOutlined
                type="danger"
                onClick={() => deleteRule(index)}
              />,
              <EditOutlined onClick={() => setEditingIndex(index)} />,
            ]}
          >
            <div className="flex items-center justify-between w-full">
              <Checkbox
                checked={rule.completed}
                onChange={() => toggleCompletion(index)}
                icon={<CheckCircleOutlined />}
              />
              <span className="flex-grow ml-4">
                {editingIndex === index ? (
                  <Input
                    value={rule.text}
                    onChange={(e) => handleInlineEdit(e, index)}
                    onBlur={() => setEditingIndex(null)} // End editing on blur
                    autoFocus
                  />
                ) : (
                  <span
                    className={`${
                      rule.completed ? "line-through text-gray-500" : ""
                    }`}
                  >
                    {rule.text}
                  </span>
                )}
              </span>
            </div>
          </List.Item>
        )}
      />
    </div>
  );
};

export default Rules;
