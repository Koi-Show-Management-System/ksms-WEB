import React from "react";
import { Helmet } from "react-helmet-async";
import KoiShowDetail from "../../section/manager/koishow/KoiShowDetail";
function KoiShowDetailPage() {
  return (
    <>
      <Helmet>
        <title> KSMS | Chi Tiết Shoư </title>
      </Helmet>
      <KoiShowDetail />
    </>
  );
}

export default KoiShowDetailPage;
