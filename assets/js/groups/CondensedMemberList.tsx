import React from "react";

export default ({members, total}) => {
  return (
    <>
      <p>Hello &mdash; {total !== null ? total : ""}</p>
    </>
  );
}
