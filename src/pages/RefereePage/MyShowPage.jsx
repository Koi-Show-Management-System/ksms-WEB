import React from "react";
import { Helmet } from "react-helmet";
import { MyShowView } from "../../section/referee/koishow/view";

function MyShowPage() {
  return (
    <>
      <Helmet>
        <title>KSMS | My Koi Show</title>
      </Helmet>
      <MyShowView />
    </>
  );
}

export default MyShowPage;
