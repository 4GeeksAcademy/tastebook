"""
Messaging routes for TasteBook API.
Handles chat and direct messaging functionality.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

from api.models import db, User, Chat, Message
from api.websocket_events import emit_new_message, emit_messages_read, emit_chat_deleted

# Create messaging blueprint
messaging_bp = Blueprint('messaging', __name__)


############################################
#######       GET ALL USER CHATS     #######
############################################
@messaging_bp.route('/chats', methods=['GET'])
@jwt_required()
def get_user_chats():
    """Get all chats for the current user with latest message info and unread counts."""
    
    try:
        current_user_id = int(get_jwt_identity())
        
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Get all chats for the user (both as user1 and user2)
        all_chats = user.get_all_chats()
        
        # Sort by updated_at (most recent first)
        all_chats.sort(key=lambda c: c.updated_at, reverse=True)
        
        serialized_chats = [chat.serialize(current_user_id=current_user_id) for chat in all_chats]
        total_unread = user.get_total_unread_messages()
        
        return jsonify({
            "chats": serialized_chats,
            "total_unread": total_unread
        }), 200
        
    except Exception as e:
        print(f"[ERROR] Failed to retrieve chats: {str(e)}")
        return jsonify({"error": "Failed to retrieve chats"}), 500


############################################
#######      GET OR CREATE CHAT      #######
############################################
@messaging_bp.route('/chat/with/<int:other_user_id>', methods=['GET'])
@jwt_required()
def get_or_create_chat(other_user_id):
    """Get existing chat with another user or create one if it doesn't exist."""
    
    try:
        current_user_id = int(get_jwt_identity())
        
        if current_user_id == other_user_id:
            return jsonify({"error": "Cannot create chat with yourself"}), 400
        
        # Check if users exist
        current_user = User.query.get(current_user_id)
        other_user = User.query.get(other_user_id)
        
        if not current_user or not other_user:
            return jsonify({"error": "User not found"}), 404
        
        # Try to find existing chat
        existing_chat = current_user.get_chat_with_user(other_user_id)
        
        if existing_chat:
            return jsonify({
                "msg": "Chat already exists",
                "chat": existing_chat.serialize(current_user_id=current_user_id, include_messages=True)
            }), 200
        
        # Create new chat if none exists
        # Always put the smaller user ID as user1 to maintain consistency
        user1_id = min(current_user_id, other_user_id)
        user2_id = max(current_user_id, other_user_id)
        
        new_chat = Chat(
            user1_id=user1_id,
            user2_id=user2_id
        )
        
        db.session.add(new_chat)
        db.session.commit()
        
        return jsonify({
            "msg": "Chat created successfully",
            "chat": new_chat.serialize(current_user_id=current_user_id, include_messages=True)
        }), 201
        
    except Exception as e:
        print(f"[ERROR] Failed to create or get chat: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Error creating or getting chat"}), 500


############################################
#######      GET SINGLE CHAT         #######
############################################
@messaging_bp.route('/chat/<int:chat_id>', methods=['GET'])
@jwt_required()
def get_chat(chat_id):
    """Get a specific chat with all its messages."""
    
    try:
        current_user_id = int(get_jwt_identity())
        
        chat = Chat.query.get(chat_id)
        if not chat:
            return jsonify({"error": "Chat not found"}), 404
        
        # Verify user is a participant in this chat
        if not chat.is_participant(current_user_id):
            return jsonify({"error": "Access denied"}), 403
        
        return jsonify({
            "chat": chat.serialize(current_user_id=current_user_id, include_messages=True)
        }), 200
        
    except Exception as e:
        print(f"[ERROR] Failed to retrieve chat: {str(e)}")
        return jsonify({"error": "Failed to retrieve chat"}), 500


############################################
#######       SEND MESSAGE           #######
############################################
""" JSON request body to send a message:
{
    "content": "Hello! How are you doing?"
}
"""
@messaging_bp.route('/chat/<int:chat_id>/message', methods=['POST'])
@jwt_required()
def send_message(chat_id):
    """Send a new message in a chat."""
    
    try:
        current_user_id = int(get_jwt_identity())
        
        data = request.get_json()
        if not data or 'content' not in data:
            return jsonify({"error": "Message content is required"}), 400
        
        content = data.get('content', '').strip()
        if not content:
            return jsonify({"error": "Message content cannot be empty"}), 400
        
        # Add reasonable content length limit
        if len(content) > 2000:
            return jsonify({"error": "Message content too long (max 2000 characters)"}), 400
        
        chat = Chat.query.get(chat_id)
        if not chat:
            return jsonify({"error": "Chat not found"}), 404
        
        # Verify user is a participant in this chat
        if not chat.is_participant(current_user_id):
            return jsonify({"error": "Access denied"}), 403
        
        # Create new message
        new_message = Message(
            chat_id=chat_id,
            sender_id=current_user_id,
            content=content
        )
        
        db.session.add(new_message)
        
        # Update chat's updated_at timestamp
        chat.updated_at = datetime.now()
        
        db.session.commit()
        
        serialized_message = new_message.serialize()
        
        # Emit WebSocket event to notify other users in the chat
        emit_new_message(chat_id, serialized_message)
        
        return jsonify({
            "message": serialized_message
        }), 201
        
    except Exception as e:
        print(f"[ERROR] Failed to send message: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Failed to send message"}), 500


