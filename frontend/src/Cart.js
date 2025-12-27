import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/Cart.css';

const Cart = () => {
    const [cartItems, setCartItems] = useState(JSON.parse(localStorage.getItem('cart')) || []);
    const [userPhone, setUserPhone] = useState(null);
    const [instructions, setInstructions] = useState("");
    const [spotifyLink, setSpotifyLink] = useState("");
    
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const tableNum = queryParams.get('table') || "Unknown";

    // 1. Check if user is logged in via Google on mount
    useEffect(() => {
        axios.get('/api/auth/status')
            .then(res => {
                if (res.data.phone) setUserPhone(res.data.phone);
            })
            .catch(err => console.error("Auth check failed"));
    }, []);

    const calculateTotal = () => cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);

    const handleLogin = () => {
        // Redirect to your Flask Google Login route
        const currentPath = window.location.pathname + window.location.search;
        window.location.href = `/api/auth/login?next=${encodeURIComponent(currentPath)}`;
    };

    const placeOrder = async () => {
        if (!userPhone) {
            alert("Please Sign in with Google first!");
            return;
        }

        const payload = {
            table_number: tableNum,
            items: cartItems,
            total_amount: calculateTotal(),
            instructions: instructions,
            spotify_link: spotifyLink,
            customer_phone: userPhone // Added from OAuth session
        };

        try {
            const res = await axios.post('/api/orders', payload);
            if (res.status === 200) {
                alert("Order Placed Successfully!");
                localStorage.removeItem('cart');
                navigate(`/status?orderId=${res.data.order_id}`);
            }
        } catch (err) {
            alert("Failed to place order. Try again.");
        }
    };

    return (
        <div className="cart-container">
            <h2>Your Order - Table {tableNum}</h2>
            
            <div className="cart-items">
                {cartItems.map(item => (
                    <div key={item.item_id} className="cart-item">
                        <span>{item.name} x {item.qty}</span>
                        <span>₹{item.price * item.qty}</span>
                    </div>
                ))}
            </div>

            <div className="order-details">
                <textarea 
                    placeholder="Any special instructions? (e.g. No onion)" 
                    onChange={(e) => setInstructions(e.target.value)}
                />
                <input 
                    type="text" 
                    placeholder="Your Spotify Song Link" 
                    onChange={(e) => setSpotifyLink(e.target.value)}
                />
            </div>

            <div className="auth-section">
                {userPhone ? (
                    <p className="logged-in-msg">✅ Verified: {userPhone}</p>
                ) : (
                    <button className="google-btn" onClick={handleLogin}>
                        Sign in with Google to Order
                    </button>
                )}
            </div>

            <div className="cart-footer">
                <h3>Total: ₹{calculateTotal()}</h3>
                <button 
                    className="place-order-btn" 
                    onClick={placeOrder}
                    disabled={!userPhone || cartItems.length === 0}
                >
                    Confirm & Place Order
                </button>
            </div>
        </div>
    );
};

export default Cart;
                               
