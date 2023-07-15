import { Container, Box, Button, Chip } from "@mui/material";
import React, { useEffect, useState } from "react";
import { dvote_backend } from "../../declarations/dvote_backend";
import { UserVoteRecord } from "../../declarations/dvote_backend/dvote_backend.did";
import { getErrorMessage } from "./utils";
import StyledLink from "./components/StyledLink";
import { MineListType } from "./interface";
import ListCard from "./components/ListCard";
const Mine = () => {
  const [mineVotes, setMineVotes] = useState<UserVoteRecord>();
  const [items, setItems] = useState<Array<{ hash: string; title: string }>>();
  const [selectedTab, setSelectedTab] = useState<MineListType>(
    MineListType.Owned
  );
  useEffect(() => {
    (async () => {
      const votes = await dvote_backend.getMyVote();
      console.log(votes, "getMyVote");
      if ("Err" in votes) {
        // alert(getErrorMessage(votes.Err));
        return;
      }
      setMineVotes(votes.Ok);
    })();
  }, []);
  useEffect(() => {
    const list = mineVotes?.[selectedTab].map(([hash, item]) => {
      return { hash, title: item.title };
    });
    list && setItems(list);
  }, [selectedTab, mineVotes]);
  return (
    <Box sx={{ my: 2 }}>
      <Box my={2} display={"flex"} justifyContent={"space-evenly"}>
        <Chip
          variant={selectedTab === MineListType.Owned ? "filled" : "outlined"}
          clickable
          tabIndex={0}
          color="info"
          label="My owned"
          onClick={() => setSelectedTab(MineListType.Owned)}
        />
        <Chip
          variant={
            selectedTab === MineListType.Participated ? "filled" : "outlined"
          }
          tabIndex={1}
          onClick={() => setSelectedTab(MineListType.Participated)}
          clickable
          color="info"
          label="My participated"
        />
      </Box>
      {items && <ListCard items={items}></ListCard>}
    </Box>
  );
};
export default Mine;
