import React from "react";

const navigationShadow =
  "0px 0px 20px rgba(86, 128, 216, 0.04), 0px 0px 10.432px rgba(86, 128, 216, 0.028928), 0px 0px 4.896px rgba(86, 128, 216, 0.0325), 0px 0px 2.144px rgba(86, 128, 216, 0.0575), 0px 0px 0.928px rgba(86, 128, 216, 0.0311)";

interface NavigationProps {
  children: React.ReactNode;
}

export default function Navigation({ children }: NavigationProps): JSX.Element {
  // return (
  //   <div className="flex items-center">
  //     <div
  //       className="bg-white rounded-lg"
  //       style={{
  //         padding: "8px 40px 24px 40px",
  //         marginBottom: "-16px",
  //         boxShadow: navigationShadow,
  //       }}
  //     >
  //       {children}
  //     </div>
  //   </div>
  // );
}
