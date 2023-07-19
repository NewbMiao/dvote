import React, { useState, useEffect } from "react";
import { Typography } from "@mui/material";

const Countdown = ({ durationInSec }: { durationInSec: number }) => {
  const [remainingTime, setRemainingTime] = useState(durationInSec);

  useEffect(() => {
    if (remainingTime > 0) {
      const timer = setInterval(() => {
        setRemainingTime((prevTime) => prevTime - 1);
      }, 1000);

      return () => {
        clearInterval(timer);
      };
    }
  }, [remainingTime]);

  const days = Math.floor(remainingTime / 86400);
  const hours = Math.floor((remainingTime % 86400) / 3600);
  const minutes = Math.floor((remainingTime % 3600) / 60);
  const seconds = remainingTime % 60;
  const formattedTime = ` ${days.toString()}d ${hours.toString()}h ${minutes.toString()}m ${seconds.toString()}s`;
  return <>{formattedTime}</>;
};

export default Countdown;
