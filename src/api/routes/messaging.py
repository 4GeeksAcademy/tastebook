"""
Messaging routes for TasteBook API.
Handles chat and direct messaging functionality.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

from sqlalchemy import and_, or_

from api.models import db, User, Chat, Message

from api.websocket_events import emit_new_message, emit_messages_read, emit_chat_deleted


messaging_bp = Blueprint('messaging', __name__)



#################################################################
#################################################################
#############                                       #############
#############                CHATS                  #############
#############                                       #############
#################################################################
#################################################################


############################################
#######      GET OR CREATE CHAT      #######
############################################
@messaging_bp.route('/chat/with/<int:other_user_id>', methods=['GET'])
@jwt_required()
def get_or_create_chat(other_user_id):
    """Get existing chat with another user or create one if it doesn't exist - OPTIMIZED."""
    
    try:
        current_user_id = int(get_jwt_identity())
        
        if current_user_id == other_user_id:
            return jsonify({"error": "Cannot create chat with yourself"}), 400
        
        # Check if users exist (batch query)
        user_ids          = [current_user_id, other_user_id]
        existing_users    = User.query.filter(User.id.in_(user_ids)).all()
        existing_user_ids = {user.id for user in existing_users}
        
        if len(existing_user_ids) != 2:
            return jsonify({"error": "User not found"}), 404
        
        # Try to find existing chat efficiently
        from sqlalchemy import and_, or_
        existing_chat = Chat.query.filter(
            or_(
                and_(Chat.user1_id == current_user_id, Chat.user2_id == other_user_id),
                and_(Chat.user1_id == other_user_id,   Chat.user2_id == current_user_id)
            )
        ).first()
        
        if existing_chat:
            # Use optimized method to get chat data with messages
            chat_data = Chat.get_optimized_chat_data(
                chat_id          = existing_chat.id,
                current_user_id  = current_user_id,
                include_messages = True
            )
            
            return jsonify({
                "msg": "Chat already exists",
                "chat": chat_data
            }), 200
        
        # Create new chat if none exists
        # Always put the smaller user ID as user1 to maintain consistency
        user1_id = min(current_user_id, other_user_id)
        user2_id = max(current_user_id, other_user_id)
        
        new_chat = Chat(
            user1_id = user1_id,
            user2_id = user2_id
        )
        
        db.session.add(new_chat)
        db.session.commit()
        
        # Get optimized chat data for new chat
        chat_data = Chat.get_optimized_chat_data(
            chat_id          = new_chat.id,
            current_user_id  = current_user_id,
            include_messages = True
        )
        
        return jsonify({
            "msg": "Chat created successfully",
            "chat": chat_data
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
    """Get a specific chat with paginated messages - OPTIMIZED."""
    
    try:
        current_user_id = int(get_jwt_identity())
        
        # Get pagination parameters
        page          =     request.args.get('page',             1, type=int)
        per_page      = min(request.args.get('per_page',         50, type=int), 100)  # Max 100 messages per page
        load_messages =     request.args.get('include_messages', 'true').lower() == 'true'
        
        if not load_messages:
            # Just get chat metadata (for initial chat list loading)
            chat_data = Chat.get_optimized_chat_data(
                chat_id          = chat_id,
                current_user_id  = current_user_id,
                include_messages = False
            )
        else:
            # Get chat with paginated messages
            chat_data = Chat.get_optimized_chat_data_paginated(
                chat_id         = chat_id,
                current_user_id = current_user_id,
                page            = page,
                per_page        = per_page
            )
        
        if not chat_data:
            return jsonify({"error": "Chat not found or access denied"}), 404
        
        return jsonify({
            "chat": chat_data
        }), 200
        
    except Exception as e:
        print(f"[ERROR] Failed to retrieve chat: {str(e)}")
        return jsonify({"error": "Failed to retrieve chat"}), 500



############################################
#######    GET CHAT METADATA ONLY    #######
############################################
@messaging_bp.route('/chats/metadata', methods=['GET'])
@jwt_required()
def get_chat_metadata():
    """Get chat metadata without messages for fast initial loading."""
    
    try:
        current_user_id = int(get_jwt_identity())
        
        # Get lightweight chat data (no messages)
        chat_rows = Chat.get_optimized_chat_list(current_user_id)
        
        # Get participant info in batch
        participant_ids = [row.other_participant_id for row in chat_rows if row.other_participant_id]
        participants = {}
        if participant_ids:
            participants = {u.id: u for u in User.query.filter(User.id.in_(participant_ids)).all()}
        
        # Build lightweight response
        chats = []
        total_unread = 0
        
        for row in chat_rows:
            participant = participants.get(row.other_participant_id)
            
            chat_data = {
                "chat_id": row.chat_id,
                "participant": {
                    "user_id":        participant.id             if participant else None,
                    "username":       participant.username       if participant else None,
                    "full_name":      participant.full_name      if participant else None,
                    "cloudinary_url": participant.cloudinary_url if participant else None
                } if participant else None,
                "unread_count":  row.unread_count or 0,
                "last_activity": row.last_msg_timestamp.isoformat() if row.last_msg_timestamp else row.created_at.isoformat()
            }
            
            chats.append(chat_data)
            total_unread += (row.unread_count or 0)
        
        return jsonify({
            "chats":        chats,
            "total_unread": total_unread
        }), 200
        
    except Exception as e:
        print(f"[ERROR] Failed to retrieve chat metadata: {str(e)}")
        return jsonify({"error": "Failed to retrieve chat metadata"}), 500



############################################
#######      GET ALL USER CHATS      #######
############################################
@messaging_bp.route('/chats', methods=['GET'])
@jwt_required()
def get_user_chats():
    """Get all chats for the current user with latest message info and unread counts - OPTIMIZED with pagination."""
    
    try:
        current_user_id = int(get_jwt_identity())
        
        # Check if user exists
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Get pagination parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 50)  # Max 50 chats per page
        
        # Use optimized query to get all chat data in minimal DB calls
        chat_rows = Chat.get_optimized_chat_list_paginated(current_user_id, page, per_page)
        
        if not chat_rows['chats']:
            return jsonify({
                "chats":        [],
                "total_unread": 0,
                "pagination":   {
                    "current_page": page,
                    "per_page":     per_page,
                    "total_pages":  0,
                    "total_chats":  0,
                    "has_next":     False,
                    "has_prev":     False
                }
            }), 200
        
        # Get participant info in batch (single query for all participants)
        participant_ids = [row.other_participant_id for row in chat_rows['chats'] if row.other_participant_id]
        participants    = {}
        if participant_ids:
            participants = {u.id: u for u in User.query.filter(User.id.in_(participant_ids)).all()}
        
        # Build response from query results (no additional DB calls)
        chats        = []
        total_unread = 0
        
        for row in chat_rows['chats']:
            participant = participants.get(row.other_participant_id)
            
            chat_data = {
                "chat_id":    row.chat_id,
                "created_at": row.created_at.isoformat() if row.created_at else None,
                "updated_at": row.updated_at.isoformat() if row.updated_at else None,
                "participant": {
                    "user_id":        participant.id             if participant else None,
                    "username":       participant.username       if participant else None,
                    "full_name":      participant.full_name      if participant else None,
                    "cloudinary_url": participant.cloudinary_url if participant else None
                } if participant else None,
                "last_message": {
                    "content":    row.last_msg_content,
                    "created_at": row.last_msg_timestamp.isoformat() if row.last_msg_timestamp else None
                } if row.last_msg_content else None,
                "unread_count": row.unread_count or 0
            }
            
            chats.append(chat_data)
            total_unread += (row.unread_count or 0)
        
        return jsonify({
            "chats":        chats,
            "total_unread": chat_rows['total_unread'],  # This comes from all chats, not just current page
            "pagination":   chat_rows['pagination']
        }), 200
        
    except Exception as e:
        print(f"[ERROR] Failed to retrieve chats: {str(e)}")
        return jsonify({"error": "Failed to retrieve chats"}), 500



############################################
#######         DELETE CHAT          #######
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



# --------------------------------------------------------------------------------------------------



#################################################################
#################################################################
#############                                       #############
#############               MESSAGES                #############
#############                                       #############
#################################################################
#################################################################


############################################
#######    GET MESSAGES BY RANGE     #######
############################################
@messaging_bp.route('/chat/<int:chat_id>/messages', methods=['GET'])
@jwt_required()
def get_chat_messages(chat_id):
    """Get messages from a chat with flexible loading options for infinite scroll."""
    
    try:
        current_user_id = int(get_jwt_identity())
        
        # Verify chat exists and user has access
        from sqlalchemy import and_, or_, desc, asc
        chat = Chat.query.filter(
            and_(
                Chat.id == chat_id,
                or_(Chat.user1_id == current_user_id, Chat.user2_id == current_user_id)
            )
        ).first()
        
        if not chat:
            return jsonify({"error": "Chat not found or access denied"}), 404
        
        # Get query parameters
        limit     = min(request.args.get('limit', 50, type=int), 100)  # Max 100 messages
        before_id =     request.args.get('before_id', type=int)        # For loading older messages
        after_id  =     request.args.get('after_id',  type=int)        # For loading newer messages
        
        # Build query
        query = (
            db.session.query(Message)
            .options(db.joinedload(Message.sender))
            .filter(Message.chat_id == chat_id)
        )
        
        # Apply range filters
        if before_id:
            # Loading older messages (for infinite scroll up)
            query = query.filter(Message.id < before_id).order_by(desc(Message.created_at))
        elif after_id:
            # Loading newer messages (for real-time updates)
            query = query.filter(Message.id > after_id).order_by(asc(Message.created_at))
        else:
            # Loading most recent messages (default)
            query = query.order_by(desc(Message.created_at))
        
        messages = query.limit(limit).all()
        
        # For before_id queries, reverse to maintain chronological order
        if before_id:
            messages = list(reversed(messages))
        
        # Get additional metadata
        total_count = db.session.query(Message).filter(Message.chat_id == chat_id).count()
        
        return jsonify({
            "messages": [msg.serialize() for msg in messages],
            "metadata": {
                "total_count":  total_count,
                "loaded_count": len(messages),
                "has_older":    bool(before_id and len(messages) == limit),
                "has_newer":    bool(after_id and len(messages) == limit),
                "oldest_id":    messages[0].id if messages else None,
                "newest_id":    messages[-1].id if messages else None
            }
        }), 200
        
    except Exception as e:
        print(f"[ERROR] Failed to retrieve messages: {str(e)}")
        return jsonify({"error": "Failed to retrieve messages"}), 500



############################################
#######        SEND MESSAGE          #######
############################################
""" JSON request body to send a message:
{
    "content": "Hello! How are you doing?"
}
"""
@messaging_bp.route('/chat/<int:chat_id>/message', methods=['POST'])
@jwt_required()
def send_message(chat_id):
    """Send a new message in a chat - OPTIMIZED."""
    
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
        
        # Get chat and verify permission in single query with user preloaded
        from sqlalchemy import and_, or_
        chat = Chat.query.options(
            db.joinedload(Chat.user1),
            db.joinedload(Chat.user2)
        ).filter(
            and_(
                Chat.id == chat_id,
                or_(Chat.user1_id == current_user_id, Chat.user2_id == current_user_id)
            )
        ).first()
        
        if not chat:
            return jsonify({"error": "Chat not found or access denied"}), 404
        
        # Create new message
        new_message = Message(
            chat_id   = chat_id,
            sender_id = current_user_id,
            content   = content
        )
        
        db.session.add(new_message)
        
        # Update chat's updated_at timestamp
        chat.updated_at = datetime.now()
        
        db.session.commit()
        
        # Refresh message to get ID and preload sender info for serialization
        db.session.refresh(new_message)
        
        # Get sender info for serialization (from already loaded chat participants)
        sender = chat.user1 if chat.user1_id == current_user_id else chat.user2
        
        # Build serialized message manually to avoid additional query
        serialized_message = {
            "message_id": new_message.id,
            "chat_id":    new_message.chat_id,
            "sender_id":  new_message.sender_id,
            "content":    new_message.content,
            "is_read":    new_message.is_read,
            "is_edited":  new_message.is_edited,
            "created_at": new_message.created_at.isoformat() if new_message.created_at else None,
            "read_at":    new_message.read_at.isoformat()    if new_message.read_at else None,
            "edited_at":  new_message.edited_at.isoformat()  if new_message.edited_at else None,
            "sender": {
                "user_id":        sender.id             if sender else None,
                "username":       sender.username       if sender else None,
                "full_name":      sender.full_name      if sender else None,
                "cloudinary_url": sender.cloudinary_url if sender else None
            } if sender else None
        }
        
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
#######     MARK MESSAGES AS READ    #######
############################################
@messaging_bp.route('/chat/<int:chat_id>/mark-read', methods=['PUT'])
@jwt_required()
def mark_messages_as_read(chat_id):
    """Mark messages in a chat as read for the current user - OPTIMIZED.
    
    Optional JSON body:
    {
        "message_ids": [123, 456, 789]     // Specific message IDs to mark as read
    }
    
    If no message_ids provided, marks ALL unread messages as read.
    """
    
    try:
        current_user_id = int(get_jwt_identity())
        
        # Verify chat exists and user has access in single query
        chat = Chat.query.filter(
            and_(
                Chat.id == chat_id,
                or_(Chat.user1_id == current_user_id, Chat.user2_id == current_user_id)
            )
        ).first()
        
        if not chat:
            return jsonify({"error": "Chat not found or access denied"}), 404
        
        # Get request data (optional)
        data = request.get_json() or {}

        specific_message_ids = data.get('message_ids')
        
        # Build base filter for messages to mark as read
        base_filters = [
            Message.chat_id   == chat_id,
            Message.sender_id != current_user_id,
            Message.is_read   == False
        ]
        
        # If specific message IDs provided, add that filter
        if specific_message_ids:
            base_filters.append(Message.id.in_(specific_message_ids))
        
        # Use bulk update for better performance
        marked_count = db.session.query(Message).filter(
            and_(*base_filters)
        ).update(
            {Message.is_read: True},
            synchronize_session=False
        )
        
        db.session.commit()

        # Get remaining unread count efficiently
        remaining_unread = db.session.query(Message).filter(
            Message.chat_id   == chat_id,
            Message.sender_id != current_user_id,
            Message.is_read   == False
        ).count()

        # Emit messages read event
        emit_messages_read(chat_id, current_user_id)
        
        return jsonify({
            "msg":           f"{marked_count} messages marked as read",
            "marked_count":     marked_count,
            "remaining_unread": remaining_unread
        }), 200
        
    except Exception as e:
        print(f"[ERROR] Failed to mark messages as read: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "Failed to mark messages as read"}), 500



############################################
#######        UPDATE MESSAGE        #######
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
#######        DELETE MESSAGE        #######
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


