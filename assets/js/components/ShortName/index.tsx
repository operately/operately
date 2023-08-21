import React from "react";

export default function ShortName({ fullName }) {
  const parts = fullName.split(" ");

  if (parts.length > 1) {
    return (
      <span>
        {parts[0]} {parts[1][0]}.
      </span>
    );
  } else {
    return <span>{parts[0]}</span>;
  }
}
