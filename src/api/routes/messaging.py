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
        current_user_id = get_jwt_identity()
        print(f"[DEBUG CHATS] ============ Starting get_user_chats ============")
        print(f"[DEBUG CHATS] Current user ID: {current_user_id}")
        
        # Convert to int for consistency
        current_user_id = int(current_user_id)
        print(f"[DEBUG CHATS] Current user ID after conversion: {current_user_id}")
        
        user = User.query.get(current_user_id)
        print(f"[DEBUG CHATS] User found: {user}")
        
        if not user:
            print(f"[DEBUG CHATS] ERROR: User not found")
            return jsonify({"error": "User not found"}), 404
        
        # Get all chats for the user (both as user1 and user2)
        all_chats = user.get_all_chats()
        print(f"[DEBUG CHATS] Total chats found: {len(all_chats)}")
        
        # Include ALL chats, not just those with messages
        chats_with_info = []
        for i, chat in enumerate(all_chats):
            print(f"[DEBUG CHATS] Chat {i}: ID={chat.id}, has_messages={len(chat.messages) > 0}")
            chats_with_info.append(chat)
        
        # Sort by updated_at (most recent first)
        chats_with_info.sort(key=lambda c: c.updated_at, reverse=True)
        print(f"[DEBUG CHATS] Chats after sorting: {len(chats_with_info)}")
        
        print(f"[DEBUG CHATS] Serializing chats...")
        serialized_chats = [chat.serialize(current_user_id=current_user_id) for chat in chats_with_info]
        print(f"[DEBUG CHATS] Serialized {len(serialized_chats)} chats")
        
        total_unread = user.get_total_unread_messages()
        print(f"[DEBUG CHATS] Total unread messages: {total_unread}")
        
        response_data = {
            "chats": serialized_chats,
            "total_unread": total_unread
        }
        print(f"[DEBUG CHATS] Final response: {response_data}")
        
        return jsonify(response_data), 200
        
    except Exception as e:
        print(f"[ERROR CHATS] Exception in get_user_chats: {str(e)}")
        import traceback
        print(f"[ERROR CHATS] Traceback: {traceback.format_exc()}")
        return jsonify({"error": "Failed to retrieve chats", "details": str(e)}), 500