############################################
#######      MARK MESSAGES AS READ   #######
############################################
@messaging_bp.route('/chat/<int:chat_id>/mark-read', methods=['PUT'])
@jwt_required()
def mark_messages_as_read(chat_id):
    """Mark all unread messages in a chat as read for the current user."""
    
    try:
        current_user_id = int(get_jwt_identity())
        
        chat = Chat.query.get(chat_id)
        if not chat:
            return jsonify({"error": "Chat not found"}), 404
        
        # Verify user is a participant in this chat
        if not chat.is_participant(current_user_id):
            return jsonify({"error": "Access denied"}), 403
        
        # Find all unread messages in this chat that were not sent by current user
        unread_messages = Message.query.filter(
            Message.chat_id == chat_id,
            Message.sender_id != current_user_id,
            Message.is_read == False
        ).all()
        
        # Mark all as read
        for message in unread_messages:
            message.is_read = True
            
        db.session.commit()

        # Emit messages read event
        emit_messages_read(chat_id, current_user_id)
        
        return jsonify({"msg": f"All messages in chat {chat_id} marked as read"}), 200
        
    except Exception as e:
        print(f"[ERROR] Failed to mark messages as read: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Failed to mark messages as read"}), 500


############################################
#######      UPDATE MESSAGE          #######
############################################
""" JSON request body to update a message:
{
    "content": "Updated message content here"
}
"""
@messaging_bp.route('/message/<int:message_id>', methods=['PUT'])
@jwt_required()
def update_message(message_id):
    """Update a message (only the sender can edit their own messages)."""
    
    try:
        current_user_id = int(get_jwt_identity())
        data = request.get_json()
        
        if not data or 'content' not in data:
            return jsonify({"error": "Message content is required"}), 400
        
        content = data.get('content', '').strip()
        if not content:
            return jsonify({"error": "Message content cannot be empty"}), 400
        
        # Add reasonable content length limit
        if len(content) > 2000:
            return jsonify({"error": "Message content too long (max 2000 characters)"}), 400
        
        message = Message.query.get(message_id)
        if not message:
            return jsonify({"error": "Message not found"}), 404
        
        # Only the sender can edit their message
        if message.sender_id != current_user_id:
            return jsonify({"error": "You can only edit your own messages"}), 403
        
        # Update message content
        message.content = content
        message.mark_as_edited()
        
        db.session.commit()
        
        return jsonify({
            "message": message.serialize()
        }), 200
        
    except Exception as e:
        print(f"[ERROR] Failed to update message: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Failed to update message"}), 500


############################################
#######      DELETE MESSAGE          #######
############################################
@messaging_bp.route('/message/<int:message_id>', methods=['DELETE'])
@jwt_required()
def delete_message(message_id):
    """Delete a message (only the sender can delete their own messages)."""
    
    try:
        current_user_id = int(get_jwt_identity())
        
        message = Message.query.get(message_id)
        if not message:
            return jsonify({"error": "Message not found"}), 404
        
        # Only the sender can delete their message
        if message.sender_id != current_user_id:
            return jsonify({"error": "You can only delete your own messages"}), 403
        
        db.session.delete(message)
        db.session.commit()
        
        return jsonify({"message": "Message deleted successfully"}), 200
        
    except Exception as e:
        print(f"[ERROR] Failed to delete message: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Failed to delete message"}), 500


############################################
#######   GET UNREAD MESSAGE COUNT   #######
############################################
@messaging_bp.route('/messages/unread-count', methods=['GET'])
@jwt_required()
def get_unread_message_count():
    """Get the total count of unread messages for the current user."""
    
    try:
        current_user_id = int(get_jwt_identity())
        
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        total_unread = user.get_total_unread_messages()
        
        return jsonify({
            "unread_count": total_unread
        }), 200
        
    except Exception as e:
        print(f"[ERROR] Failed to get unread message count: {str(e)}")
        return jsonify({"error": "Failed to get unread message count"}), 500


############################################
#######      DELETE CHAT             #######
############################################
@messaging_bp.route('/chat/<int:chat_id>', methods=['DELETE'])
@jwt_required()
def delete_chat(chat_id):
    """Delete a chat (only participants can delete)."""
    
    try:
        current_user_id = int(get_jwt_identity())
        
        chat = Chat.query.get(chat_id)
        if not chat:
            return jsonify({"error": "Chat not found"}), 404
        
        # Verify user is a participant in this chat
        if not chat.is_participant(current_user_id):
            return jsonify({"error": "Access denied"}), 403
        
        db.session.delete(chat)
        db.session.commit()
        
        # Emit WebSocket event to notify other users that the chat has been deleted
        emit_chat_deleted(chat_id, current_user_id)
        
        return jsonify({"message": "Chat deleted successfully"}), 200
        
    except Exception as e:
        print(f"[ERROR] Failed to delete chat: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Failed to delete chat"}), 500