import React from "react";
import { Link, useLocation } from "react-router-dom";

const LinkWithQuery = ({
  to,
  children,
  ...rest
}: {
  to: string;
  children: React.ReactNode;
  [x: string]: any;
}) => {
  const { search } = useLocation();

  return (
    <Link
      to={`${to}${search}`}
      {...rest}
      reloadDocument
      style={{
        color: "inherit",
        textDecoration: "inherit",
      }}
    >
      {children}
    </Link>
  );
};
export default LinkWithQuery;
