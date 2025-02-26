import React from "react";
import CreateShow from "../CreateShow";

function CreateShowView() {
  return (
    <div className="bg-gray-50 py-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mt-5  sm:mx-5  ">
        <h2 className="text-3xl font-semibold text-center sm:text-2xl md:text-3xl">
          Tạo Mới Triển Lãm Koi
        </h2>
      </div>
      <CreateShow />
    </div>
  );
}

export default CreateShowView;
