import React from "react";
import CriteriaView from "../../section/admin/criteria/view/CriteriaView";
import { Helmet } from "react-helmet-async";

function CriteriaPage() {
  return (
    <>
      <Helmet>
        <title>KSMS | Tiêu Chí</title>
      </Helmet>
      <CriteriaView />
    </>
  );
}

export default CriteriaPage;
