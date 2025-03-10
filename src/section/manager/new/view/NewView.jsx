import React from "react";
import New from "../New";

function NewView() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 mt-5">
        <h2 className="text-3xl font-semibold">Tin Tức</h2>
      </div>
      <New />
    </div>
  );
}

export default NewView;
