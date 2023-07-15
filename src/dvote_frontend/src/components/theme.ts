import { createTheme } from "@mui/material/styles";
import { red } from "@mui/material/colors";

// A custom theme for this app
const theme = createTheme({
  palette: {
    primary: {
      main: "#556cd6",
    },
    secondary: {
      main: "#19857b",
    },
    error: {
      main: red.A400,
    },
  },
});

export default theme;

export const alphabetColors: Record<string, string> = {
  A: "#FFC107",
  B: "#2196F3",
  C: "#00BCD4",
  D: "#673AB7",
  E: "#4CAF50",
  F: "#E91E63",
  G: "#8BC34A",
  H: "#3F51B5",
  I: "#9E9E9E",
  J: "#009688",
  K: "#FF9800",
  L: "#FFEB3B",
  M: "#9C27B0",
  N: "#03A9F4",
  O: "#FF5722",
  P: "#607D8B",
  Q: "#F44336",
  R: "#795548",
  S: "#00E676",
  T: "#FFEB3B",
  U: "#CDDC39",
  V: "#FF4081",
  W: "#9C27B0",
  X: "#FF4081",
  Y: "#03A9F4",
  Z: "#FF9800",
};

export const getColorFromString = (str: string): string => {
  const alphabet = str.match(/[a-zA-Z]/)?.[0]?.toUpperCase() ?? "A";
  return alphabetColors[alphabet];
};

export const hexToRgba = (hex: string, opcaity: number): string => {
  // Remove the '#' symbol if present
  hex = hex.replace("#", "");

  // Convert the hexadecimal color to decimal values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Return the RGB values as an object
  return "rgba(" + r + ", " + g + ", " + b + ", " + opcaity + ")";
};
