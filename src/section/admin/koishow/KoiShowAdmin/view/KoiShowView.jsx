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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 mt-5">
        <h2 className="text-3xl font-semibold">Danh Sách Triển Lãm Koi </h2>
        {userRole === "Admin" && (
          <Link to="/admin/create-Show">
            <Button
              type="primary"
              className="bg-blue-500"
              icon={<PlusOutlined />}
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
