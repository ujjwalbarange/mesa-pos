import os
import mysql.connector
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Database Configuration (Use Vercel Environment Variables)
def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        port=os.getenv("DB_PORT", 3306)
    )

# --- CUSTOMER ENDPOINTS ---

@app.route('/api/menu', methods=['GET'])
def get_menu():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM menu_items WHERE availability = 1")
    menu = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(menu)

@app.route('/api/orders', methods=['POST'])
def place_order():
    data = request.json
    # data includes: table_number, items, total_amount, instructions, spotify_link, customer_phone
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # 1. Insert into active_orders
        query = """
            INSERT INTO active_orders 
            (table_number, total_amount, status, instructions, spotify_link, customer_phone)
            VALUES (%s, %s, 'In Queue', %s, %s, %s)
        """
        cursor.execute(query, (
            data['table_number'], 
            data['total_amount'], 
            data.get('instructions', ''), 
            data.get('spotify_link', ''),
            data['customer_phone']
        ))
        order_id = cursor.lastrowid

        # 2. Insert individual items
        item_query = """
            INSERT INTO order_items (order_id, item_id, item_name, quantity, price_at_order)
            VALUES (%s, %s, %s, %s, %s)
        """
        for item in data['items']:
            cursor.execute(item_query, (
                order_id, 
                item['item_id'], 
                item['name'], 
                item['qty'], 
                item['price']
            ))

        conn.commit()
        return jsonify({"message": "Order placed", "order_id": order_id}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/order-status/<int:order_id>', methods=['GET'])
def get_status(order_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT status, table_number, customer_phone FROM active_orders WHERE order_id = %s", (order_id,))
    order = cursor.fetchone()
    cursor.close()
    conn.close()
    return jsonify(order) if order else (jsonify({"error": "Not found"}), 404)

# --- ADMIN & SYSTEM ENDPOINTS ---

@app.route('/api/system-status', methods=['GET'])
def get_system_status():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT feature_name, is_active FROM system_settings")
    settings = {row['feature_name']: row['is_active'] for row in cursor.fetchall()}
    cursor.close()
    conn.close()
    return jsonify(settings)

@app.route('/api/active-orders', methods=['GET'])
def get_active_orders():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    # Join items for the KDS view
    cursor.execute("SELECT * FROM active_orders ORDER BY order_time DESC")
    orders = cursor.fetchall()
    
    for order in orders:
        cursor.execute("SELECT * FROM order_items WHERE order_id = %s", (order['order_id'],))
        order['items'] = cursor.fetchall()
        
    cursor.close()
    conn.close()
    return jsonify(orders)

@app.route('/api/orders/<int:order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    new_status = request.json.get('status')
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if new_status == 'Completed':
        # Logic to move to history would go here
        cursor.execute("INSERT INTO order_history SELECT * FROM active_orders WHERE order_id = %s", (order_id,))
        cursor.execute("DELETE FROM active_orders WHERE order_id = %s", (order_id,))
    else:
        cursor.execute("UPDATE active_orders SET status = %s WHERE order_id = %s", (new_status, order_id))
    
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"success": True})

if __name__ == '__main__':
    app.run(debug=True)
  
