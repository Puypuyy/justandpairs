import { createTheme } from "@mui/material/styles";
export const tokens = {
  midnight: "#172033",
  blue: "#007BFF",
  gold: "#C5A46D",
  pink: "#D94F8A",
  canvas: "#F7F8FA",
  warm: "#FAF9F6",
  border: "#E2E6EB",
  secondary: "#667085",
};
export const theme = createTheme({
  palette: {
    primary: { main: tokens.blue, dark: "#0064D1", contrastText: "#fff" },
    secondary: { main: tokens.midnight },
    text: { primary: "#17181A", secondary: tokens.secondary },
    background: { default: "#fff" },
    divider: tokens.border,
  },
  typography: {
    fontFamily: "Inter, Arial, sans-serif",
    button: { textTransform: "none", fontWeight: 600 },
    h1: { fontFamily: "Manrope, Inter, sans-serif", fontWeight: 700 },
    h2: { fontFamily: "Manrope, Inter, sans-serif", fontWeight: 700 },
  },
  spacing: 8,
  shape: { borderRadius: 8 },
  breakpoints: { values: { xs: 0, sm: 768, md: 1024, lg: 1280, xl: 1536 } },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 10, minHeight: 48, padding: "12px 24px" },
        containedPrimary: {
          backgroundColor: "#006fe6",
          "&:hover": { backgroundColor: "#005dc2" },
        },
        outlined: { color: tokens.midnight, borderColor: "#CBD2DA" },
      },
    },
    MuiTextField: { defaultProps: { fullWidth: true, size: "small" } },
    MuiOutlinedInput: {
      styleOverrides: { root: { minHeight: 48, background: "#fff" } },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "none",
          border: `1px solid ${tokens.border}`,
        },
      },
    },
    MuiDrawer: { styleOverrides: { paper: { maxWidth: "90vw" } } },
  },
});
