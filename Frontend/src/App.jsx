import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import Navbar from './components/layout/Navbar/Navbar'
import { useRef, useEffect, lazy, Suspense } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { Toaster } from 'react-hot-toast'
import Footer from './components/layout/Footer/Footer';
import CompleteGoogleProfile from './pages/CompleteGoogleProfile'
import MyAccount from './pages/MyAccount'
import Wishlist from './components/sections/account/Wishlist'
import Orders from './components/sections/account/Orders'
import Profile from './components/sections/account/Profile'
import Addresses from './components/sections/account/Addresses'
import ViewOrder from './components/sections/account/ViewOrder'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import ShopDetails from './pages/ShopDetails'
import MainAbout from './components/sections/OurStory'
import OurStory from './components/sections/OurStory'
import Shop from './components/sections/Shop'
import Candles from './pages/Candles'
import Contact from './components/sections/Contact'
import Customized from './pages/Customized'
import Collections from './components/sections/Collections'
import CollectionProducts from './pages/CollectionProducts'



// Lazy loading pages for performance optimization
const Home = lazy(() => import('./pages/Home'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const SignIn = lazy(() => import('./pages/SignIn'));
const Register = lazy(() => import('./pages/Register'));
const VerifyOTP = lazy(() => import('./pages/VerifyOTP'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));


// Simple loading indicator for Suspense fallback
const PageLoader = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-coffee border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {
  const contactRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger, ScrollSmoother)
    const smoother = ScrollSmoother.create({
      content: "#smooth-content",
      smooth: 1.2,
      effects: true
    })
    return () => {
      smoother && smoother.kill()
      ScrollTrigger.getAll().forEach((t) => t.kill())
    }
  }, []);


  return (
    <>
      <div id="smooth-wrapper">
        <Navbar />
        <div id="smooth-content">
          <div className="min-h-screen flex flex-col overflow-clip">
            <main className="flex-grow">

              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/collections/candles/product/:id" element={<ShopDetails />} />
                  <Route path="/about" element={<OurStory />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/collections/candles" element={<Candles />} />
                  <Route path="/customized" element={<Customized />} />
                  <Route path="/collections" element={<Collections />} />
                  <Route path="/collections/:categoryName" element={<CollectionProducts />} />

                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/signin" element={<SignIn />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/verify-otp" element={<VerifyOTP />} />
                  <Route path="/complete-google-profile" element={<CompleteGoogleProfile />} />


                  <Route path="/account" element={<MyAccount />}>
                    <Route index element={<Profile />} />
                    <Route path="orders" element={<Orders />} />
                    <Route path="wishlist" element={<Wishlist />} />
                    <Route path="addresses" element={<Addresses />} />
                    <Route path="orders/:orderId" element={<ViewOrder />} />
                  </Route>



                </Routes>

              </Suspense>
            </main>
            <Footer />

          </div>
        </div>
      </div>
      <Toaster position='top-right' />
    </>
  )
}

export default App
