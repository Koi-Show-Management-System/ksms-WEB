import React from "react";
import { Helmet } from "react-helmet";
import KoiShowDetail from "../../section/referee/koishow/KoiShowDetail";
function KoiShowDetailPage() {
  return (
    <>
      <Helmet>
        <title> KSMS | Chi Tiết Show </title>
      </Helmet>
      <KoiShowDetail />
    </>
  );
}

export default KoiShowDetailPage;
