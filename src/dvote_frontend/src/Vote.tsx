import { Box, Typography, LinearProgress } from "@mui/material";
import React, { useEffect, useState } from "react";
import { dvote_backend } from "../../declarations/dvote_backend";
import {
  VoteItem,
  VoteRecord,
} from "../../declarations/dvote_backend/dvote_backend.did";
interface VoteItemWithPercent extends VoteItem {
  percent: number;
}
const Vote = () => {
  const [votes, setVotes] = useState<VoteItemWithPercent[]>();
  const [voteRecord, setVoteRecord] = useState<VoteRecord>();
  const title = "select a,b,c?";
  useEffect(() => {
    (async () => {
      const res = await dvote_backend.createVote(title, ["a", "b", "c"]);
      res && setVoteRecord(res);
      console.log(res, "createVote");
    })();
  }, []);
  const updateVoteWithPercent = (voteRecord: VoteRecord) => {
    // sum count of each item
    const sum = voteRecord.items.reduce((acc, item) => {
      return acc + Number(item.count);
    }, 0);

    const tmp: VoteItemWithPercent[] = voteRecord.items.map((item) => {
      return {
        ...item,
        percent:
          Number(item.count) === 0 ? 0 : (Number(item.count) / sum) * 100,
      };
    });
    setVotes(tmp);
  };
  useEffect(() => {
    if (!voteRecord?.hash) return;
    (async () => {
      const res = await dvote_backend.getVote(voteRecord.hash);
      console.log(res, "getVote");
      if (res[0]) {
        updateVoteWithPercent(res[0]);
      }
    })();
  }, [voteRecord?.hash]);

  const doVote = async (index: bigint) => {
    if (!voteRecord?.hash) {
      return;
    }
    const res = await dvote_backend.vote(voteRecord.hash, index);
    updateVoteWithPercent(res);
  };
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Typography>
        Vote {title}:
        {votes?.map((item) => {
          return (
            <Typography
              key={item.index.toString()}
              onClick={async () => {
                await doVote(item.index);
              }}
            >
              {item.name} : {item.percent.toFixed(2)}%({item.count.toString()})
              <LinearProgress
                sx={{ height: 15, width: 150 }}
                variant="determinate"
                value={item.percent}
              />
            </Typography>
          );
        })}
      </Typography>
    </Box>
  );
};
export default Vote;