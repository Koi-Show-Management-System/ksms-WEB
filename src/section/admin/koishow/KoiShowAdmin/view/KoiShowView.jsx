import { Button } from "antd";
import React, { useEffect, useState } from "react";
import KoiShow from "../KoiShow";
import { Link } from "react-router-dom";
import { PlusOutlined } from "@ant-design/icons";
import Cookies from "js-cookie";

function KoiShowView() {
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const role = Cookies.get("__role");
    setUserRole(role);
  }, []);

  return (
    <div className="py-6 px-4 md:px-6 ">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Danh Sách Triển Lãm Koi
        </h2>
        {userRole === "Admin" && (
          <Link to="/admin/create-Show">
            <Button
              type="primary"
              className="bg-blue-500 hover:bg-blue-600 flex items-center"
              icon={<PlusOutlined />}
              size="large"
            >
              Tạo Triển Lãm
            </Button>
          </Link>
        )}
      </div>
      <KoiShow />
    </div>
  );
}

export default KoiShowView;
