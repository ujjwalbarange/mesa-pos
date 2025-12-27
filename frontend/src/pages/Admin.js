import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Admin.css';
// Note: You can import your Chart.js components for the Stats tab here

const Admin = () => {
    const [activeTab, setActiveTab] = useState('kds');
    const [orders, setOrders] = useState([]);
    const [history, setHistory] = useState([]);
    const [systemFlags, setSystemFlags] = useState({});
    const [menuItems, setMenuItems] = useState([]);

    // 1. Fetch Developer Locks and Data on Load
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Get System Status (Locks)
                const statusRes = await axios.get('/api/system-status');
                setSystemFlags(statusRes.data);

                // Get Active Orders for KDS
                const ordersRes = await axios.get('/api/active-orders');
                setOrders(ordersRes.data);
            } catch (err) {
                console.error("Admin Refresh Failed", err);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 10000); // Auto-refresh KDS
        return () => clearInterval(interval);
    }, []);

    const updateStatus = async (orderId, newStatus) => {
        await axios.put(`/api/orders/${orderId}/status`, { status: newStatus });
        // Refresh orders immediately after update
        const res = await axios.get('/api/active-orders');
        setOrders(res.data);
    };

    const handleTabChange = (tab) => {
        if (tab === 'menu' && systemFlags.menu_management === 0) {
            return alert("Menu Management is locked in this plan.");
        }
        if (tab === 'stats' && systemFlags.sales_stats === 0) {
            return alert("Sales Stats are locked in this plan.");
        }
        setActiveTab(tab);
    };

    return (
        <div className="admin-dashboard">
            <nav className="admin-nav">
                <button 
                    className={activeTab === 'kds' ? 'active' : ''} 
                    onClick={() => handleTabChange('kds')}
                >
                    🍳 Kitchen (KDS)
                </button>
                <button 
                    className={activeTab === 'menu' ? 'active' : ''} 
                    onClick={() => handleTabChange('menu')}
                >
                    {systemFlags.menu_management === 0 ? '🔒' : '📋'} Menu
                </button>
                <button 
                    className={activeTab === 'stats' ? 'active' : ''} 
                    onClick={() => handleTabChange('stats')}
                >
                    {systemFlags.sales_stats === 0 ? '🔒' : '📈'} Stats
                </button>
            </nav>

            <main className="admin-content">
                {activeTab === 'kds' && (
                    <div className="kds-grid">
                        {orders.map(order => (
                            <div key={order.order_id} className={`order-card status-${order.status.toLowerCase()}`}>
                                <h3>Table {order.table_number} <small>#{order.order_id}</small></h3>
                                <p className="phone">📞 {order.customer_phone}</p>
                                <ul className="item-list">
                                    {order.items.map(item => (
                                        <li key={item.id}>{item.quantity}x {item.item_name}</li>
                                    ))}
                                </ul>
                                {order.instructions && <div className="notes">📝 {order.instructions}</div>}
                                <div className="actions">
                                    {order.status === 'In Queue' && (
                                        <button onClick={() => updateStatus(order.order_id, 'Preparing')}>Start Cooking</button>
                                    )}
                                    {order.status === 'Preparing' && (
                                        <button className="ready-btn" onClick={() => updateStatus(order.order_id, 'Ready')}>Mark Ready</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'menu' && (
                    <div className="menu-manager">
                        <h2>Menu Management</h2>
                        {/* Your Menu Table Component goes here */}
                    </div>
                )}

                {activeTab === 'stats' && (
                    <div className="stats-container">
                        <h2>Business Analytics</h2>
                        {/* Your Charts from stats.js go here */}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Admin;
