import React from "react";
import MyShow from "../MyShow";
import { Link } from "react-router-dom";
import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";

function MyShowView() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 mt-5">
        <h2 className="text-3xl font-semibold">Triển lãm Cá Koi Của Tôi</h2>
        <Link to="/admin/create-Show">
          <Button
            type="primary"
            className="bg-blue-500"
            icon={<PlusOutlined />}
          >
            Tạo Triển Lãm
          </Button>
        </Link>
      </div>
      <MyShow />
    </div>
  );
}

export default MyShowView;
