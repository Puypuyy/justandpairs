import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { theme } from "./theme/theme";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Rfq, { RfqConfirmation } from "./pages/Rfq";
import Catalog from "./pages/Catalog";
import ProductDetail from "./pages/ProductDetail";
import { Help, InfoPage, OurWork, RequestQuote } from "./pages/Supporting";
import { ApiProvider, useSiteData } from "./api/react";
import "./styles.css";
function AppRoutes() {
  const { products } = useSiteData();
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="products" element={<Catalog />} />
        {products.map((p) => (
          <Route
            key={p.id}
            path={`products/${p.slug}`}
            element={<ProductDetail key={p.id} product={p} />}
          />
        ))}
        <Route path="products/:category" element={<Catalog />} />
        <Route path="occasions/:occasion" element={<Catalog />} />
        <Route path="awards-plaques" element={<Catalog awards />} />
        <Route path="our-work" element={<OurWork />} />
        <Route path="help" element={<Help />} />
        <Route path="request-quote" element={<Rfq />} />
        <Route
          path="request-quote/confirmation/:id"
          element={<RfqConfirmation />}
        />
        <Route path="quote-preview" element={<RequestQuote />} />
        <Route path="*" element={<InfoPage />} />
      </Route>
    </Routes>
  );
}
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <ApiProvider>
          <AppRoutes />
        </ApiProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
