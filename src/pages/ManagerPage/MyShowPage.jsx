import React from "react";
import { Helmet } from "react-helmet-async";
import { MyShowView } from "../../section/manager/koishow/view";

function MyShowPage() {
  return (
    <>
      <Helmet>
        <title> KSMS | MyShow</title>
      </Helmet>
      <MyShowView />
    </>
  );
}

export default MyShowPage;