############################################
#######      GET OR CREATE CHAT      #######
############################################
@messaging_bp.route('/chat/with/<int:other_user_id>', methods=['GET'])
@jwt_required()
def get_or_create_chat(other_user_id):
    """Get existing chat with another user or create one if it doesn't exist."""
    
    try:
        current_user_id = get_jwt_identity()
        print(f"[DEBUG CHAT] ============ Starting get_or_create_chat ============")
        print(f"[DEBUG CHAT] JWT Identity: {current_user_id} (type: {type(current_user_id)})")
        print(f"[DEBUG CHAT] Other user ID: {other_user_id} (type: {type(other_user_id)})")
        
        # Convert current_user_id to int for consistency
        current_user_id = int(current_user_id)
        print(f"[DEBUG CHAT] Current user ID after conversion: {current_user_id}")
        
        if current_user_id == other_user_id:
            print(f"[DEBUG CHAT] ERROR: User trying to chat with themselves")
            return jsonify({"error": "Cannot create chat with yourself"}), 400
        
        # Check if users exist
        current_user = User.query.get(current_user_id)
        other_user = User.query.get(other_user_id)
        
        print(f"[DEBUG CHAT] Current user query result: {current_user}")
        print(f"[DEBUG CHAT] Other user query result: {other_user}")
        print(f"[DEBUG CHAT] Current user exists: {current_user is not None}")
        print(f"[DEBUG CHAT] Other user exists: {other_user is not None}")
        
        if current_user:
            print(f"[DEBUG CHAT] Current user details: ID={current_user.id}, username={current_user.username}")
        if other_user:
            print(f"[DEBUG CHAT] Other user details: ID={other_user.id}, username={other_user.username}")
        
        if not current_user or not other_user:
            print(f"[DEBUG CHAT] ERROR: One or both users not found")
            return jsonify({"error": "User not found"}), 404
        
        # Try to find existing chat
        print(f"[DEBUG CHAT] Checking for existing chat...")
        existing_chat = current_user.get_chat_with_user(other_user_id)
        print(f"[DEBUG CHAT] Existing chat result: {existing_chat}")
        print(f"[DEBUG CHAT] Existing chat found: {existing_chat is not None}")
        
        if existing_chat:
            print(f"[DEBUG CHAT] Found existing chat with ID: {existing_chat.id}")
            print(f"[DEBUG CHAT] Chat participants: user1_id={existing_chat.user1_id}, user2_id={existing_chat.user2_id}")
            serialized_chat = existing_chat.serialize(current_user_id=current_user_id, include_messages=True)
            print(f"[DEBUG CHAT] Serialized existing chat: {serialized_chat}")
            return jsonify({
                "msg": "Chat already exists",
                "chat": serialized_chat
            }), 200
        
        # Create new chat if none exists
        # Always put the smaller user ID as user1 to maintain consistency
        user1_id = min(current_user_id, other_user_id)
        user2_id = max(current_user_id, other_user_id)
        
        print(f"[DEBUG CHAT] No existing chat found. Creating new chat...")
        print(f"[DEBUG CHAT] New chat participants: user1_id={user1_id}, user2_id={user2_id}")
        
        new_chat = Chat(
            user1_id=user1_id,
            user2_id=user2_id
        )
        
        print(f"[DEBUG CHAT] Chat object created: {new_chat}")
        print(f"[DEBUG CHAT] Adding to database session...")
        
        db.session.add(new_chat)
        
        print(f"[DEBUG CHAT] Committing to database...")
        db.session.commit()
        
        print(f"[DEBUG CHAT] SUCCESS: New chat created with ID: {new_chat.id}")
        print(f"[DEBUG CHAT] New chat details: user1_id={new_chat.user1_id}, user2_id={new_chat.user2_id}")
        
        serialized_new_chat = new_chat.serialize(current_user_id=current_user_id, include_messages=True)
        print(f"[DEBUG CHAT] Serialized new chat: {serialized_new_chat}")
        
        return jsonify({
            "msg": "Chat created successfully",
            "chat": new_chat.serialize(current_user_id)
        }), 201
        
    except Exception as e:
        print(f"[ERROR CHAT] Exception in get_or_create_chat: {str(e)}")
        print(f"[ERROR CHAT] Exception type: {type(e)}")
        import traceback
        print(f"[ERROR CHAT] Full traceback:")
        print(traceback.format_exc())
        print(f"[DEBUG CHAT] Rolling back database session...")
        db.session.rollback()
        return jsonify({"error": "Error creating or getting chat", "details": str(e)}), 500


