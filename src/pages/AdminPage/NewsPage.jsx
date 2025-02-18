import React from "react";
import { Helmet } from "react-helmet";
import NewsView from "../../section/admin/new/view/NewsView";

function NewsPage() {
  return (
    <>
      <Helmet>
        <title>KSMS | News</title>
      </Helmet>
      <NewsView />
    </>
  );
}

export default NewsPage;
