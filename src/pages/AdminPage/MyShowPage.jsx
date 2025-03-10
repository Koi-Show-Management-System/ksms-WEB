import React from "react";
import { Helmet } from "react-helmet";
import { MyShowView } from "../../section/admin/koishow/KoiShowAdmin/view";

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