############################################
#######      GET SINGLE CHAT         #######
############################################
@messaging_bp.route('/chat/<int:chat_id>', methods=['GET'])
@jwt_required()
def get_chat(chat_id):
    """Get a specific chat with all its messages."""
    
    try:
        current_user_id = get_jwt_identity()
        print(f"[DEBUG GET_CHAT] ============ Starting get_chat ============")
        print(f"[DEBUG GET_CHAT] Chat ID: {chat_id}")
        print(f"[DEBUG GET_CHAT] Current user ID: {current_user_id} (type: {type(current_user_id)})")
        
        # Convert to int for consistency
        current_user_id = int(current_user_id)
        print(f"[DEBUG GET_CHAT] Current user ID after conversion: {current_user_id}")
        
        chat = Chat.query.get(chat_id)
        print(f"[DEBUG GET_CHAT] Chat query result: {chat}")
        
        if not chat:
            print(f"[DEBUG GET_CHAT] ERROR: Chat not found")
            return jsonify({"error": "Chat not found"}), 404
        
        print(f"[DEBUG GET_CHAT] Chat found: ID={chat.id}, user1_id={chat.user1_id}, user2_id={chat.user2_id}")
        
        # Verify user is a participant in this chat
        is_participant_result = chat.is_participant(current_user_id)
        print(f"[DEBUG GET_CHAT] is_participant result: {is_participant_result}")
        
        if not is_participant_result:
            print(f"[DEBUG GET_CHAT] ERROR: Access denied - user {current_user_id} is not a participant")
            return jsonify({"error": "Access denied"}), 403
        
        print(f"[DEBUG GET_CHAT] SUCCESS: User is a participant, serializing chat...")
        serialized_chat = chat.serialize(current_user_id=current_user_id, include_messages=True)
        print(f"[DEBUG GET_CHAT] Serialized chat: {serialized_chat}")
        
        return jsonify({
            "chat": serialized_chat
        }), 200
        
    except Exception as e:
        print(f"[ERROR GET_CHAT] Exception in get_chat: {str(e)}")
        import traceback
        print(f"[ERROR GET_CHAT] Traceback: {traceback.format_exc()}")
        return jsonify({"error": "Failed to retrieve chat", "details": str(e)}), 500


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
        current_user_id = get_jwt_identity()
        print(f"[DEBUG SEND_MSG] ============ Starting send_message ============")
        print(f"[DEBUG SEND_MSG] Chat ID: {chat_id}")
        print(f"[DEBUG SEND_MSG] Current user ID: {current_user_id} (type: {type(current_user_id)})")
        
        # Convert to int for consistency
        current_user_id = int(current_user_id)
        print(f"[DEBUG SEND_MSG] Current user ID after conversion: {current_user_id}")
        
        data = request.get_json()
        print(f"[DEBUG SEND_MSG] Request data: {data}")
        
        if not data or 'content' not in data:
            print(f"[DEBUG SEND_MSG] ERROR: Missing content in request data")
            return jsonify({"error": "Message content is required"}), 400
        
        content = data.get('content', '').strip()
        print(f"[DEBUG SEND_MSG] Message content: '{content}'")
        print(f"[DEBUG SEND_MSG] Content length: {len(content)}")
        
        if not content:
            print(f"[DEBUG SEND_MSG] ERROR: Empty content after strip")
            return jsonify({"error": "Message content cannot be empty"}), 400
        
        chat = Chat.query.get(chat_id)
        print(f"[DEBUG SEND_MSG] Chat query result: {chat}")
        
        if not chat:
            print(f"[DEBUG SEND_MSG] ERROR: Chat not found")
            return jsonify({"error": "Chat not found"}), 404
        
        print(f"[DEBUG SEND_MSG] Chat found: ID={chat.id}, user1_id={chat.user1_id}, user2_id={chat.user2_id}")
        
        # Verify user is a participant in this chat
        is_participant_result = chat.is_participant(current_user_id)
        print(f"[DEBUG SEND_MSG] is_participant result: {is_participant_result}")
        
        if not is_participant_result:
            print(f"[DEBUG SEND_MSG] ERROR: Access denied - user not a participant")
            return jsonify({"error": "Access denied"}), 403
        
        print(f"[DEBUG SEND_MSG] Creating new message...")
        
        # Create new message
        new_message = Message(
            chat_id=chat_id,
            sender_id=current_user_id,
            content=content
        )
        
        print(f"[DEBUG SEND_MSG] Message object created: {new_message}")
        print(f"[DEBUG SEND_MSG] Adding message to session...")
        
        db.session.add(new_message)
        
        print(f"[DEBUG SEND_MSG] Updating chat timestamp...")
        
        # Update chat's updated_at timestamp
        chat.updated_at = datetime.now()
        
        print(f"[DEBUG SEND_MSG] Committing to database...")
        
        db.session.commit()
        
        print(f"[DEBUG SEND_MSG] SUCCESS: Message saved with ID: {new_message.id}")
        print(f"[DEBUG SEND_MSG] Serializing message...")
        
        serialized_message = new_message.serialize()
        print(f"[DEBUG SEND_MSG] Serialized message: {serialized_message}")
        
        # Emit WebSocket event to notify other users in the chat
        print(f"[DEBUG SEND_MSG] Emitting WebSocket event for new message...")
        emit_new_message(chat_id, serialized_message)
        
        return jsonify({
            "message": serialized_message
        }), 201
        
    except Exception as e:
        print(f"[ERROR SEND_MSG] Exception in send_message: {str(e)}")
        print(f"[ERROR SEND_MSG] Exception type: {type(e)}")
        import traceback
        print(f"[ERROR SEND_MSG] Full traceback:")
        print(traceback.format_exc())
        print(f"[DEBUG SEND_MSG] Rolling back database session...")
        db.session.rollback()
        return jsonify({"error": "Failed to send message", "details": str(e)}), 500


