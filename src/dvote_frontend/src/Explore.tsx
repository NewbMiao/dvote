import { Container, Box } from "@mui/material";
import React, { useEffect } from "react";
import { dvote_backend } from "../../declarations/dvote_backend";
const Explore = () => {
  useEffect(() => {
    (async () => {
      const votes = await dvote_backend.getPublicVote();
      console.log(votes, "getPublicVote");
    })();
  }, []);
  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>explore list</Box>
    </Container>
  );
};
export default Explore;
