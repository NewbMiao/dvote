import { Container, Box } from "@mui/material";
import React, { ReactNode } from "react";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          my: 1,
        }}
      >
        {children}
      </Box>
    </Container>
  );
};
export default Layout;
