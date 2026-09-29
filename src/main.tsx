import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { theme } from "./theme/theme";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import { ApiProvider, useSiteData } from "./api/react";
import "./styles.css";
const Catalog = lazy(() => import("./pages/Catalog"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Rfq = lazy(() => import("./pages/Rfq"));
const RfqConfirmation = lazy(() =>
  import("./pages/Rfq").then((module) => ({
    default: module.RfqConfirmation,
  })),
);
const Help = lazy(() =>
  import("./pages/Supporting").then((module) => ({ default: module.Help })),
);
const InfoPage = lazy(() =>
  import("./pages/Supporting").then((module) => ({
    default: module.InfoPage,
  })),
);
const OurWork = lazy(() =>
  import("./pages/Supporting").then((module) => ({
    default: module.OurWork,
  })),
);
const RequestQuote = lazy(() =>
  import("./pages/Supporting").then((module) => ({
    default: module.RequestQuote,
  })),
);
const staticPage = (name: "About" | "Contact" | "NotFound" | "Privacy" | "Terms") =>
  lazy(() =>
    import("./pages/StaticPages").then((module) => ({
      default: module[name],
    })),
  );
const About = staticPage("About");
const Contact = staticPage("Contact");
const NotFound = staticPage("NotFound");
const Privacy = staticPage("Privacy");
const Terms = staticPage("Terms");
function AppRoutes() {
  const { products } = useSiteData();
  return (
    <Suspense
      fallback={
        <div className="container route-loading" role="status">
          Loading page...
        </div>
      }
    >
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
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="terms" element={<Terms />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="request-quote" element={<Rfq />} />
        <Route
          path="request-quote/confirmation/:id"
          element={<RfqConfirmation />}
        />
        <Route path="quote-preview" element={<RequestQuote />} />
        <Route path="account" element={<InfoPage />} />
        <Route path="track-order" element={<InfoPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
    </Suspense>
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
