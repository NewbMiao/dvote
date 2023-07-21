import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Grid,
  Typography,
} from "@mui/material";
import React from "react";
import StyledLink from "./StyledLink";
import { getColorFromString, hexToRgba } from "./theme";
const ListCard = ({
  items,
}: {
  items: Array<{ title: string; hash: string }>;
}) => {
  return (
    <Grid container spacing={2} rowSpacing={2}>
      {items.map(({ title, hash }) => (
        <Grid
          key={hash}
          item
          xs={12}
          sm={6}
          md={4}
          lg={3}
          sx={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Card
            sx={{
              width: 280,
              alignSelf: "flex-start",
            }}
            key={hash}
          >
            <CardHeader
              sx={{
                backgroundColor: hexToRgba(getColorFromString(title), 0.6),
              }}
            ></CardHeader>
            <CardContent>
              <Typography
                variant="h5"
                my={2}
                gutterBottom
                sx={{
                  wordBreak: "break-all",
                }}
              >
                {title}
              </Typography>

              <Typography variant="subtitle2" color={"GrayText"}>
                {hash}
              </Typography>
            </CardContent>
            <CardActions>
              <StyledLink to={`/vote/${hash}`}>
                <Button>See detail</Button>
              </StyledLink>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};
export default ListCard;
