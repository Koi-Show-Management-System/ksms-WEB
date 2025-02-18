import React from "react";
import News from "../News";

function NewsView() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 mt-5">
        <h2 className="text-3xl font-semibold">News</h2>
      </div>
      <News />
    </div>
  );
}

export default NewsView;
