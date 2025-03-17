import React from "react";
import { Helmet } from "react-helmet-async";
import CreateShowView from "../../section/admin/koishow/CreateShowKoi/view/CreateShowView";

function CreateShowPage() {
  return (
    <>
      <Helmet>
        <title>KSMS | Tạo Show</title>
      </Helmet>
      <CreateShowView />
    </>
  );
}

export default CreateShowPage;