############################################
#######      MARK MESSAGES AS READ   #######
############################################
@messaging_bp.route('/chat/<int:chat_id>/mark-read', methods=['PUT'])
@jwt_required()
def mark_messages_as_read(chat_id):
    """Mark all unread messages in a chat as read for the current user."""
    
    try:
        current_user_id = get_jwt_identity()
        print(f"[DEBUG MARK_READ] ============ Starting mark_messages_as_read ============")
        print(f"[DEBUG MARK_READ] Chat ID: {chat_id}")
        print(f"[DEBUG MARK_READ] Current user ID: {current_user_id}")
        
        # Convert to int for consistency
        current_user_id = int(current_user_id)
        print(f"[DEBUG MARK_READ] Current user ID after conversion: {current_user_id}")
        
        chat = Chat.query.get(chat_id)
        print(f"[DEBUG MARK_READ] Chat found: {chat}")
        
        if not chat:
            print(f"[DEBUG MARK_READ] ERROR: Chat not found")
            return jsonify({"error": "Chat not found"}), 404
        
        # Verify user is a participant in this chat
        is_participant_result = chat.is_participant(current_user_id)
        print(f"[DEBUG MARK_READ] is_participant result: {is_participant_result}")
        
        if not is_participant_result:
            print(f"[DEBUG MARK_READ] ERROR: Access denied")
            return jsonify({"error": "Access denied"}), 403
        
        # Find all unread messages in this chat that were not sent by current user
        unread_messages = Message.query.filter(
            Message.chat_id == chat_id,
            Message.sender_id != int(current_user_id),
            Message.is_read == False
        ).all()
        
        print(f"[DEBUG MARK_READ] Found {len(unread_messages)} unread messages")
        for i, msg in enumerate(unread_messages):
            print(f"[DEBUG MARK_READ] Message {i}: ID={msg.id}, sender_id={msg.sender_id}, is_read={msg.is_read}")
        
        # Mark all as read
        for message in unread_messages:
            print(f"[DEBUG MARK_READ] Marking message {message.id} as read")
            message.is_read = True
            
        db.session.commit()

        # Emit messages read event
        emit_messages_read(chat_id, int(current_user_id))
        
        return jsonify({"msg": f"All messages in chat {chat_id} marked as read"}), 200
        
    except Exception as e:
        print(f"[ERROR MARK_READ] Exception in mark_messages_as_read: {str(e)}")
        import traceback
        print(f"[ERROR MARK_READ] Traceback: {traceback.format_exc()}")
        db.session.rollback()
        return jsonify({"error": "Failed to mark messages as read", "details": str(e)}), 500


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
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or 'content' not in data:
            return jsonify({"error": "Message content is required"}), 400
        
        content = data.get('content', '').strip()
        if not content:
            return jsonify({"error": "Message content cannot be empty"}), 400
        
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
        db.session.rollback()
        return jsonify({"error": "Failed to update message", "details": str(e)}), 500


############################################
#######      DELETE MESSAGE          #######
############################################
@messaging_bp.route('/message/<int:message_id>', methods=['DELETE'])
@jwt_required()
def delete_message(message_id):
    """Delete a message (only the sender can delete their own messages)."""
    
    try:
        current_user_id = get_jwt_identity()
        
        message = Message.query.get(message_id)
        if not message:
            return jsonify({"error": "Message not found"}), 404
        
        # Only the sender can delete their message
        if message.sender_id != current_user_id:
            return jsonify({"error": "You can only delete your own messages"}), 403
        
        chat_id = message.chat_id
        
        db.session.delete(message)
        db.session.commit()
        
        return jsonify({"message": "Message deleted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to delete message", "details": str(e)}), 500


