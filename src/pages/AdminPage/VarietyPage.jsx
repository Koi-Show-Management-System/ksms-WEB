import React from "react";
import { Helmet } from "react-helmet-async";
import { VarietyView } from "../../section/admin/variety/view";

function VarietyPage() {
  return (
    <>
      <Helmet>
        <title>KSMS | Giống Koi</title>
      </Helmet>
      <VarietyView />
    </>
  );
}

export default VarietyPage;
