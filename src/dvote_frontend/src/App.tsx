import { Container, Box } from "@mui/material";
import React from "react";
import Vote from "./Vote";

export default function App() {
  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Vote />
      </Box>
    </Container>
  );
}
