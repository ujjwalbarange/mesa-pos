import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import '../styles/Status.css';

const Status = () => {
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const orderId = queryParams.get('orderId');

    useEffect(() => {
        if (!orderId) return;

        // Function to fetch status
        const fetchStatus = async () => {
            try {
                const res = await axios.get(`/api/order-status/${orderId}`);
                setOrder(res.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching status:", err);
            }
        };

        // Initial fetch
        fetchStatus();

        // Check every 10 seconds (Live Update)
        const interval = setInterval(fetchStatus, 10000);

        return () => clearInterval(interval); // Cleanup on close
    }, [orderId]);

    if (loading) return <div className="loader">Checking your order status...</div>;
    if (!order) return <div className="error">Order not found.</div>;

    const getStatusClass = (status) => {
        if (status === 'Ready') return 'status-ready';
        if (status === 'Preparing') return 'status-preparing';
        return 'status-queue';
    };

    return (
        <div className="status-container">
            <div className={`status-card ${getStatusClass(order.status)}`}>
                <h1>Order #{orderId}</h1>
                <div className="status-badge">{order.status}</div>
                
                <div className="progress-bar-container">
                    <div className="progress-fill" style={{ 
                        width: order.status === 'In Queue' ? '33%' : 
                               order.status === 'Preparing' ? '66%' : '100%' 
                    }}></div>
                </div>

                <p className="status-msg">
                    {order.status === 'In Queue' && "We've received your order! Waiting for the chef."}
                    {order.status === 'Preparing' && "Chef is working on your delicious meal!"}
                    {order.status === 'Ready' && "🔥 It's Hot! Please collect your order from the counter."}
                </p>
            </div>

            <div className="order-summary">
                <h3>Table: {order.table_number}</h3>
                <p>Phone: {order.customer_phone}</p>
                <button onClick={() => window.location.href='/menu'}>Order More Items</button>
            </div>
        </div>
    );
};

export default Status;
                  
