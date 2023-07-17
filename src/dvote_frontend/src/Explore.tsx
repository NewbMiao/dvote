import { Box } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import ListCard from "./components/ListCard";
import { VoteRecord } from "../../declarations/dvote_backend/dvote_backend.did";
import Tips, { TipsProps } from "./components/Tips";
import { getErrorMessage } from "./utils";
import { AuthContext } from "./components/AuthProvider";
const Explore = () => {
  const [votes, setVotes] = useState<VoteRecord[]>();
  const [tips, setTips] = useState<TipsProps>();
  const { backendActor } = useContext(AuthContext);
  useEffect(() => {
    if(!backendActor) return;
    (async () => {
      const votes = await backendActor.getPublicVote();
      if ("Err" in votes) {
        setTips({ message: getErrorMessage(votes.Err) });
        return;
      }
      setVotes(votes.Ok);
      console.log(votes.Ok, "getPublicVote");
    })();
  }, [backendActor]);
  return (
    <Box>
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
