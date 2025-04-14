import React from "react";
import { Helmet } from "react-helmet-async";
import KoiShowDetail from "../../section/staff/KoiShowDetail";
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
