import React from "react";
import MyShow from "../MyShow";


function MyShowView() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 mt-5">
        <h2 className="text-3xl font-semibold">Triển lãm Cá Koi Của Tôi</h2>
      </div>
      <MyShow />
    </div>
  );
}

export default MyShowView;
