import { Box } from "@mui/material";
import React, { useEffect, useState } from "react";
import { dvote_backend } from "../../declarations/dvote_backend";
import ListCard from "./components/ListCard";
import { VoteRecord } from "../../declarations/dvote_backend/dvote_backend.did";
import Tips, { TipsProps } from "./components/Tips";
import { getErrorMessage } from "./utils";
const Explore = () => {
  const [votes, setVotes] = useState<VoteRecord[]>();
  const [tips, setTips] = useState<TipsProps>();
  useEffect(() => {
    (async () => {
      const votes = await dvote_backend.getPublicVote();
      if ("Err" in votes) {
        setTips({ message: getErrorMessage(votes.Err) });
        return;
      }
      setVotes(votes.Ok);
      console.log(votes.Ok, "getPublicVote");
    })();
  }, []);
  return (
    <Box sx={{ my: 2 }}>
      {votes && <ListCard items={votes}></ListCard>}
      {tips && (
        <Tips
          message={tips.message}
          severity={tips.severity}
          onClose={() => setTips(undefined)}
        />
      )}
    </Box>
  );
};
export default Explore;
