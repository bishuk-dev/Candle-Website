import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronDown, Search, HelpCircle, CreditCard, Truck, CheckCircle2, Lock, Plus, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageBanner from '../components/ui/PageBanner';

// Custom Hooks
import { useCart } from '../hooks/useCart';
import { useCheckout } from '../hooks/useCheckout';
import { useUser } from '../hooks/useAuth';
import { useAddress } from '../hooks/useAddress';
import { usePincodeLookup } from '../hooks/usePincodeLookup';

const Checkout = () => {
  const navigate = useNavigate();

  const { data: user } = useUser();
  const { cart, isLoading: isCartLoading } = useCart();
  const { createOrder, initRazorpay, verifyPayment, isPlacingOrder } = useCheckout();

  // 👉 Extract addAddress AND isAdding directly from your hook!
  const { addAddress, isAdding } = useAddress();
  const { lookupPincode, isLookingUp, pincodeError } = usePincodeLookup();

  const savedAddresses = user?.addresses || [];

  // Form & UI States
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(savedAddresses.length === 0);
  const [isAddressExpanded, setIsAddressExpanded] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');

  const [shippingAddress, setShippingAddress] = useState({
    firstName: "", lastName: "", address: "", apartment: "",
    city: "", state: "", pinCode: "", phone: ""
  });

  useEffect(() => {
    if (savedAddresses.length > 0 && !selectedAddressId) {
      const defaultAddr = savedAddresses.find(a => a.isDefault) || savedAddresses[0];
      setSelectedAddressId(defaultAddr._id);
      setShowNewAddressForm(false);
    } else if (savedAddresses.length === 0) {
      setShowNewAddressForm(true);
    }
  }, [savedAddresses, selectedAddressId]);

  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      const isCustom = item.type === "custom";
      const productData = isCustom ? item.customCandle : item.product;
      const price = isCustom ? productData?.totalPrice : (productData?.discountPrice || productData?.price || 0);
      return acc + (price * item.quantity);
    }, 0);
  }, [cart]);

  const shippingCost = subtotal > 999 ? 0 : 99;
  const taxes = subtotal * 0.05;
  const totalAmount = Math.round(subtotal + shippingCost + taxes);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(val);
  };

  const handleShippingChange = async (e) => {
    const { name, value } = e.target;

    if (name === 'pinCode') {
      const val = value.replace(/\D/g, '').slice(0, 6);
      setShippingAddress(prev => ({ ...prev, pinCode: val }));

      if (val.length === 6) {
        const locationData = await lookupPincode(val);
        if (locationData) {
          setShippingAddress(prev => ({
            ...prev,
            city: locationData.city,
            state: locationData.state
          }));
        } else {
          setShippingAddress(prev => ({ ...prev, city: '', state: '' }));
        }
      }
    } else {
      setShippingAddress(prev => ({ ...prev, [name]: value }));
    }
  };

  // 👉 CLEANED UP: Save Address logic delegates toasts to the hook
  const handleSaveAddress = async (e) => {
    if (e) e.preventDefault();

    const isMissingFields =
      !shippingAddress.firstName?.trim() ||
      !shippingAddress.address?.trim() ||
      !shippingAddress.city?.trim() ||
      !shippingAddress.state?.trim() ||
      !shippingAddress.pinCode?.trim() ||
      !shippingAddress.phone?.trim();

    if (isMissingFields) {
      toast.error("Please fill in all required shipping details.");
      return;
    }

    if (shippingAddress.pinCode.trim().length !== 6) {
      toast.error("Please enter a valid 6-digit Pincode.");
      return;
    }

    const combinedAddress = shippingAddress.apartment?.trim()
      ? `${shippingAddress.apartment.trim()}, ${shippingAddress.address.trim()}`
      : shippingAddress.address.trim();

    const finalAddress = {
      firstName: shippingAddress.firstName.trim(),
      lastName: shippingAddress.lastName.trim(),
      address: combinedAddress,
      city: shippingAddress.city.trim(),
      state: shippingAddress.state.trim(),
      pincode: shippingAddress.pinCode.trim(),
      phone: shippingAddress.phone.trim()
    };

    try {
      await addAddress(finalAddress);
      // Only close/clear if it actually succeeded. Toasts are handled by useAddress hook!
      setShowNewAddressForm(false);
      setShippingAddress({ firstName: "", lastName: "", address: "", apartment: "", city: "", state: "", pinCode: "", phone: "" });
    } catch (err) {
      // Silently catch error to prevent app crash. The hook handles the error toast.
    }
  };

  const handleCheckout = async (e) => {
    if (e) e.preventDefault();
    if (cart.length === 0) return toast.error("Your cart is empty!");

    if (showNewAddressForm) {
      return toast.error("Please save your delivery address before checking out.");
    }

    const selected = savedAddresses.find(a => a._id === selectedAddressId);
    if (!selected) {
      return toast.error("Please select a shipping address.");
    }

    const orderPayload = {
      address: selected.address,
      city: selected.city,
      state: selected.state,
      pincode: selected.pincode,
      phone: selected.phone,
      paymentMethod: paymentMethod === 'paytm' ? 'razorpay' : paymentMethod,
    };

    try {
      if (paymentMethod === 'cod') {
        await createOrder(orderPayload);
        toast.success("Order placed successfully!");
        navigate('/account/orders');
        return;
      }

      if (paymentMethod === 'razorpay') {
        const rpResponse = await initRazorpay(orderPayload);

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: rpResponse.razorpayOrder.amount,
          currency: "INR",
          name: "Naisha Creations",
          description: "Premium Candles",
          order_id: rpResponse.razorpayOrder.id,

          handler: async function (response) {
            try {
              await verifyPayment({
                orderId: rpResponse.orderId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              toast.success("Payment successful! Order placed.");
              navigate('/account/orders');
            } catch (err) {
              toast.error(err.response?.data?.message || "Payment verification failed. Please contact support.");
            }
          },
          prefill: {
            name: `${selected.firstName} ${selected.lastName || ''}`,
            contact: selected.phone,
          },
          theme: { color: "#ea580c" }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          toast.error("Payment failed: " + response.error.description);
        });
        rzp.open();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong during checkout.");
    }
  };

  if (isCartLoading) return <div className="py-20 text-center">Loading checkout...</div>;

  const displayAddresses = isAddressExpanded
    ? savedAddresses
    : savedAddresses.filter(a => a._id === selectedAddressId);

  return (
    <div className="md:overflow-hidden bg-white text-slate-800 font-sans flex flex-col">
      <PageBanner title="Checkout" currentPage="Checkout" />
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row flex-1 h-full w-full">

        {/* LEFT COLUMN: Checkout Form */}
        <div className="w-full md:w-[58%] p-6 md:p-12 border-r border-gray-100 md:h-full md:overflow-y-auto bg-white">
          <header className="mb-10">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold">Delivery Address</h1>
              {savedAddresses.length > 0 && !showNewAddressForm && !isAddressExpanded && (
                <button
                  onClick={() => setIsAddressExpanded(true)}
                  className="text-sm font-medium text-[#D19D94] hover:text-[#C28C83] underline transition-colors cursor-pointer"
                >
                  Change
                </button>
              )}
            </div>

            {/* ADDRESS SELECTOR OR FORM */}
            {savedAddresses.length > 0 && !showNewAddressForm ? (
              <div className="space-y-4 animate-in fade-in">
                <div className="grid grid-cols-1 gap-4">
                  {displayAddresses.map(addr => (
                    <div
                      key={addr._id}
                      onClick={() => {
                        setSelectedAddressId(addr._id);
                        setIsAddressExpanded(false);
                      }}
                      className={`p-4 border rounded-md cursor-pointer transition-all ${selectedAddressId === addr._id ? 'border-stone-800 bg-stone-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${selectedAddressId === addr._id ? 'border-stone-800' : 'border-gray-300'}`}>
                          {selectedAddressId === addr._id && <div className="w-2 h-2 bg-stone-800 rounded-full" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <p className="font-semibold text-sm text-black">{addr.firstName} {addr.lastName}</p>
                            {addr.isDefault && <span className="text-[10px] bg-stone-200 text-stone-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Default</span>}
                          </div>
                          <p className="text-sm text-gray-600">{addr.address}</p>
                          <p className="text-sm text-gray-600">{addr.city}, {addr.state} {addr.pincode}</p>
                          <p className="text-sm text-gray-600 mt-1">Phone: +91 {addr.phone}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {isAddressExpanded && (
                  <button
                    onClick={() => setShowNewAddressForm(true)}
                    className="text-sm font-medium text-[#D19D94] hover:text-[#C28C83] flex items-center gap-1 mt-4 transition-colors cursor-pointer"
                  >
                    <Plus size={16} /> Add a new address
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in">
                {savedAddresses.length > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-800">New Address</h3>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" name="firstName" placeholder="First name" value={shippingAddress.firstName} onChange={handleShippingChange} className="w-full p-3.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-stone-400 placeholder:text-gray-400" />
                  <input type="text" name="lastName" placeholder="Last name" value={shippingAddress.lastName} onChange={handleShippingChange} className="w-full p-3.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-stone-400 placeholder:text-gray-400" />
                </div>
                <div className="relative">
                  <input type="text" name="address" placeholder="Address" value={shippingAddress.address} onChange={handleShippingChange} className="w-full p-3.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-stone-400 placeholder:text-gray-400" />
                </div>
                <input type="text" name="apartment" placeholder="Apartment, suite, etc. (optional)" value={shippingAddress.apartment} onChange={handleShippingChange} className="w-full p-3.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-stone-400 placeholder:text-gray-400" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <input
                      type="text"
                      name="pinCode"
                      placeholder="PIN code"
                      value={shippingAddress.pinCode}
                      onChange={handleShippingChange}
                      className={`w-full p-3.5 border rounded-md focus:outline-none focus:ring-1 focus:ring-stone-400 placeholder:text-gray-400 ${pincodeError ? 'border-red-300' : 'border-gray-300'}`}
                    />
                    {isLookingUp && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-5 h-5 animate-spin text-[#D19D94]" />
                      </div>
                    )}
                  </div>
                  <input type="text" name="city" placeholder="City" value={shippingAddress.city} onChange={handleShippingChange} className="w-full p-3.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-stone-400 placeholder:text-gray-400" />
                  <input type="text" name="state" placeholder="State" value={shippingAddress.state} onChange={handleShippingChange} className="w-full p-3.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-stone-400 placeholder:text-gray-400" />
                </div>
                {pincodeError && <p className="text-red-500 text-xs mt-1">{pincodeError}</p>}

                <div className="relative mt-4">
                  <input type="text" name="phone" placeholder="Phone" value={shippingAddress.phone} onChange={handleShippingChange} className="w-full p-3.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-stone-400 placeholder:text-gray-400" />
                </div>

                {/* 👉 Save Address Button using isAdding from hook */}
                <div className="flex gap-4 mt-6 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleSaveAddress}
                    disabled={isAdding}
                    className="px-6 py-3 bg-stone-800 hover:bg-stone-900 disabled:bg-stone-400 text-white font-medium rounded-md transition-colors cursor-pointer"
                  >
                    {isAdding ? "Saving..." : "Save Address"}
                  </button>
                  {savedAddresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewAddressForm(false);
                        setIsAddressExpanded(true);
                      }}
                      className="px-6 py-3 border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium rounded-md transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}
          </header>

          {/* Payment Section */}
          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-1">Payment</h2>
            <p className="text-sm text-gray-500 mb-4">All transactions are secure and encrypted.</p>

            <div className="border border-gray-200 rounded-md overflow-hidden">
              <div className={`p-4 cursor-pointer transition-all ${paymentMethod === 'razorpay' ? 'bg-stone-50' : 'bg-white'}`} onClick={() => setPaymentMethod('razorpay')}>
                <div className="flex items-center space-x-3">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${paymentMethod === 'razorpay' ? 'border-stone-800' : 'border-gray-300'}`}>
                    {paymentMethod === 'razorpay' && <div className="w-2.5 h-2.5 bg-stone-800 rounded-full" />}
                  </div>
                  <span className="text-sm font-medium">Razorpay Secure (UPI, Cards, Wallets)</span>
                </div>
                {paymentMethod === 'razorpay' && (
                  <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                    <div className="bg-gray-100/50 p-4 rounded-md">
                      <p className="text-sm text-gray-600">You'll be redirected to Razorpay to complete your purchase securely.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className={`p-4 border-t border-gray-200 cursor-pointer transition-all ${paymentMethod === 'cod' ? 'bg-stone-50' : 'bg-white'}`} onClick={() => setPaymentMethod('cod')}>
                <div className="flex items-center space-x-3">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${paymentMethod === 'cod' ? 'border-stone-800' : 'border-gray-300'}`}>
                    {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 bg-stone-800 rounded-full" />}
                  </div>
                  <span className="text-sm font-medium">Cash on Delivery (COD)</span>
                </div>
              </div>
            </div>
          </section>

          {/* Pay Now Button */}
          <button
            type="button"
            disabled={isPlacingOrder || cart.length === 0 || showNewAddressForm}
            onClick={handleCheckout}
            className="w-full py-4 bg-[#D19D94] hover:bg-[#C28C83] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-md transition-colors text-lg shadow-sm cursor-pointer"
          >
            {isPlacingOrder ? "Processing..." : (paymentMethod === 'cod' ? "Place Order" : "Pay Now")}
          </button>
        </div>

        {/* RIGHT COLUMN: Order Summary */}
        <div className="w-full md:w-[42%] bg-gray-50/50 p-6 md:p-12 md:h-full md:overflow-y-auto border-l border-gray-100">
          <div className="space-y-6 mb-8">
            {cart.map(item => {
              const isCustom = item.type === "custom";
              const productData = isCustom ? item.customCandle : item.product;

              const displayName = isCustom ? "Customized Candle" : productData?.name;
              const displayPrice = isCustom ? productData?.totalPrice : (productData?.discountPrice || productData?.price || 0);
              const displayImage = isCustom ? "/placeholder.jpg" : (productData?.images?.[0]?.url || "/placeholder.jpg");

              return (
                <div key={item._id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative w-16 h-16 bg-white border border-gray-200 rounded-md p-0.5 overflow-hidden">
                      <img src={displayImage} alt={displayName} className="w-full h-full object-cover rounded" />
                      <div className="absolute -top-2 -right-2 bg-stone-800 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                        {item.quantity}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-800">{displayName}</span>
                  </div>
                  <span className="text-sm font-medium">{formatCurrency(displayPrice * item.quantity)}</span>
                </div>
              )
            })}
          </div>

          {/* Price Breakdown */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal · {cart.length} items</span>
              <span className="font-medium text-gray-800">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Shipping</span>
              <span className="text-gray-800">{shippingCost === 0 ? "Free" : formatCurrency(shippingCost)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Taxes (5%)</span>
              <span className="text-gray-800">{formatCurrency(taxes)}</span>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <div className="flex justify-between items-baseline">
              <span className="text-lg font-bold">Total</span>
              <div className="text-right">
                <span className="text-[10px] text-gray-400 mr-2">INR</span>
                <span className="text-2xl font-bold tracking-tight">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Checkout;