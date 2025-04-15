import React from "react";
import NewsCategory from "../NewsCategory";
function NewsViewCategory() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 mt-5">
        <h2 className="text-3xl font-semibold">Chuyên mục</h2>
      </div>
      <NewsCategory />
    </div>
  );
}

export default NewsViewCategory;
