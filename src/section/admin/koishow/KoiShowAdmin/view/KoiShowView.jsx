import { Button } from "antd";
import React from "react";
import KoiShow from "../KoiShow";
import { Link } from "react-router-dom";
import { PlusOutlined } from "@ant-design/icons";

function KoiShowView() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 mt-5">
        <h2 className="text-3xl font-semibold">Triển lãm Cá Koi của tôi</h2>
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
      <KoiShow />
    </div>
  );
}

export default KoiShowView;
