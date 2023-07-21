import { Box, Chip } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import { UserVoteRecord } from "../../declarations/dvote_backend/dvote_backend.did";
import { getErrorMessage } from "./utils";
import { MineListType } from "./interface";
import ListCard from "./components/ListCard";
import Tips, { TipsProps } from "./components/Tips";
import { AuthContext } from "./components/AuthProvider";
const SelectTab = ({
  selected,
  tabIndex,
  label,
  onClick,
}: {
  selected: boolean;
  tabIndex: number;
  label: string;
  onClick: () => void;
}) => {
  return (
    <Chip
      variant={selected ? "filled" : "outlined"}
      clickable
      tabIndex={tabIndex}
      color="info"
      label={label}
      sx={{
        fontSize: "1rem",
      }}
      onClick={onClick}
    />
  );
};
const Mine = () => {
  const [mineVotes, setMineVotes] = useState<UserVoteRecord>();
  const [tips, setTips] = useState<TipsProps>();
  const { loggedIn, backendActor } = useContext(AuthContext);
  const [items, setItems] = useState<Array<{ hash: string; title: string }>>();
  const [selectedTab, setSelectedTab] = useState<MineListType>(
    MineListType.Owned
  );
  useEffect(() => {
    if (!loggedIn || !backendActor) return;
    (async () => {
      const votes = await backendActor.getMyVote();
      console.log(votes, "getMyVote");
      if ("Err" in votes) {
        setTips({ message: getErrorMessage(votes.Err) });
        return;
      }
      setMineVotes(votes.Ok);
    })();
  }, [backendActor, loggedIn]);
  useEffect(() => {
    const list = mineVotes?.[selectedTab].map(([hash, item]) => {
      return { hash, title: item.title };
    });
    list && setItems(list);
  }, [selectedTab, mineVotes]);
  return (
    <Box>
      <Box mb={3} display={"flex"} justifyContent={"space-evenly"}>
        <SelectTab
          selected={selectedTab === MineListType.Owned}
          tabIndex={0}
          label={"My owned"}
          onClick={() => setSelectedTab(MineListType.Owned)}
        />
        <SelectTab
          selected={selectedTab === MineListType.Participated}
          tabIndex={1}
          label={"My participated"}
          onClick={() => setSelectedTab(MineListType.Participated)}
        />
      </Box>
      {items && <ListCard items={items}></ListCard>}
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
export default Mine;
