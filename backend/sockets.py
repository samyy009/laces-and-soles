import logging
from flask_socketio import emit, join_room
from extensions import socketio, db
from models import Order

logger = logging.getLogger(__name__)

def init_sockets(socketio):
    @socketio.on('join_order_tracking')
    def on_join(data):
        order_id = data.get('order_id')
        if order_id:
            join_room(f"order_{order_id}")
            logger.info(f"User joined tracking room for order {order_id}")

    @socketio.on('update_driver_location')
    def on_location_update(data):
        order_id = data.get('order_id')
        lat = data.get('lat')
        lng = data.get('lng')
        
        if all([order_id, lat, lng]):
            order = db.session.get(Order, order_id)
            if order:
                order.driver_lat = lat
                order.driver_lng = lng
                db.session.commit()
                
                emit('location_broadcast', {
                    'order_id': order_id,
                    'lat': lat,
                    'lng': lng
                }, room=f"order_{order_id}")
