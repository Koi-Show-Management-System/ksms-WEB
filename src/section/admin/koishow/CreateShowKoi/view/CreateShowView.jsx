import React from "react";
import CreateShow from "../CreateShow";

function CreateShowView() {
  return (
    <div className="bg-gray-50 rounded-md p-5">
      <div className="flex justify-between items-center  mt-5  mx-9">
        <h2 className="text-3xl font-semibold">Create New Koi Show</h2>
      </div>
      <CreateShow />
    </div>
  );
}

export default CreateShowView;
