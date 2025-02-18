import React from "react";
import KoiShowView from "../../section/manager/koishow/view/KoiShowView";
import { Helmet } from "react-helmet";
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
