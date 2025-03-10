import React from "react";
import { Helmet } from "react-helmet";
import { NewView } from "../../section/manager/new/view";

function NewPage() {
  return (
    <>
      <Helmet>
        <title>KSMS | Tin Tức</title>
      </Helmet>
      <NewView />
    </>
  );
}

export default NewPage;