############################################
#######   GET UNREAD MESSAGE COUNT   #######
############################################
@messaging_bp.route('/messages/unread-count', methods=['GET'])
@jwt_required()
def get_unread_message_count():
    """Get the total count of unread messages for the current user."""
    
    try:
        current_user_id = get_jwt_identity()
        print(f"[DEBUG UNREAD_COUNT] ============ Starting get_unread_message_count ============")
        print(f"[DEBUG UNREAD_COUNT] Current user ID: {current_user_id}")
        
        # Convert to int for consistency
        current_user_id = int(current_user_id)
        print(f"[DEBUG UNREAD_COUNT] Current user ID after conversion: {current_user_id}")
        
        user = User.query.get(current_user_id)
        print(f"[DEBUG UNREAD_COUNT] User found: {user}")
        
        if not user:
            print(f"[DEBUG UNREAD_COUNT] ERROR: User not found")
            return jsonify({"error": "User not found"}), 404
        
        total_unread = user.get_total_unread_messages()
        print(f"[DEBUG UNREAD_COUNT] Total unread messages: {total_unread}")
        
        return jsonify({
            "unread_count": total_unread
        }), 200
        
    except Exception as e:
        print(f"[ERROR UNREAD_COUNT] Exception in get_unread_message_count: {str(e)}")
        import traceback
        print(f"[ERROR UNREAD_COUNT] Traceback: {traceback.format_exc()}")
        return jsonify({"error": "Failed to get unread message count", "details": str(e)}), 500


############################################
#######      DELETE CHAT             #######
############################################
@messaging_bp.route('/chat/<int:chat_id>', methods=['DELETE'])
@jwt_required()
def delete_chat(chat_id):
    """Delete a chat (only participants can delete)."""
    
    try:
        current_user_id = get_jwt_identity()
        print(f"[DEBUG DELETE_CHAT] ============ Starting delete_chat ============")
        print(f"[DEBUG DELETE_CHAT] Chat ID: {chat_id}")
        print(f"[DEBUG DELETE_CHAT] Current user ID: {current_user_id}")
        
        # Convert to int for consistency
        current_user_id = int(current_user_id)
        print(f"[DEBUG DELETE_CHAT] Current user ID after conversion: {current_user_id}")
        
        chat = Chat.query.get(chat_id)
        print(f"[DEBUG DELETE_CHAT] Chat found: {chat}")
        
        if not chat:
            print(f"[DEBUG DELETE_CHAT] ERROR: Chat not found")
            return jsonify({"error": "Chat not found"}), 404
        
        print(f"[DEBUG DELETE_CHAT] Chat details: ID={chat.id}, user1_id={chat.user1_id}, user2_id={chat.user2_id}")
        
        # Verify user is a participant in this chat
        is_participant_result = chat.is_participant(current_user_id)
        print(f"[DEBUG DELETE_CHAT] is_participant result: {is_participant_result}")
        
        if not is_participant_result:
            print(f"[DEBUG DELETE_CHAT] ERROR: Access denied")
            return jsonify({"error": "Access denied"}), 403
        
        print(f"[DEBUG DELETE_CHAT] Deleting chat from database...")
        db.session.delete(chat)
        
        print(f"[DEBUG DELETE_CHAT] Committing changes...")
        db.session.commit()
        
        print(f"[DEBUG DELETE_CHAT] SUCCESS: Chat deleted successfully")
        
        # Emit WebSocket event to notify other users that the chat has been deleted
        print(f"[DEBUG DELETE_CHAT] Emitting WebSocket event for chat deletion...")
        emit_chat_deleted(chat_id, current_user_id)
        
        return jsonify({"message": "Chat deleted successfully"}), 200
        
    except Exception as e:
        print(f"[ERROR DELETE_CHAT] Exception in delete_chat: {str(e)}")
        import traceback
        print(f"[ERROR DELETE_CHAT] Traceback: {traceback.format_exc()}")
        db.session.rollback()
        return jsonify({"error": "Failed to delete chat", "details": str(e)}), 500