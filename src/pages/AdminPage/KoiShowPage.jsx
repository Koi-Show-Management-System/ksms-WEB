import React from "react";
import KoiShowView from "../../section/admin/koishow/KoiShowAdmin/view/KoiShowView";
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
