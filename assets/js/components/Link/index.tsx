import React from "react";

import * as Router from "react-router-dom";

export function Link({ to, children }) {
  return (
    <Router.Link to={to} className="text-blue-400 hover:text-blue-300 underline underline-offset-1">
      {children}
    </Router.Link>
  );
}
