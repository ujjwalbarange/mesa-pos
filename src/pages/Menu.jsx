import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api'; // The file we created in Step 2
import '../styles/Menu.css'; // Import your existing styles

const Menu = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // State Management
  const [menuCategories, setMenuCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(true);
  const [servicePaused, setServicePaused] = useState(false);
  
  // Get Table Number from URL (default to 'Unknown')
  const tableNumber = searchParams.get('table') || 'Unknown';

  // 1. Load System Status & Menu Data on Mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check System Status first
        const statusRes = await api.get('/api/system-status');
        if (statusRes.data.global_service === 0) {
          setServicePaused(true);
          setLoading(false);
          return;
        }

        // Fetch Menu
        const menuRes = await api.get('/api/menu');
        // The API returns an array of categories. 
        // We set the first category as active by default.
        const data = menuRes.data || [];
        setMenuCategories(data);
        if (data.length > 0) {
          setActiveCategory(data[0].name); // Use name or create a unique ID logic
        }
      } catch (error) {
        console.error("Error loading menu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 2. Load Cart from LocalStorage on Mount
  useEffect(() => {
    const savedCart = localStorage.getItem(`currentCart_${tableNumber}`);
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, [tableNumber]);

  // 3. Save Cart to LocalStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(`currentCart_${tableNumber}`, JSON.stringify(cart));
  }, [cart, tableNumber]);

  // --- Handlers ---

  const handleAddToCart = (item) => {
    setCart((prevCart) => {
      const currentQty = prevCart[item.item_id]?.quantity || 0;
      return {
        ...prevCart,
        [item.item_id]: {
            id: item.item_id,
            name: item.name,
            price: item.price,
            quantity: currentQty + 1
        }
      };
    });
  };

  const handleDecreaseQty = (itemId) => {
    setCart((prevCart) => {
      const currentItem = prevCart[itemId];
      if (!currentItem) return prevCart;

      if (currentItem.quantity > 1) {
        return {
          ...prevCart,
          [itemId]: { ...currentItem, quantity: currentItem.quantity - 1 }
        };
      } else {
        // Remove item if quantity goes to 0
        const newCart = { ...prevCart };
        delete newCart[itemId];
        return newCart;
      }
    });
  };

  // Calculate Totals
  const { totalItems, totalPrice } = useMemo(() => {
    return Object.values(cart).reduce(
      (acc, item) => ({
        totalItems: acc.totalItems + item.quantity,
        totalPrice: acc.totalPrice + (item.price * item.quantity),
      }),
      { totalItems: 0, totalPrice: 0 }
    );
  }, [cart]);

  // --- Render Helpers ---

  if (loading) return <div className="menu-container" style={{padding: '20px'}}>Loading Menu...</div>;

  if (servicePaused) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
        background: 'rgba(255,255,255,0.9)', display: 'flex', flexDirection: 'column', 
        justifyContent: 'center', alignItems: 'center', textAlign: 'center', zIndex: 9999 
      }}>
        <h1 style={{ color: '#d33842', fontSize: '2.5rem' }}>Service Paused</h1>
        <p style={{ fontSize: '1.2rem', color: '#666' }}>We are currently not accepting orders.</p>
      </div>
    );
  }

  // Find the active category object to render its items
  const activeCategoryData = menuCategories.find(cat => cat.name === activeCategory);

  return (
    <div className="menu-container">
      {/* Header Banner - kept simple as per your HTML */}
      <div className="header-banner" style={{ display: 'none' }}> 
        {/* Hidden in your CSS, but keeping logic just in case */}
        <h1>Table {tableNumber}</h1>
      </div>

      {/* --- Sidebar --- */}
      <div className="category-sidebar">
        {menuCategories.map((cat) => (
          <div
            key={cat.name}
            className={`category-item ${activeCategory === cat.name ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.name)}
          >
            {cat.name}
          </div>
        ))}
      </div>

      {/* --- Items Section --- */}
      <div className="menu-items-section">
        {activeCategoryData && (
          <>
            <h2 className="menu-category-header">{activeCategoryData.name}</h2>
            {activeCategoryData.items.map((item) => {
               const qty = cart[item.item_id]?.quantity || 0;
               const isVeg = item.is_veg === 1 || item.is_veg === true;
               const isAvailable = item.availability !== 0;

               return (
                <div className="menu-item" key={item.item_id}>
                  <div className="item-info">
                    <span 
                        className="veg-nonveg-icon" 
                        style={{ borderColor: isVeg ? 'green' : 'red' }}
                    >
                      <span style={{ backgroundColor: isVeg ? 'green' : 'red' }}></span>
                    </span>
                    <div className="item-name">{item.name}</div>
                    <div className="item-price">₹ {item.price}</div>
                    <small className="item-description">{item.description}</small>
                  </div>

                  <div className="add-to-cart-wrapper">
                    {!isAvailable ? (
                        <span style={{color: '#888', fontStyle: 'italic', fontSize: '0.9em'}}>Unavailable</span>
                    ) : qty === 0 ? (
                      <button 
                        className="add-button" 
                        onClick={() => handleAddToCart(item)}
                      >
                        Add
                      </button>
                    ) : (
                      <div className="quantity-controller">
                        <button className="quantity-btn" onClick={() => handleDecreaseQty(item.item_id)}>-</button>
                        <span className="quantity-display">{qty}</span>
                        <button className="quantity-btn" onClick={() => handleAddToCart(item)}>+</button>
                      </div>
                    )}
                  </div>
                </div>
               );
            })}
          </>
        )}
      </div>

      {/* --- Floating Cart Bar --- */}
      <div className="floating-cart-bar">
        <div className="cart-details-display">
          <span className="cart-items-count">{totalItems} Item{totalItems !== 1 && 's'}</span>
          <span className="cart-total-display">₹ {totalPrice.toFixed(0)} Total</span>
        </div>
        <button 
          className="view-cart-button"
          disabled={totalItems === 0}
          style={{ opacity: totalItems > 0 ? 1 : 0.6 }}
          onClick={() => navigate(`/cart?table=${tableNumber}`)}
        >
          {totalItems > 0 ? `View Cart (${totalItems})` : 'Cart Empty'}
        </button>
      </div>
    </div>
  );
};

export default Menu;
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
