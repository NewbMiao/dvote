import { Container, Box, Button } from "@mui/material";
import React, { useEffect, useState } from "react";
import { dvote_backend } from "../../declarations/dvote_backend";
import {
  UserVoteRecord,
} from "../../declarations/dvote_backend/dvote_backend.did";
import { getErrorMessage } from "./utils";
import LinkWithQuery from "./LinkWithQuery";
const Mine = () => {
  const [mineVotes, setMineVotes] = useState<UserVoteRecord>();
  useEffect(() => {
    (async () => {
      const votes = await dvote_backend.getMyVote();
      console.log(votes, "getMyVote");
      if ("Err" in votes) {
        alert(getErrorMessage(votes.Err));
        return;
      }
      setMineVotes(votes.Ok);
    })();
  }, []);
  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        owned:
        {mineVotes?.owned.map((vote) => {
          return (
            <Box key={vote[0]}>
              <LinkWithQuery key={vote[0]} to={`/vote/${vote[0]}`}>
                <Button key={vote[0]}>{vote[1].title}</Button>
              </LinkWithQuery>
            </Box>
          );
        })}
      </Box>
      <Box sx={{ my: 4 }}>
        participated:
        {mineVotes?.participated.map((vote) => {
          return <Box key={vote[0]}>{vote[1].title}</Box>;
        })}
      </Box>
    </Container>
  );
};
export default Mine;
