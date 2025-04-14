import React from "react";
import { Helmet } from "react-helmet-async";
import KoiShowView from "../../section/staff/view/KoiShowView";
function KoiShowPage() {
  return (
    <>
      <Helmet>
        <title> KSMS | KoiShow </title>
      </Helmet>
      <KoiShowView />
    </>
  );
}

export default KoiShowPage;
