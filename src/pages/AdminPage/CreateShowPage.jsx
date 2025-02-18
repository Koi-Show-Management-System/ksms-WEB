import React from "react";
import { Helmet } from "react-helmet";
import CreateShowView from "../../section/admin/koishow/CreateShowKoi/view/CreateShowView";

function CreateShowPage() {
  return (
    <>
      <Helmet>
        <title>KSMS | Create Show</title>
      </Helmet>
      <CreateShowView />
    </>
  );
}

export default CreateShowPage;
