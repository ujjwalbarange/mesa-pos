import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Menu.css';

const Menu = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [cart, setCart] = useState({});
    const [category, setCategory] = useState('All');

    // Fetch menu from your Flask backend
    useEffect(() => {
        axios.get('https://mesa-pos.vercel.app/api/menu')
            .then(res => setMenuItems(res.data))
            .catch(err => console.error("Error fetching menu:", err));
    }, []);

    const addToCart = (item) => {
        setCart(prev => ({
            ...prev,
            [item.item_id]: {
                ...item,
                qty: (prev[item.item_id]?.qty || 0) + 1
            }
        }));
    };

    const categories = ['All', ...new Set(menuItems.map(item => item.category))];

    return (
        <div className="menu-container">
            <header className="menu-header">
                <h1>Mesa POS Menu</h1>
                <div className="category-tabs">
                    {categories.map(cat => (
                        <button 
                            key={cat} 
                            className={category === cat ? 'active' : ''} 
                            onClick={() => setCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </header>

            <div className="items-grid">
                {menuItems
                    .filter(item => category === 'All' || item.category === category)
                    .map(item => (
                        <div key={item.item_id} className="item-card">
                            <div className="item-info">
                                <h3>{item.name} {item.is_veg ? '🟢' : '🔴'}</h3>
                                <p>{item.description}</p>
                                <span className="price">₹{item.price}</span>
                            </div>
                            <button onClick={() => addToCart(item)}>Add +</button>
                        </div>
                    ))}
            </div>

            {Object.keys(cart).length > 0 && (
                <div className="cart-floating-btn" onClick={() => window.location.href='/cart'}>
                    View Cart ({Object.values(cart).reduce((a, b) => a + b.qty, 0)} items)
                </div>
            )}
        </div>
    );
};

export default Menu;
