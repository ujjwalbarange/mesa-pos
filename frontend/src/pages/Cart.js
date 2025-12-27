import React, { useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';

const Cart = () => {
    const [cartItems] = useState(JSON.parse(localStorage.getItem('cart')) || []);
    const [phone, setPhone] = useState(""); // Simple state for phone number
    const [instructions, setInstructions] = useState("");
    const [spotifyLink, setSpotifyLink] = useState("");
    
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const tableNum = queryParams.get('table') || "Unknown";

    const calculateTotal = () => cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);

    const placeOrder = async () => {
        // Validation: Ensure phone number is exactly 10 digits
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phone)) {
            alert("Please enter a valid 10-digit phone number.");
            return;
        }

        const payload = {
            table_number: tableNum,
            items: cartItems,
            total_amount: calculateTotal(),
            instructions: instructions,
            spotify_link: spotifyLink,
            customer_phone: phone // Sending the textbox value
        };

        try {
            const res = await axios.post('/api/orders', payload);
            if (res.status === 200) {
                alert("Order Placed Successfully!");
                localStorage.removeItem('cart');
                navigate(`/status?orderId=${res.data.order_id}`);
            }
        } catch (err) {
            alert("Error placing order. Please try again.");
        }
    };

    return (
        <div className="cart-container">
            <h2>Order Review - Table {tableNum}</h2>

            {/* Phone Number Input Section */}
            <div className="input-section">
                <label>Mobile Number (Required)</label>
                <input 
                    type="tel" 
                    placeholder="Enter 10-digit phone no." 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength="10"
                    className="phone-input"
                />
            </div>

            <div className="order-details">
                <textarea 
                    placeholder="Instructions (e.g. Extra spicy)" 
                    onChange={(e) => setInstructions(e.target.value)}
                />
                <input 
                    type="text" 
                    placeholder="Spotify Link (Optional)" 
                    onChange={(e) => setSpotifyLink(e.target.value)}
                />
            </div>

            <div className="cart-footer">
                <h3>Total: ₹{calculateTotal()}</h3>
                <button 
                    className="place-order-btn" 
                    onClick={placeOrder}
                    disabled={phone.length < 10 || cartItems.length === 0}
                >
                    PLACE ORDER
                </button>
            </div>
        </div>
    );
};

export default Cart;

