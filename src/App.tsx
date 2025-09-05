import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState } from "react";
import { ProductCatalog } from "./components/ProductCatalog";
import { Cart } from "./components/Cart";
import { AdminDashboard } from "./components/AdminDashboard";
import { UserProfile } from "./components/UserProfile";
import { OrderHistory } from "./components/OrderHistory";
import { Wishlist } from "./components/Wishlist";
import { Helmet } from "react-helmet";

export default function App() {
  const [currentView, setCurrentView] = useState<'catalog' | 'cart' | 'profile' | 'orders' | 'wishlist' | 'admin'>('catalog');
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const userProfile = useQuery(api.userProfile.getUserProfile);
  const cartTotal = useQuery(api.cart.getCartTotal);

  const isAdmin = userProfile?.role === 'admin';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <h1 
              className="text-2xl font-bold text-blue-600 cursor-pointer"
              onClick={() => setCurrentView('catalog')}
            >
              ShopHub
            </h1>
            
            <Authenticated>
              <nav className="hidden md:flex items-center gap-6">
                <button
                  onClick={() => setCurrentView('catalog')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'catalog' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Products
                </button>
                <button
                  onClick={() => setCurrentView('wishlist')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'wishlist' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Wishlist
                </button>
                <button
                  onClick={() => setCurrentView('orders')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'orders' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Orders
                </button>
                {isAdmin && (
                  <button
                    onClick={() => setCurrentView('admin')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentView === 'admin' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Admin
                  </button>
                )}
              </nav>
            </Authenticated>
          </div>

          <div className="flex items-center gap-4">
            <Authenticated>
              <button
                onClick={() => setCurrentView('cart')}
                className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9m-9 0V19a2 2 0 002 2h7a2 2 0 002-2v-.5" />
                </svg>
                {cartTotal && cartTotal.itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartTotal.itemCount}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => setCurrentView('profile')}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            </Authenticated>
            
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Unauthenticated>
          <div className="min-h-[80vh] flex items-center justify-center p-8">
            <div className="w-full max-w-md mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to ShopHub</h1>
                <p className="text-xl text-gray-600">Your one-stop e-commerce destination</p>
              </div>
              <SignInForm />
            </div>
          </div>
        </Unauthenticated>

        <Authenticated>
          {currentView === 'catalog' && <ProductCatalog />}
          {currentView === 'cart' && <Cart />}
          {currentView === 'profile' && <UserProfile />}
          {currentView === 'orders' && <OrderHistory />}
          {currentView === 'wishlist' && <Wishlist />}
          {currentView === 'admin' && isAdmin && <AdminDashboard />}
        </Authenticated>
      </main>

      <Toaster />
    </div>
  );
}
function App() {
  return (
    <>
      <Helmet>
        <title>Smit's Shophub - Welcome</title>
      </Helmet>
      <h1>Hello!</h1>
    </>
  );
}

export default App;
