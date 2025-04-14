import React from "react";
import { Helmet } from "react-helmet-async";
import NewsViewCategory from "../../section/admin/new/view/NewsViewCategory";

function NewsCategoryPage() {
  return (
    <>
      <Helmet>
        <title>KSMS | Thông tin hạng mục</title>
      </Helmet>
      <NewsViewCategory />
    </>
  );
}

export default NewsCategoryPage;
