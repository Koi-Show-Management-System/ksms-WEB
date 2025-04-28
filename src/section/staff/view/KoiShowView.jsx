import { Button } from "antd";
import React from "react";

import KoiShow from "../KoiShow";

function KoiShowView() {
  return (
    <div className="py-6 px-4 md:px-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Danh Sách Triển Lãm Koi
        </h2>
      </div>
      <KoiShow />
    </div>
  );
}

export default KoiShowView;
