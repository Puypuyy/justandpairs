import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Drawer,
  IconButton,
  Menu,
  MenuItem,
  TextField,
} from "@mui/material";
import {
  ArrowRight,
  ChevronDown,
  Menu as MenuIcon,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { useSiteData } from "../api/react";
import { useCatalogTool } from "../hooks/useCatalogTool";
export function Logo() {
  return (
    <Link className="brand" to="/" aria-label="Just and Pairs home">
      <span className="brand-mark">
        j<span>+</span>p
      </span>
      <span className="brand-words">
        JUST AND PAIRS<small>IDEAS MADE TANGIBLE.</small>
      </span>
    </Link>
  );
}
export default function Layout() {
  const { categories, occasions, products } = useSiteData();
  useCatalogTool();
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState<{
    anchor: HTMLElement;
    type: string;
  } | null>(null);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (location.hash) {
      requestAnimationFrame(() =>
        document
          .getElementById(decodeURIComponent(location.hash.slice(1)))
          ?.scrollIntoView(),
      );
    } else {
      window.scrollTo(0, 0);
    }
    setDrawer(false);
    setMenu(null);
    const slug = location.pathname.split("/").pop();
    const name =
      products.find((p) => p.slug === slug)?.name ||
      categories.find((c) => c.slug === slug)?.name ||
      occasions.find((o) => o.slug === slug)?.name;
    document.title = name
      ? `${name} | Just and Pairs`
      : "Just and Pairs — Ideas made tangible.";
  }, [location.pathname, location.hash]);
  const menuItems = menu?.type === "products" ? categories : occasions;
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="utility">
        <div className="container">
          <span>Custom awards & merchandise made for your moment.</span>
          <div>
            <Link to="/track-order">Track Order</Link>
            <Link to="/help">Help</Link>
          </div>
        </div>
      </div>
      <header className="site-header">
        <div className="container header-inner">
          <IconButton
            className="mobile-menu"
            aria-label="Open navigation"
            onClick={() => setDrawer(true)}
          >
            <MenuIcon />
          </IconButton>
          <Logo />
          <nav className="desktop-nav" aria-label="Main navigation">
            <button
              aria-haspopup="menu"
              aria-expanded={menu?.type === "products"}
              onClick={(e) =>
                setMenu({ anchor: e.currentTarget, type: "products" })
              }
            >
              Products <ChevronDown size={12} />
            </button>
            <Link to="/awards-plaques">Awards & Plaques</Link>
            <button
              aria-haspopup="menu"
              aria-expanded={menu?.type === "occasions"}
              onClick={(e) =>
                setMenu({ anchor: e.currentTarget, type: "occasions" })
              }
            >
              Shop by Occasion <ChevronDown size={12} />
            </button>
            <Link to="/request-quote">Custom Orders</Link>
            <Link to="/our-work">Our Work</Link>
            <Link to="/help">Help</Link>
          </nav>
          <div className="header-actions">
            <IconButton
              aria-label="Search products"
              onClick={() => setSearch(true)}
            >
              <Search size={20} />
            </IconButton>
            <IconButton component={Link} to="/account" aria-label="Account">
              <UserRound size={20} />
            </IconButton>
            <Button
              className="header-quote"
              variant="contained"
              component={Link}
              to="/request-quote"
            >
              Request a Quote
            </Button>
          </div>
        </div>
      </header>
      <Menu anchorEl={menu?.anchor} open={!!menu} onClose={() => setMenu(null)}>
        {menu?.type === "products" && (
          <MenuItem
            component={Link}
            to="/products"
            onClick={() => setMenu(null)}
          >
            All products <ArrowRight size={16} />
          </MenuItem>
        )}
        {menuItems.map((item) => (
          <MenuItem
            key={item.slug}
            component={Link}
            to={`/${menu?.type === "products" ? "products" : "occasions"}/${item.slug}`}
            onClick={() => setMenu(null)}
          >
            {item.name}
          </MenuItem>
        ))}
      </Menu>
      <Drawer open={drawer} onClose={() => setDrawer(false)}>
        <div className="mobile-drawer">
          <div className="row-between">
            <Logo />
            <IconButton
              aria-label="Close navigation"
              onClick={() => setDrawer(false)}
            >
              <X />
            </IconButton>
          </div>
          <Button
            component={Link}
            to="/request-quote"
            variant="contained"
            onClick={() => setDrawer(false)}
          >
            Request a Quote
          </Button>
          <Button
            component={Link}
            to="/request-quote"
            variant="outlined"
            onClick={() => setDrawer(false)}
          >
            Start a Custom Order
          </Button>
          <h3>Browse products</h3>
          <Link to="/products">All products</Link>
          {categories.map((c) => (
            <Link key={c.slug} to={`/products/${c.slug}`}>
              {c.name}
            </Link>
          ))}
          <h3>Shop by occasion</h3>
          {occasions.map((o) => (
            <Link key={o.slug} to={`/occasions/${o.slug}`}>
              {o.name}
            </Link>
          ))}
          <Link to="/our-work">Our Work</Link>
          <Link to="/help">Help</Link>
        </div>
      </Drawer>
      <Dialog
        open={search}
        onClose={() => setSearch(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle className="row-between">
          Find your next recognition piece
          <IconButton
            onClick={() => setSearch(false)}
            aria-label="Close search"
          >
            <X />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <form
            className="search-form"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(`/products?q=${encodeURIComponent(query)}`);
              setSearch(false);
            }}
          >
            <TextField
              autoFocus
              label="Search products"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try glass, plaque or team"
            />
            <Button variant="contained" type="submit">
              Search
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <main id="main">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
function Footer() {
  const { categories, occasions } = useSiteData();
  const groups = [
    {
      title: "Awards & Products",
      items: categories.map((c) => ({
        label: c.name,
        to: `/products/${c.slug}`,
      })),
    },
    {
      title: "Shop by Occasion",
      items: occasions.map((o) => ({
        label: o.name,
        to: `/occasions/${o.slug}`,
      })),
    },
    {
      title: "Customer Care",
      items: [
        "How to Order",
        "Track Order",
        "Payments",
        "Design Approval",
        "Pickup & Delivery",
        "FAQs",
      ].map((label) => ({
        label,
        to:
          label === "Track Order"
            ? "/track-order"
            : `/help#${label.toLowerCase().replaceAll(" ", "-")}`,
      })),
    },
    {
      title: "Just and Pairs",
      items: ["Our Work", "About", "Contact", "Terms", "Privacy"].map(
        (label) => ({
          label,
          to: label === "Our Work" ? "/our-work" : `/${label.toLowerCase()}`,
        }),
      ),
    },
  ];
  return (
    <footer>
      <div className="container">
        <div className="footer-top">
          <div>
            <Logo />
            <h3>Ideas made tangible.</h3>
            <p>
              Custom awards and merchandise.
              <br />
              Made with care. Made for your moment.
            </p>
          </div>
          {groups.map((g) => (
            <div key={g.title}>
              <h4>{g.title}</h4>
              {g.items.map((i) => (
                <Link key={i.label} to={i.to}>
                  {i.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} Just and Pairs. All rights reserved.
          </span>
          <span>Thoughtfully made for meaningful moments.</span>
        </div>
      </div>
    </footer>
  );
}
