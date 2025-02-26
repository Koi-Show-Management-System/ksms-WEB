import React, { useState } from "react";
import { Form, Input, Button, List, Checkbox, message } from "antd";
import {
  DeleteOutlined,
  CheckCircleOutlined,
  EditOutlined,
} from "@ant-design/icons";

// Initial rules data
const initialRules = [
  { text: "Phí tham gia là $5 / Koi", completed: false },
  { text: "Tất cả Koi phải thuộc sở hữu của người tham gia", completed: false },
  { text: "Hình ảnh chỉ nên hiển thị Koi", completed: false },
];

function StepThree() {
  const [rules, setRules] = useState(initialRules);
  const [newRule, setNewRule] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);

  // Handle adding new rule
  const addRule = () => {
    if (newRule.trim()) {
      setRules([...rules, { text: newRule, completed: false }]);
      setNewRule("");
    }
  };

  // Handle toggling rule completion
  const toggleCompletion = (index) => {
    const updatedRules = [...rules];
    updatedRules[index].completed = !updatedRules[index].completed;
    setRules(updatedRules);
  };

  // Handle deleting rule
  const deleteRule = (index) => {
    const updatedRules = rules.filter((_, idx) => idx !== index);
    setRules(updatedRules);
  };

  // Handle inline editing of a rule
  const handleInlineEdit = (e, index) => {
    const updatedRules = [...rules];
    updatedRules[index].text = e.target.value;
    setRules(updatedRules);
  };

  return (
    <div className="bg-white rounded-lg p-4">
      <h2 className="text-2xl font-semibold mb-6">
        Bước 3: Quy Tắc & Quy Định
      </h2>

      {/* Input field to add new rule */}
      <div className="flex mb-6">
        <Input
          value={newRule}
          onChange={(e) => setNewRule(e.target.value)}
          placeholder="Nhập quy tắc mới..."
          className="mr-2"
          onPressEnter={addRule}
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
              <EditOutlined onClick={() => setEditingIndex(index)} />,
              <DeleteOutlined
                className="text-red-500"
                onClick={() => deleteRule(index)}
              />,
            ]}
          >
            <div className="flex items-center justify-between w-full">
              <Checkbox
                checked={rule.completed}
                onChange={() => toggleCompletion(index)}
                className="mr-4"
              />
              <span className="flex-grow">
                {editingIndex === index ? (
                  <Input
                    value={rule.text}
                    onChange={(e) => handleInlineEdit(e, index)}
                    onBlur={() => setEditingIndex(null)}
                    onPressEnter={() => setEditingIndex(null)}
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
}

export default StepThree;
