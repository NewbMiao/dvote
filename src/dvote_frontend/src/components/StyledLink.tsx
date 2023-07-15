import React from "react";
import { Link } from "react-router-dom";

const StyledLink = ({
  to,
  children,
  ...rest
}: {
  to: string;
  children: React.ReactNode;
  [x: string]: any;
}) => {
  return (
    <Link
      reloadDocument
      to={`${to}`}
      {...rest}
      style={{
        color: "inherit",
        textDecoration: "inherit",
      }}
    >
      {children}
    </Link>
  );
};
export default StyledLink;
