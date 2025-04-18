import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  List,
  Typography,
  Divider,
  Pagination,
  Select,
} from "antd";
import useShowRule from "../../hooks/useShowRule";

const { Title, Paragraph } = Typography;

const Rules = ({ showId, showRule = [] }) => {
  const {
    rules,
    setRules,
    loading,
    isLoading,
    fetchShowRule,
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    setShowId,
  } = useShowRule();

  const [localRules, setLocalRules] = useState([]);

  useEffect(() => {
    if (showId) {
      setShowId(showId);
    }
  }, [showId, setShowId]);

  useEffect(() => {
    if (showId) {
      fetchShowRule(showId, 1, 10);
    }
  }, [showId]);

  useEffect(() => {
    if (showRule && showRule.length > 0) {
      const validRules = showRule.filter((rule) => rule.title && rule.content);
      setRules(validRules);
      setLocalRules(validRules);
    }
  }, [showRule, setRules]);

  useEffect(() => {
    if (rules && rules.length > 0) {
      const validRules = rules.filter((rule) => rule.title && rule.content);
      setLocalRules(validRules);
    } else {
      setLocalRules([]);
    }
  }, [rules]);

  const handlePageChange = (page, pageSize) => {
    fetchShowRule(showId, page, pageSize || pageSize);
  };

  return (
    <div className="relative p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <Title level={3} className="m-0 text-gray-700 font-medium">
          <span className=" ">Quy Tắc</span>
        </Title>
      </div>

      <List
        loading={isLoading || loading}
        itemLayout="vertical"
        dataSource={localRules}
        renderItem={(rule, index) => (
          <List.Item
            key={rule.id}
            className="bg-white rounded-xl shadow mb-3 overflow-hidden transform hover:translate-y-[-2px] transition-all duration-300"
          >
            <div className="relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-blue-500"></div>
              <div className="pl-4">
                <div className="flex items-center justify-between ">
                  <div className="flex items-center">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm mr-3 mb-2.5">
                      {(currentPage - 1) * pageSize + index + 1}
                    </div>
                    <Title level={4} className="m-0 text-gray-800 font-medium">
                      {rule.title}
                    </Title>
                  </div>
                </div>
                <Divider className="my-2 bg-gray-100" />
                <Paragraph className="text-gray-600 whitespace-pre-line leading-relaxed mb-0">
                  {rule.content}
                </Paragraph>
              </div>
            </div>
          </List.Item>
        )}
      />

      {/* Pagination */}
      {totalItems > 0 && (
        <div className="flex items-center justify-end mt-4 mb-2 px-3 py-2 bg-white rounded-lg shadow-sm">
          <span className="text-gray-600 text-sm">
            {(currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, totalItems)} trong {totalItems}
          </span>
          <div className="flex items-center mx-2">
            <button
              onClick={() =>
                currentPage > 1 && handlePageChange(currentPage - 1, pageSize)
              }
              className="px-2 text-blue-500"
              disabled={currentPage === 1}
            >
              &lt;
            </button>
            <div className="px-3 py-1 mx-1 border border-blue-500 rounded-md text-blue-500">
              {currentPage}
            </div>
            <button
              onClick={() =>
                currentPage < totalPages &&
                handlePageChange(currentPage + 1, pageSize)
              }
              className="px-2 text-blue-500"
              disabled={currentPage === totalPages}
            >
              &gt;
            </button>
          </div>
          <div className="flex items-center">
            <Select
              value={pageSize}
              onChange={(value) => handlePageChange(1, value)}
              options={[
                { value: 10, label: "10" },
                { value: 20, label: "20" },
                { value: 50, label: "50" },
              ]}
              size="small"
              popupMatchSelectWidth={false}
              className="w-16"
            />
            <span className="ml-1 text-gray-600 text-sm">/ page</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rules;
