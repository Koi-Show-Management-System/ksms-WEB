import React from "react";
import { Helmet } from "react-helmet";
import { KoiShowView } from "../../section/referee/koishow/view";
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
