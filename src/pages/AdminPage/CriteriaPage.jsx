import React from "react";
import CriteriaView from "../../section/admin/criteria/view/CriteriaView";
import { Helmet } from "react-helmet";

function CriteriaPage() {
  return (
    <>
      <Helmet>
        <title>KSMS | Criteria Page</title>
      </Helmet>
      <CriteriaView />
    </>
  );
}

export default CriteriaPage;
