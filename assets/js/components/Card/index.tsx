import React from "react";

export default function Card({ children }) {
  return (
    <div className="py-4 px-4 border border-gray-700 rounded hover:cursor-pointer">
      {children}
    </div>
  );
}
