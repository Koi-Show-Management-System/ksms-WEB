import React from "react";
import { Helmet } from "react-helmet";
import KoiShowDetail from "../../section/admin/koishow/KoiShowAdmin/KoiShowDetail";
function KoiShowDetailPage() {
  return (
    <>
      <Helmet>
        <title> KSMS | KoiShow Detail </title>
      </Helmet>
      <KoiShowDetail/>
    </>
  );
}

export default KoiShowDetailPage;
