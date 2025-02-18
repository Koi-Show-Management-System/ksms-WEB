import React, { useState } from "react";
import { Input, Button, List, Checkbox, message } from "antd";
import {
  DeleteOutlined,
  CheckCircleOutlined,
  EditOutlined,
} from "@ant-design/icons";

// Dữ liệu giải thưởng
const initialRules = [
  { text: "Entry fee is $5 / Koi. We also welcome", completed: false },
  { text: "Our team will upload your entry for a $", completed: false },
  {
    text: "This Koi show is open to all Koi lovers including hobbyists and dealers.",
    completed: false,
  },
  {
    text: "The entrants must be from America (North, Central and South America) to win awards.",
    completed: false,
  },
  {
    text: "All the Koi must be entered by a personal name, not a",
    completed: false,
  },
  {
    text: "All the entered Koi must be owned by the entrant at the time of",
    completed: false,
  },
  {
    text: "All the submitted image and information must be owned",
    completed: false,
  },
  {
    text: "The images and videos should not show anything but Koi as",
    completed: false,
  },
];

const Rules = () => {
  const [rules, setRules] = useState(initialRules);
  const [newRule, setNewRule] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingText, setEditingText] = useState("");

  // Handle adding new rule
  const addRule = () => {
    if (newRule) {
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
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Rules & Regulations
      </h1>

      {/* Input field to add new rule */}
      <div className="flex mb-6">
        <Input
          value={newRule}
          onChange={(e) => setNewRule(e.target.value)}
          placeholder="Enter new rule ..."
          className="mr-2"
        />
        <Button type="primary" onClick={addRule}>
          Add Rule
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
