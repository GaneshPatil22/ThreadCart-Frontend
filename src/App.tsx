import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./components/Home";
import Products from "./components/product/Products";
import { SubCategoryHome } from "./components/sub-categories/SubCategoryHome";
import { AddItem } from "./components/AddItems/AddItem";
import ConfirmEmail from "./pages/ConfirmEmail";
import { CartProvider } from "./context/CartContext";
import { CartPage } from "./pages/cart/CartPage";

export default function App() {
  return (
    <CartProvider>
      <div className="bg-background min-h-screen text-text-primary flex flex-col">
        <Navbar />

        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/subcategory" element={<SubCategoryHome />} />
            <Route path="/add_item" element={<AddItem/>}/>
            <Route path="/confirm-email" element={<ConfirmEmail />} />
            <Route path="/cart" element={<CartPage />} />
            {/* more routes */}
          </Routes>
        </div>

        <Footer />
      </div>
    </CartProvider>
  );
}
