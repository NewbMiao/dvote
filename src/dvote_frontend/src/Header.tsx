import React, { useContext } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import MenuIcon from "@mui/icons-material/Menu";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import StyledLink from "./components/StyledLink";
import { AuthContext } from "./components/AuthProvider";

const navItems = [
  { name: "Create", path: "/create" },
  { name: "Explore", path: "/" },
  { name: "Mine", path: "/mine" },
  { name: "About", path: "https://github.com/NewbMiao/dvote" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { loggedIn, login, logout } = useContext(AuthContext);
  const handleDrawerToggle = () => {
    setMobileOpen((prevState) => !prevState);
  };
  const loginBtnText = loggedIn ? "Logout" : "Login";
  const handleLogin = () => {
    if (loggedIn) {
      logout();
    } else {
      login();
    }
  };

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: "center" }}>
      <Typography fontWeight={600} sx={{ my: 2 }}>
        D-VOTE
      </Typography>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.name} disablePadding>
            <ListItemButton>
              <StyledLink key={item.name} to={item.path}>
                <ListItemText primary={item.name} />
              </StyledLink>
            </ListItemButton>
          </ListItem>
        ))}
        <ListItem
          key={loginBtnText}
          disablePadding
          sx={{ textAlign: "left", display: "flex" }}
        >
          <ListItemButton>
            <ListItemText primary={loginBtnText} onClick={handleLogin} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar component="nav">
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{
              mr: 2,
              display: { sm: "none" },
              flex: 1,
              justifyContent: "flex-end",
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              display: { xs: "none", sm: "block" },
            }}
          >
            <img
              src="logo.png"
              alt="logo"
              width={30}
              style={{ marginRight: 8, verticalAlign: "middle" }}
            />
            D-VOTE
          </Typography>

          <Box sx={{ display: { xs: "none", sm: "block" } }}>
            {navItems.map((item) => (
              <StyledLink key={item.name} to={item.path}>
                <Button key={item.name} sx={{ color: "#fff" }}>
                  {item.name}
                </Button>
              </StyledLink>
            ))}
            <Button
              key={loginBtnText}
              sx={{ color: "#fff" }}
              onClick={handleLogin}
            >
              {loginBtnText}
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Box component="nav">
        <Drawer
          container={() => window.document.body}
          variant="temporary"
          open={mobileOpen}
          anchor={"right"}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: "block", sm: "none" },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Box component="main" sx={{ p: 3 }}>
        <Toolbar />
      </Box>
    </>
  );
}
