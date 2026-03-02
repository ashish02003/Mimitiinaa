import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { API_BASE as API } from '../utils/api';

// Load Razorpay script dynamically
const loadRazorpay = () => new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
});

const Checkout = () => {
    const navigate = useNavigate();
    const { cartItems, getSelectedItems, clearCart } = useCart();
    const { user } = useAuth();

    const selectedItems = getSelectedItems();

    const [step, setStep] = useState(1); // 1 = address, 2 = review+pay
    const [paymentLoading, setPaymentLoading] = useState(false);

    const [address, setAddress] = useState({
        fullName: user?.name || '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: ''
    });

    const [errors, setErrors] = useState({});

    // Redirect if nothing is selected
    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        if (selectedItems.length === 0) { navigate('/cart'); }
    }, [user, selectedItems]);

    // ── Price Calculation ─────────────────────────────────────────────────────
    const subtotal = selectedItems.reduce(
        (acc, item) => acc + (item.price * (item.quantity || 1)), 0
    );

    // Packing charges: per item × qty
    const packingChargesTotal = selectedItems.reduce(
        (acc, item) => acc + ((item.packingCharges || 0) * (item.quantity || 1)), 0
    );

    // Shipping charges: flat sum
    const shippingChargesTotal = selectedItems.reduce(
        (acc, item) => acc + (item.shippingCharges || 0), 0
    );

    const totalPrice = subtotal + packingChargesTotal + shippingChargesTotal;

    // ── Address Validation ────────────────────────────────────────────────────
    const validate = () => {
        const e = {};
        if (!address.fullName.trim()) e.fullName = 'Full name is required';
        if (!address.phone.match(/^\d{10}$/)) e.phone = 'Enter valid 10-digit phone';
        if (!address.addressLine1.trim()) e.addressLine1 = 'Address is required';
        if (!address.city.trim()) e.city = 'City is required';
        if (!address.state.trim()) e.state = 'State is required';
        if (!address.pincode.match(/^\d{6}$/)) e.pincode = 'Enter valid 6-digit pincode';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleChange = (e) => {
        setAddress(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    };

    // ── Razorpay Payment Initiation ───────────────────────────────────────────
    const handlePayNow = async () => {
        if (!validate()) return;
        setPaymentLoading(true);

        const loaded = await loadRazorpay();
        if (!loaded) {
            toast.error('Failed to load payment gateway. Check your internet.');
            setPaymentLoading(false);
            return;
        }

        try {
            // Step 1: Create Razorpay order on backend
            const { data: razorpayOrder } = await axios.post(
                `${API}/payment/create-order`,
                { amount: totalPrice },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );

            // Step 2: Open Razorpay checkout modal
            const options = {
                key: razorpayOrder.keyId,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                name: 'Mimitiinaa',
                description: 'Custom Product Order',
                order_id: razorpayOrder.orderId,
                prefill: {
                    name: address.fullName,
                    email: user.email,
                    contact: address.phone
                },
                theme: { color: '#4f46e5' },

                handler: async (response) => {
                    try {
                        // Step 3: Verify payment signature
                        const { data: verifyData } = await axios.post(
                            `${API}/payment/verify`,
                            {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            },
                            { headers: { Authorization: `Bearer ${user.token}` } }
                        );

                        if (!verifyData.success) {
                            toast.error('Payment verification failed!');
                            return;
                        }

                        // Step 4: Create order in our database
                        const orderPayload = {
                            orderItems: selectedItems.map(item => ({
                                template: item.template?._id || item.template,
                                customizedJson: item.canvasJSON || {},
                                finalImageUrl: item.finalImageUrl || item.finalDesignUrl || '',
                                price: item.price,
                                packingCharges: item.packingCharges || 0,
                                shippingCharges: item.shippingCharges || 0,
                                quantity: item.quantity || 1
                            })),
                            shippingAddress: address,
                            subtotal,
                            packingChargesTotal,
                            shippingChargesTotal,
                            totalPrice,
                            paymentResult: verifyData.paymentResult
                        };

                        const { data: createdOrder } = await axios.post(
                            `${API}/orders`,
                            orderPayload,
                            { headers: { Authorization: `Bearer ${user.token}` } }
                        );

                        // Step 5: Clear cart (backend already clears it too)
                        await clearCart();

                        toast.success('🎉 Order placed successfully!');
                        navigate(`/order-success/${createdOrder._id}`);
                    } catch (err) {
                        console.error('Order creation error:', err);
                        toast.error(err?.response?.data?.message || 'Order creation failed. Contact support.');
                    } finally {
                        setPaymentLoading(false);
                    }
                },

                modal: {
                    ondismiss: () => {
                        setPaymentLoading(false);
                        toast('Payment cancelled.', { icon: '⚠️' });
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            console.error('Payment initiation error:', err);
            toast.error(err?.response?.data?.message || 'Payment initiation failed');
            setPaymentLoading(false);
        }
    };

    // ── Field Component ───────────────────────────────────────────────────────
    const Field = ({ label, name, type = 'text', placeholder, maxLength }) => (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-black text-gray-500 uppercase tracking-wider">{label}</label>
            <input
                type={type}
                name={name}
                value={address[name]}
                onChange={handleChange}
                placeholder={placeholder}
                maxLength={maxLength}
                className={`w-full px-4 py-3 rounded-2xl border-2 text-sm font-medium outline-none transition-all
                    ${errors[name]
                        ? 'border-red-400 bg-red-50 focus:border-red-500'
                        : 'border-gray-200 bg-gray-50 focus:border-indigo-400 focus:bg-white'
                    }`}
            />
            {errors[name] && (
                <span className="text-xs text-red-500 font-bold">{errors[name]}</span>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 py-10 px-4">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate('/cart')}
                        className="w-10 h-10 flex items-center justify-center rounded-2xl border-2 border-gray-200 bg-white hover:bg-gray-50 transition-all"
                    >
                        <FaArrowLeft className="text-gray-500" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Checkout</h1>
                        <p className="text-sm text-gray-400 font-medium">Secure checkout powered by Razorpay</p>
                    </div>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center gap-3 mb-8">
                    {[
                        { num: 1, label: 'Delivery Address' },
                        { num: 2, label: 'Review & Pay' }
                    ].map((s, i) => (
                        <div key={s.num} className="flex items-center gap-3">
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-black text-sm transition-all
                                ${step >= s.num
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                    : 'bg-white text-gray-400 border-2 border-gray-200'}`}
                            >
                                {step > s.num
                                    ? <FaCheckCircle className="text-white" />
                                    : <span>{s.num}</span>
                                }
                                {s.label}
                            </div>
                            {i < 1 && <div className={`h-0.5 w-8 ${step > 1 ? 'bg-indigo-400' : 'bg-gray-200'}`} />}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT: Address / Review */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Step 1: Address Form */}
                        <div className={`bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden ${step !== 1 ? 'opacity-60 pointer-events-none' : ''}`}>
                            <div className="px-8 py-5 border-b border-gray-100 flex items-center gap-3">
                                <div className="w-9 h-9 bg-indigo-100 rounded-2xl flex items-center justify-center">
                                    <FaMapMarkerAlt className="text-indigo-600 text-sm" />
                                </div>
                                <div>
                                    <h2 className="font-black text-gray-800 text-base">Delivery Address</h2>
                                    <p className="text-xs text-gray-400">Where should we deliver?</p>
                                </div>
                            </div>
                            <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <Field label="Full Name" name="fullName" placeholder="Ashish Kumar" />
                                <Field label="Phone Number" name="phone" type="tel" placeholder="10-digit mobile" maxLength={10} />
                                <div className="sm:col-span-2">
                                    <Field label="Address Line 1" name="addressLine1" placeholder="House No., Street, Area" />
                                </div>
                                <div className="sm:col-span-2">
                                    <Field label="Address Line 2 (Optional)" name="addressLine2" placeholder="Landmark, Colony, etc." />
                                </div>
                                <Field label="City" name="city" placeholder="Your City" />
                                <Field label="State" name="state" placeholder="Your State" />
                                <Field label="Pincode" name="pincode" placeholder="6-digit pincode" maxLength={6} />
                            </div>
                            <div className="px-8 pb-8">
                                <button
                                    onClick={() => { if (validate()) setStep(2); }}
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-indigo-200 hover:-translate-y-0.5 active:scale-95 text-sm uppercase tracking-widest"
                                >
                                    Continue to Review →
                                </button>
                            </div>
                        </div>

                        {/* Step 2: Address Review (locked) */}
                        {step === 2 && (
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-green-100 rounded-2xl flex items-center justify-center">
                                            <FaLock className="text-green-600 text-sm" />
                                        </div>
                                        <div>
                                            <h2 className="font-black text-gray-800 text-base">Delivery Address</h2>
                                            <p className="text-xs text-gray-400">Address is locked for payment</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setStep(1)}
                                        className="text-xs font-black text-indigo-600 hover:text-indigo-800 border border-indigo-200 px-4 py-1.5 rounded-xl transition-all"
                                    >
                                        Edit
                                    </button>
                                </div>
                                <div className="p-8">
                                    <div className="bg-gray-50 rounded-2xl p-5 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <FaUser className="text-gray-400 text-xs" />
                                            <span className="font-black text-gray-800">{address.fullName}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FaPhone className="text-gray-400 text-xs" />
                                            <span className="text-gray-600 font-medium">+91 {address.phone}</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <FaMapMarkerAlt className="text-gray-400 text-xs mt-1" />
                                            <span className="text-gray-600 font-medium">
                                                {address.addressLine1}
                                                {address.addressLine2 && `, ${address.addressLine2}`}
                                                , {address.city}, {address.state} — {address.pincode}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
                            <div className="px-6 py-5 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-orange-100 rounded-2xl flex items-center justify-center">
                                        <FaShoppingBag className="text-orange-600 text-sm" />
                                    </div>
                                    <h2 className="font-black text-gray-800">Order Summary</h2>
                                </div>
                            </div>

                            {/* Items */}
                            <div className="px-6 py-4 space-y-3 max-h-64 overflow-y-auto">
                                {selectedItems.map((item, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                                            {(item.finalImageUrl || item.finalDesignUrl)
                                                ? <img src={item.finalImageUrl || item.finalDesignUrl} alt="" className="w-full h-full object-contain" />
                                                : <div className="w-full h-full flex items-center justify-center"><FaBox className="text-gray-400" /></div>
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-gray-800 truncate">
                                                {item.template?.name || 'Custom Product'}
                                            </p>
                                            <p className="text-xs text-gray-400">Qty: {item.quantity || 1}</p>
                                        </div>
                                        <span className="text-sm font-black text-gray-700">
                                            ₹{(item.price * (item.quantity || 1)).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Price Breakdown */}
                            <div className="border-t border-gray-100 px-6 py-5 space-y-3 bg-slate-50/50">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 font-medium">
                                        <FaShoppingBag className="inline mr-1.5 text-indigo-400/50" />
                                        Product Cost
                                    </span>
                                    <span className="font-bold text-gray-700">₹{subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 font-medium">
                                        <FaBox className="inline mr-1.5 text-orange-400/50" />
                                        Packing Charges
                                    </span>
                                    <span className={`font-bold ${packingChargesTotal > 0 ? 'text-gray-700' : 'text-gray-300'}`}>
                                        ₹{packingChargesTotal.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 font-medium">
                                        <FaTruck className="inline mr-1.5 text-blue-400/50" />
                                        Shipping Fee
                                    </span>
                                    <span className={`font-bold ${shippingChargesTotal === 0 ? 'text-green-600' : 'text-gray-700'}`}>
                                        {shippingChargesTotal === 0 ? 'FREE' : `₹${shippingChargesTotal.toLocaleString()}`}
                                    </span>
                                </div>
                                <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                                    <span className="font-black text-gray-800 text-base">Total</span>
                                    <span className="text-2xl font-black text-indigo-700">
                                        ₹{totalPrice.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {/* Pay Now CTA */}
                            <div className="px-6 pb-6">
                                {step === 2 ? (
                                    <button
                                        onClick={handlePayNow}
                                        disabled={paymentLoading}
                                        className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl
                                            ${paymentLoading
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-indigo-300 active:scale-95'
                                            }`}
                                    >
                                        {paymentLoading
                                            ? <span className="flex items-center justify-center gap-2">
                                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                                Processing...
                                            </span>
                                            : <span className="flex items-center justify-center gap-2">
                                                <FaLock />
                                                Pay ₹{totalPrice.toLocaleString()} Now
                                            </span>
                                        }
                                    </button>
                                ) : (
                                    <div className="w-full py-4 rounded-2xl bg-gray-100 text-gray-400 font-black text-sm text-center">
                                        Complete address to pay
                                    </div>
                                )}

                                <div className="flex items-center gap-2 mt-4 justify-center">
                                    <FaLock className="text-gray-400 text-xs" />
                                    <span className="text-[11px] text-gray-400 font-medium">
                                        256-bit SSL Secured by Razorpay
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Checkout;
