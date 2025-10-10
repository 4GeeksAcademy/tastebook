from __future__ import annotations ## to allow forward references and then append Collection and CollectionRecipe models at the end of the file with relationships and serializations

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Boolean, DateTime, Date, ForeignKey, Integer, String, Text, JSON, func, UniqueConstraint, CheckConstraint, select, Index, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
# from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.ext.hybrid import hybrid_property


from datetime import datetime, date
from typing import List, Optional, Dict, Any



#########################################################################################
#########################################################################################
#############                       DATABASE TABLES                         #############
#############                          TasteBook                            #############
#############                           Database                            #############
#############                       with SQL Alchemy                        #############
#########################################################################################
#########################################################################################


db = SQLAlchemy()


#######################################
###########      USERS      ###########
#######################################

class User(db.Model):
    __tablename__ = "users"

    #------------#
    # Attributes #
    #------------#

    # Primary Key
    id:              Mapped[int]      = mapped_column( Integer,      primary_key=True,                     autoincrement=True)

    # Remaining Attributes
    email:           Mapped[str]      = mapped_column( String(100),  unique=True,         nullable=False)
    username:        Mapped[str]      = mapped_column( String(40),   unique=True,         nullable=False)
    full_name:       Mapped[str]      = mapped_column( String(80),                        nullable=False)
    description:     Mapped[str]      = mapped_column( Text,                              nullable=True)
    country:         Mapped[str]      = mapped_column( String(100),                       nullable=True)
    is_active:       Mapped[bool]     = mapped_column( Boolean,      default=True,        nullable=False)

    created_at:      Mapped[datetime] = mapped_column( DateTime(timezone=True),           nullable=False,  default=func.now(), server_default=func.now())

    # Password - both plain (for testing) and hashed (for production)
    plain_psswrd:    Mapped[str]      = mapped_column( String(255),                       nullable=True)
    hashed_psswrd:   Mapped[str]      = mapped_column( String(255),                       nullable=False)

    # Cloudinary attributes
    cloudinary_url:     Mapped[str]   = mapped_column( String(255),                       nullable=True)
    cloudinary_img_id:  Mapped[str]   = mapped_column( String(100),                       nullable=True)


    #-----------#
    # Relations #
    #-----------#

    # One-to-many relationship with Recipe (author) --> shows all recipes created by this user
    recipes: Mapped[List["Recipe"]] = relationship(
        "Recipe", 
        back_populates="author",
        cascade="all, delete-orphan"
    )

        # One-to-many relationship with Follow (follower) --> shows all users this user is following
    following_relationships: Mapped[List["Follow"]] = relationship(
        "Follow",
        foreign_keys="Follow.follower_id",
        back_populates="follower",
        cascade="all, delete-orphan"
    )

        # One-to-many relationship with Follow (followed) --> shows all users following this user
    follower_relationships: Mapped[List["Follow"]] = relationship(
        "Follow",
        foreign_keys="Follow.followed_id", 
        back_populates="followed",
        cascade="all, delete-orphan"
    )

    # One-to-many relationship with Comment --> shows all comments created by this user
    comments: Mapped[List["Comment"]] = relationship(
        "Comment",
        back_populates="author",
        cascade="all, delete-orphan"
    )

    # One-to-many relationship with Like --> shows all recipe likes by this user
    recipe_likes: Mapped[List["Like"]] = relationship(
        "Like",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    # One-to-many relationship with CommentLike --> shows all comment likes by this user
    comment_likes: Mapped[List["CommentLike"]] = relationship(
        "CommentLike",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    # One-to-many relationship with Collection --> shows all collections owned by this user
    collections: Mapped[List["Collection"]] = relationship(
        "Collection",
        back_populates="owner",
        cascade="all, delete-orphan"
    )

    # One-to-many relationship with Chat (as user1) --> shows all chats where this user is user1
    chats_as_user1: Mapped[List["Chat"]] = relationship(
        "Chat",
        foreign_keys="Chat.user1_id",
        back_populates="user1",
        cascade="all, delete-orphan"
    )

    # One-to-many relationship with Chat (as user2) --> shows all chats where this user is user2
    chats_as_user2: Mapped[List["Chat"]] = relationship(
        "Chat",
        foreign_keys="Chat.user2_id",
        back_populates="user2",
        cascade="all, delete-orphan"
    )

    # One-to-many relationship with Message --> shows all messages sent by this user
    sent_messages: Mapped[List["Message"]] = relationship(
        "Message",
        back_populates="sender",
        cascade="all, delete-orphan"
    )


    #-------------------#
    # Hybrid Properties #
    #-------------------#
    
    @hybrid_property
    def followers_count(self):
        return len(self.follower_relationships)
    
    @followers_count.expression
    def followers_count_expression(cls):
        return (
            select(func.count(Follow.id))
            .where(Follow.followed_id == cls.id)
            .scalar_subquery()
        )

    @hybrid_property
    def following_count(self):
        return len(self.following_relationships)
    
    @following_count.expression
    def following_count_expression(cls):
        return (
            select(func.count(Follow.id))
            .where(Follow.follower_id == cls.id)
            .scalar_subquery()
        )

    @hybrid_property
    def recipes_count(self):
        return len(self.recipes)
    
    @recipes_count.expression
    def recipes_count_expression(cls):
        return (
            select(func.count(Recipe.id))
            .where(Recipe.author_id == cls.id)
            .scalar_subquery()
        )

    @hybrid_property
    def collections_count(self):
        return len(self.collections)
    
    @collections_count.expression
    def collections_count_expression(cls):
        return (
            select(func.count(Collection.id))
            .where(Collection.owner_id == cls.id)
            .scalar_subquery()
        )

    #---------------#
    # Serialization #
    #---------------#
    def serialize(self) -> Dict[str, Any]:
        return {
            "user_id":     self.id,
            "email":       self.email,
            "username":    self.username,
            "full_name":   self.full_name,
            "description": self.description,
            "country":     self.country,
            "is_active":   self.is_active,
            "created_at":  self.created_at.isoformat() if self.created_at else None,
            "cloudinary_url":    self.cloudinary_url,
            "cloudinary_img_id": self.cloudinary_img_id,
            
            # Social network metrics - now using efficient hybrid properties
            "followers_count":   self.followers_count,
            "following_count":   self.following_count,
            "recipes_count":     self.recipes_count,
            "collections_count": self.collections_count
            # do not serialize the hashed password, its a security breach
        }


    #----------------#
    # Helper Methods #
    #----------------#
    
    def is_following(self, user: Optional["User"]) -> bool:
        """Check if this user is following another user"""
        if user is None or user.id is None:
            return False
        return db.session.query(
            db.session.query(Follow)
            .filter(Follow.follower_id == self.id, Follow.followed_id == user.id)
            .exists()
        ).scalar()
    
    def is_followed_by(self, user):
        """Check if this user is followed by another user"""
        if user is None or user.id is None:
            return False
        return db.session.query(
            db.session.query(Follow)
            .filter(Follow.follower_id == user.id, Follow.followed_id == self.id)
            .exists()
        ).scalar()

    def get_all_chats(self):
        """Get all chats where this user is a participant"""
        return self.chats_as_user1 + self.chats_as_user2
    
    def get_chat_with_user(self, other_user_id: int):
        """Find existing chat with another user"""
        print(f"[DEBUG MODEL] User.get_chat_with_user called")
        print(f"[DEBUG MODEL] self.id: {self.id}, other_user_id: {other_user_id}")
        print(f"[DEBUG MODEL] self.chats_as_user1 count: {len(self.chats_as_user1)}")
        print(f"[DEBUG MODEL] self.chats_as_user2 count: {len(self.chats_as_user2)}")
        
        # Check if there's a chat where this user is user1 and other is user2
        print(f"[DEBUG MODEL] Checking chats_as_user1...")
        for i, chat in enumerate(self.chats_as_user1):
            print(f"[DEBUG MODEL] Chat {i}: ID={chat.id}, user1_id={chat.user1_id}, user2_id={chat.user2_id}")
            if chat.user2_id == other_user_id:
                print(f"[DEBUG MODEL] MATCH FOUND in chats_as_user1: chat ID {chat.id}")
                return chat
        
        # Check if there's a chat where this user is user2 and other is user1
        print(f"[DEBUG MODEL] Checking chats_as_user2...")
        for i, chat in enumerate(self.chats_as_user2):
            print(f"[DEBUG MODEL] Chat {i}: ID={chat.id}, user1_id={chat.user1_id}, user2_id={chat.user2_id}")
            if chat.user1_id == other_user_id:
                print(f"[DEBUG MODEL] MATCH FOUND in chats_as_user2: chat ID {chat.id}")
                return chat
        
        print(f"[DEBUG MODEL] NO EXISTING CHAT FOUND")
        return None
    
    def get_total_unread_messages(self) -> int:
        """Get total count of unread messages across all chats - OPTIMIZED VERSION"""
        from sqlalchemy import and_, or_, func
        
        # Single query to get total unread count across all user's chats
        total_unread = (
            db.session.query(func.count(Message.id))
            .join(Chat, Message.chat_id == Chat.id)
            .filter(
                and_(
                    # User is a participant in the chat
                    or_(Chat.user1_id == self.id, Chat.user2_id == self.id),
                    # Message is not from the current user
                    Message.sender_id != self.id,
                    # Message is not read
                    Message.is_read == False
                )
            )
            .scalar() or 0
        )
        
        return total_unread


    #-----------------#
    # __repr__ Method #
    #-----------------#
    def __repr__(self):
        return f"<User ID {self.id} | Username: {self.username} | Email: {self.email} | Name: {self.full_name}>"



#############################################
##########         RECIPES         ##########
#############################################

class Recipe(db.Model):
    __tablename__ = "recipes"

    #------------#
    # Attributes #
    #------------#

    # Primary Key and Foreign Keys
    id:           Mapped[int] = mapped_column( Integer,  primary_key=True,       autoincrement=True)
    author_id:    Mapped[int] = mapped_column( Integer,  ForeignKey("users.id",  ondelete="CASCADE"),  nullable=False)

    # Remaining Attributes                                                                       
    title:        Mapped[str]      = mapped_column( String(100),      nullable=False)
    description:  Mapped[str]      = mapped_column( Text,             nullable=True)

    created_at:   Mapped[datetime] = mapped_column( DateTime(timezone=True),        default=func.now(), server_default=func.now(), nullable=False   )

    ingredients:  Mapped[List[Dict[str, Any]]] = mapped_column( JSON, nullable=False)
    """ Example structure for INGREDIENTS: 

    ingredients = [
        {
            "ingredient": "flour",
            "quantity":    2,
            "unit":       "cups"
        },
        {
            "ingredient": "salt",
            "quantity":    1,
            "unit":       "tsp"
        }
    ]
    """

    instructions: Mapped[List[str]] = mapped_column( JSON, nullable=False)
    """ Example structure for INSTRUCTIONS:

    instructions = [
        "Preheat oven to 350°F",
        "Mix dry ingredients",
        "Bake for 25 minutes"
    ]
    """


    #-------------------#
    # Table Constraints #
    #-------------------#
    __table_args__ = (
        # Note: json_array_length() and char_length() are PostgreSQL-specific functions
        # These constraints will fail on SQLite, MySQL, etc.
        CheckConstraint("json_array_length(ingredients)  > 0",  name='check_has_ingredients'),
        CheckConstraint("json_array_length(instructions) > 0",  name='check_has_instructions'),
        CheckConstraint("char_length(title)              > 0",  name='check_title_not_empty'),
    )


    #-----------#
    # Relations #
    #-----------#

    # Many-to-one relationship with User (recipes) --> shows the author of the recipe
    author: Mapped["User"] = relationship(
        "User", 
        back_populates="recipes"
    )

    # One-to-many relationship with RecipeImage --> shows all images associated with this recipe
    images: Mapped[List["RecipeImage"]] = relationship(
        "RecipeImage",
        back_populates="recipe",
        cascade="all, delete-orphan"
    )

    # One-to-many relationship with Comment --> shows all comments for this recipe
    comments: Mapped[List["Comment"]] = relationship(
        "Comment",
        back_populates="recipe",
        cascade="all, delete-orphan"
    )

    # One-to-many relationship with Like --> shows all likes for this recipe
    likes: Mapped[List["Like"]] = relationship(
        "Like",
        back_populates="recipe",
        cascade="all, delete-orphan"
    )

    # Many-to-many relationship with Collection via association table
    # A recipe can belong to multiple collections and a collection can contain multiple recipes
    collections: Mapped[List["Collection"]] = relationship(
        "Collection",
        secondary="collection_recipe",
        back_populates="recipes"
    )

    # One-to-many relationship with CollectionRecipe association objects when direct access is needed
    collection_recipes: Mapped[List["CollectionRecipe"]] = relationship(
        "CollectionRecipe",
        back_populates="recipe",
        cascade="all, delete-orphan"
    )


    #-------------------#
    # Hybrid Properties #
    #-------------------#
    
    @hybrid_property
    def like_count(self):
        """Get the total number of likes for this recipe"""
        return len(self.likes)
    
    @like_count.expression
    def like_count_expression(cls):
        return (
            select(func.count(Like.id))
            .where(Like.recipe_id == cls.id)
            .scalar_subquery()
        )

    #-----------------#
    # Helper Methods  #
    #-----------------#
    
    def is_liked_by(self, user_id: int) -> bool:
        """Check if a specific user has liked this recipe"""
        if user_id is None:
            return False
        return db.session.query(
            db.session.query(Like)
            .filter(Like.user_id == user_id, Like.recipe_id == self.id)
            .exists()
        ).scalar()


    #---------------#
    # Serialization #
    #---------------#
    def serialize(self, current_user_id: Optional[int] = None) -> Dict[str, Any]:
        """
        Serialize recipe data
        
        Args:
            current_user_id: ID of the current user to check if they liked the recipe
        """
        return {
            "recipe_id":    self.id,
            "author_id":    self.author_id,
            "title":        self.title,
            "description":  self.description,
            "ingredients":  self.ingredients,   # Will serialize as JSON automatically
            "instructions": self.instructions,  # Will serialize as JSON automatically
            "created_at":   self.created_at.isoformat() if self.created_at else None,
            "like_count":   self.like_count,
            
            # Current user interaction status
            "is_liked_by_user": self.is_liked_by(current_user_id) if current_user_id else False,
        }


    #-----------------#
    # __repr__ Method #
    #-----------------#
    def __repr__(self):
        return f"<Recipe ID {self.id} | Title: {self.title} | Author ID: {self.author_id} | Created: {self.created_at.strftime('%Y-%m-%d') if self.created_at else 'N/A'}>"



#############################################
#########       RECIPE IMAGES       #########
#############################################

class RecipeImage(db.Model):
    __tablename__ = "recipe_images"

    # Primary Key
    id:        Mapped[int] = mapped_column( Integer, primary_key=True, autoincrement=True)
 
    # Foreign Key to Recipe 
    recipe_id: Mapped[int] = mapped_column( Integer, ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False)

    # Cloudinary fields
    url:          Mapped[str]      = mapped_column( String(255),                      nullable=False)
    image_id:     Mapped[str]      = mapped_column( String(100),                      nullable=False)
    is_primary:   Mapped[bool]     = mapped_column( Boolean,     default=False,       nullable=False)
    display_order: Mapped[int]     = mapped_column( Integer,     default=0,           nullable=False)

    uploaded_at:  Mapped[datetime] = mapped_column( DateTime(timezone=True),          nullable=False,   default=func.now(), server_default=func.now())

    # Relation Many-to-One with Recipe --> shows the recipe this image is associated with
    recipe: Mapped["Recipe"] = relationship(
        "Recipe",
        back_populates="images"
    )


    #---------------#
    # Serialization #
    #---------------#
    def serialize(self) -> Dict[str, Any]:
        return {
            "id":            self.id,
            "recipe_id":     self.recipe_id,
            "url":           self.url,
            "image_id":      self.image_id,
            "is_primary":    self.is_primary,
            "display_order": self.display_order,
            "uploaded_at":   self.uploaded_at.isoformat() if self.uploaded_at else None
        }

    #-----------------#
    # __repr__ Method #
    #-----------------#
    def __repr__(self):
        return f"<RecipeImage ID {self.id} | Recipe ID: {self.recipe_id} | Primary: {self.is_primary}>"



#############################################
##########         FOLLOWS        ###########
#############################################

class Follow(db.Model):
    __tablename__ = "follows"

    #------------#
    # Attributes #
    #------------#

    # Primary Key
    id:          Mapped[int] = mapped_column( Integer, primary_key=True, autoincrement=True)

    # Foreign Keys
    follower_id: Mapped[int] = mapped_column( Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    followed_id: Mapped[int] = mapped_column( Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Remaining Attributes
    created_at:  Mapped[datetime] = mapped_column( DateTime(timezone=True), default=func.now(), server_default=func.now(),    nullable=False)


    #-------------------#
    # Table Constraints #
    #-------------------#
    __table_args__ = (
        # Prevent users from following themselves
        CheckConstraint("follower_id != followed_id",  name='check_no_self_follow'),
        # Each follow relationship should be unique (no duplicate follows)
        UniqueConstraint('follower_id', 'followed_id', name='unique_follow_relationship')
    )


    #-----------#
    # Relations #
    #-----------#

    # Many-to-one relationship with User (follower) --> shows who is doing the following
    follower: Mapped["User"] = relationship(
        "User",
        foreign_keys=[follower_id],
        back_populates="following_relationships"
    )

    # Many-to-one relationship with User (followed) --> shows who is being followed
    followed: Mapped["User"] = relationship(
        "User", 
        foreign_keys=[followed_id],
        back_populates="follower_relationships"
    )


    #---------------#
    # Serialization #
    #---------------#
    def serialize(self) -> Dict[str, Any]:
        return {
            "follow_id":   self.id,
            "follower_id": self.follower_id,
            "followed_id": self.followed_id,
            "created_at":  self.created_at.isoformat() if self.created_at else None
        }


    #-----------------#
    # __repr__ Method #
    #-----------------#
    def __repr__(self):
        return f"<Follow ID {self.id} | Follower: {self.follower_id} | Followed: {self.followed_id} | Created: {self.created_at.strftime('%Y-%m-%d') if self.created_at else 'N/A'}>"



#############################################
##########        COMMENTS        ###########
#############################################

class Comment(db.Model):
    __tablename__ = "comments"

    #------------#
    # Attributes #
    #------------#

    # Primary Key
    id:              Mapped[int]      = mapped_column( Integer,        primary_key=True, autoincrement=True)

    # Foreign Keys
    user_id:         Mapped[int]      = mapped_column( Integer,        ForeignKey("users.id",    ondelete="CASCADE"),  nullable=False)
    recipe_id:       Mapped[int]      = mapped_column( Integer,        ForeignKey("recipes.id",  ondelete="CASCADE"),  nullable=False)
    parent_comment_id: Mapped[Optional[int]] = mapped_column( Integer, ForeignKey("comments.id", ondelete="CASCADE"),  nullable=True)

    # Content and State Fields
    content:         Mapped[str]      = mapped_column( Text,                         nullable=False)
    is_edited:       Mapped[bool]     = mapped_column( Boolean,   default=False,     nullable=False)
    is_pinned:       Mapped[bool]     = mapped_column( Boolean,   default=False,     nullable=False)

    created_at:      Mapped[datetime] = mapped_column( DateTime(timezone=True),      nullable=False,   default=func.now(), server_default=func.now(),)


    #-------------------#
    # Table Constraints #
    #-------------------#
    __table_args__ = (

        # Ensure comment content is not empty
        ### Note: char_length() is PostgreSQL-specific, will fail on SQLite, MySQL, etc.
        CheckConstraint("char_length(content) > 0", name='check_comment_content_not_empty'),


        # Only one pinned comment per recipe (now enforced at DB layer with partial unique index)
        ### Note: This index is PostgreSQL-specific. For other DBs, enforce via app logic or triggers.
        Index('unique_pinned_comment_per_recipe', 'recipe_id', unique=True, postgresql_where=text('is_pinned = true')),


        # Prevent self-referencing at deeper than one level (now enforced at DB layer)
        ### Note: This constraint is PostgreSQL-specific. For other DBs, enforce via app logic or triggers.
        CheckConstraint("parent_comment_id IS NULL OR (SELECT c.parent_comment_id FROM comments c WHERE c.id = parent_comment_id) IS NULL", name='check_no_deep_comment_nesting'),
    )


    #-----------#
    # Relations #
    #-----------#

    # Many-to-one relationship with User --> shows who created the comment
    author: Mapped["User"] = relationship(
        "User",
        back_populates="comments"
    )

    # Many-to-one relationship with Recipe --> shows which recipe this comment belongs to
    recipe: Mapped["Recipe"] = relationship(
        "Recipe",
        back_populates="comments"
    )

    # Self-referential relationship for nested comments (only one level deep)
    # One-to-many relationship with Comment (parent) --> shows replies to this comment
    replies: Mapped[List["Comment"]] = relationship(
        "Comment",
        foreign_keys=[parent_comment_id],
        back_populates="parent_comment",
        cascade="all, delete-orphan"
    )

    # Many-to-one relationship with Comment (parent) --> shows the parent comment if this is a reply
    parent_comment: Mapped[Optional["Comment"]] = relationship(
        "Comment",
        foreign_keys=[parent_comment_id],
        back_populates="replies",
        remote_side=[id]
    )

    # One-to-many relationship with CommentLike --> shows all likes for this comment
    likes: Mapped[List["CommentLike"]] = relationship(
        "CommentLike",
        back_populates="comment",
        cascade="all, delete-orphan"
    )


    #-------------------#
    # Hybrid Properties #
    #-------------------#
    
    @hybrid_property
    def like_count(self):
        """Get the total number of likes for this comment"""
        return len(self.likes)
    
    @like_count.expression
    def like_count_expression(cls):
        return (
            select(func.count(CommentLike.id))
            .where(CommentLike.comment_id == cls.id)
            .scalar_subquery()
        )

    @hybrid_property
    def replies_count(self):
        """Get the total number of replies to this comment"""
        return len(self.replies)
    
    @replies_count.expression
    def replies_count_expression(cls):
        return (
            select(func.count(Comment.id))
            .where(Comment.parent_comment_id == cls.id)
            .scalar_subquery()
        )

    #----------------#
    # Helper Methods #
    #----------------#
    
    def is_liked_by(self, user_id: int) -> bool:
        """Check if a specific user has liked this comment"""
        if user_id is None:
            return False
        return db.session.query(
            db.session.query(CommentLike)
            .filter(CommentLike.user_id == user_id, CommentLike.comment_id == self.id)
            .exists()
        ).scalar()


    #---------------#
    # Serialization #
    #---------------#
    def serialize(self, include_replies: bool = True, current_user_id: Optional[int] = None) -> Dict[str, Any]:
        """
        Serialize comment data
        
        Args:
            include_replies: Whether to include nested replies (default: True)
            current_user_id: ID of the current user to check if they liked the comment
        """
        serialized = {
            "comment_id":        self.id,
            "user_id":           self.user_id,
            "recipe_id":         self.recipe_id,
            "parent_comment_id": self.parent_comment_id,
            "content":           self.content,
            "created_at":        self.created_at.isoformat() if self.created_at else None,
            "is_edited":         self.is_edited,
            "is_pinned":         self.is_pinned,
            "like_count":        self.like_count,
            "replies_count":     self.replies_count,
            
            # Author information
            "author": {
                "user_id":          self.author.id,
                "username":         self.author.username,
                "full_name":        self.author.full_name,
                "cloudinary_url":   self.author.cloudinary_url
            } if self.author else None,
            
            # Current user interaction status
            "is_liked_by_user": self.is_liked_by(current_user_id) if current_user_id else False,
        }
        
        # Include replies if requested and this is not already a reply (prevent infinite nesting)
        if include_replies and not self.parent_comment_id:
            serialized["replies"] = [
                reply.serialize(include_replies=False, current_user_id=current_user_id)
                for reply in sorted(self.replies, key=lambda r: r.created_at)
            ]
        
        return serialized


    #-----------------#
    # __repr__ Method #
    #-----------------#
    def __repr__(self):
        content_preview = self.content[:50] + "..." if len(self.content) > 50 else self.content
        return f"<Comment ID {self.id} | Recipe: {self.recipe_id} | Author: {self.user_id} | Content: '{content_preview}' | Likes: {self.like_count}>"



#############################################
##########      RECIPE LIKES      ###########
#############################################

class Like(db.Model):
    __tablename__ = "recipe_likes"

    #------------#
    # Attributes #
    #------------#

    # Primary Key
    id:          Mapped[int] = mapped_column( Integer, primary_key=True, autoincrement=True)

    # Foreign Keys
    user_id:     Mapped[int] = mapped_column( Integer, ForeignKey("users.id",   ondelete="CASCADE"), nullable=False)
    recipe_id:   Mapped[int] = mapped_column( Integer, ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False)

    # Timestamp
    created_at:  Mapped[datetime] = mapped_column( DateTime(timezone=True), default=func.now(), server_default=func.now(),      nullable=False)


    #-------------------#
    # Table Constraints #
    #-------------------#
    __table_args__ = (
        # Each user can only like a recipe once
        UniqueConstraint('user_id', 'recipe_id', name='unique_user_recipe_like'),
    )


    #-----------#
    # Relations #
    #-----------#

    # Many-to-one relationship with User --> shows who liked the recipe
    user: Mapped["User"] = relationship(
        "User",
        back_populates="recipe_likes"
    )

    # Many-to-one relationship with Recipe --> shows which recipe was liked
    recipe: Mapped["Recipe"] = relationship(
        "Recipe",
        back_populates="likes"
    )


    #---------------#
    # Serialization #
    #---------------#
    def serialize(self) -> Dict[str, Any]:
        return {
            "like_id":    self.id,
            "user_id":    self.user_id,
            "recipe_id":  self.recipe_id,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


    #-----------------#
    # __repr__ Method #
    #-----------------#
    def __repr__(self):
        return f"<Like ID {self.id} | User: {self.user_id} | Recipe: {self.recipe_id} | Created: {self.created_at.strftime('%Y-%m-%d') if self.created_at else 'N/A'}>"



#############################################
##########     COMMENT LIKES      ###########
#############################################

class CommentLike(db.Model):
    __tablename__ = "comment_likes"

    #------------#
    # Attributes #
    #------------#

    # Primary Key
    id:          Mapped[int] = mapped_column( Integer, primary_key=True, autoincrement=True)

    # Foreign Keys
    user_id:     Mapped[int] = mapped_column( Integer, ForeignKey("users.id",    ondelete="CASCADE"), nullable=False)
    comment_id:  Mapped[int] = mapped_column( Integer, ForeignKey("comments.id", ondelete="CASCADE"), nullable=False)

    # Timestamp
    created_at:  Mapped[datetime] = mapped_column( DateTime(timezone=True),  default=func.now(), server_default=func.now(),      nullable=False)


    #-------------------#
    # Table Constraints #
    #-------------------#
    __table_args__ = (
        # Each user can only like a comment once
        UniqueConstraint('user_id', 'comment_id', name='unique_user_comment_like'),
    )


    #-----------#
    # Relations #
    #-----------#

    # Many-to-one relationship with User --> shows who liked the comment
    user: Mapped["User"] = relationship(
        "User",
        back_populates="comment_likes"
    )

    # Many-to-one relationship with Comment --> shows which comment was liked
    comment: Mapped["Comment"] = relationship(
        "Comment",
        back_populates="likes"
    )


    #---------------#
    # Serialization #
    #---------------#
    def serialize(self) -> Dict[str, Any]:
        return {
            "like_id":    self.id,
            "user_id":    self.user_id,
            "comment_id": self.comment_id,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


    #-----------------#
    # __repr__ Method #
    #-----------------#
    def __repr__(self):
        return f"<CommentLike ID {self.id} | User: {self.user_id} | Comment: {self.comment_id} | Created: {self.created_at.strftime('%Y-%m-%d') if self.created_at else 'N/A'}>"


############################################
##########      COLLECTIONS      ###########
##########   Association table   ###########
##########      and TABLE        ###########
############################################


    #-------------------#
    # Association Table #
    #-------------------#

class CollectionRecipe(db.Model):
    """Association table between Collection and Recipe.

    This table allows a many-to-many relationship between collections and recipes.
    We keep an explicit association object to allow ordering and additional metadata
    (for example: position in collection, notes, or when it was added).
    """

    __tablename__ = "collection_recipe"

    # Primary Key
    id:            Mapped[int] = mapped_column( Integer, primary_key=True, autoincrement=True)

    # Foreign Keys
    collection_id: Mapped[int] = mapped_column( Integer, ForeignKey("collections.id",  ondelete="CASCADE"), nullable=False)
    recipe_id:     Mapped[int] = mapped_column( Integer, ForeignKey("recipes.id",      ondelete="CASCADE"), nullable=False)

    # Optional ordering / metadata
    display_order: Mapped[int]      = mapped_column( Integer,  default=0,                                   nullable=False)
    added_at:      Mapped[datetime] = mapped_column( DateTime(timezone=True), default=func.now(), server_default=func.now(),           nullable=False)

    __table_args__ = (
        # Prevent duplicate recipe entries in the same collection
        UniqueConstraint('collection_id', 'recipe_id', name='unique_collection_recipe'),
    )

    # Relations back to parent objects
    collection: Mapped["Collection"] = relationship(
        "Collection",
        back_populates="collection_recipes"
    )

    recipe: Mapped["Recipe"] = relationship(
        "Recipe",
        back_populates="collection_recipes"
    )

    def serialize(self) -> Dict[str, Any]:
        return {
            "id":            self.id,
            "collection_id": self.collection_id,
            "recipe_id":     self.recipe_id,
            "display_order": self.display_order,
            "added_at":      self.added_at.isoformat() if self.added_at else None
        }

    def __repr__(self):
        return f"<CollectionRecipe ID {self.id} | Collection: {self.collection_id} | Recipe: {self.recipe_id}>"


    #-------#
    # TABLE #
    #-------#

class Collection(db.Model):
    """User-created collection of recipes (similar to YouTube playlists).

    A collection belongs to one user (owner) and can contain many recipes.
    Collections can be public or private.
    """
    __tablename__ = "collections"

    # Primary Key
    id:        Mapped[int] = mapped_column( Integer, primary_key=True, autoincrement=True)

    # Foreign Key to User (owner)
    owner_id:  Mapped[int] = mapped_column( Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Attributes
    title:         Mapped[str]           = mapped_column( String(120),                  nullable=False)
    description:   Mapped[Optional[str]] = mapped_column( Text,                         nullable=True)
    is_public:     Mapped[bool]          = mapped_column( Boolean,  default=False,      nullable=False)
    created_at:    Mapped[datetime]      = mapped_column( DateTime(timezone=True),      nullable=False,  default=func.now(), server_default=func.now())

    __table_args__ = (
        # Note: char_length() is PostgreSQL-specific, will fail on SQLite, MySQL, etc.
        CheckConstraint("char_length(title) > 0", name='check_collection_title_not_empty'),
    )

    # Relations
    owner: Mapped["User"] = relationship(
        "User",
        back_populates="collections"
    )

    # Many-to-many with Recipe through CollectionRecipe association
    recipes: Mapped[List["Recipe"]] = relationship(
        "Recipe",
        secondary="collection_recipe",
        back_populates="collections",
        viewonly=False
    )

    # One-to-many to association objects for ordering/metadata
    collection_recipes: Mapped[List["CollectionRecipe"]] = relationship(
        "CollectionRecipe",
        back_populates="collection",
        cascade="all, delete-orphan",
        order_by="CollectionRecipe.display_order"
    )

    # Serialization
    def serialize(self, include_recipes: bool = False, current_user_id: Optional[int] = None) -> Dict[str, Any]:
        data = {
            "collection_id": self.id,
            "owner_id":      self.owner_id,
            "title":         self.title,
            "description":   self.description,
            "is_public":     self.is_public,
            "created_at":    self.created_at.isoformat() if self.created_at else None,
            "owner": {
                "user_id":  self.owner.id,
                "username":  self.owner.username,
                "cloudinary_url": self.owner.cloudinary_url
            } if self.owner else None,
            "recipe_count": len(self.collection_recipes)
        }

        if include_recipes:
            # Include serialized recipes in the order defined by collection_recipes
            data["recipes"] = [
                {
                    "collection_recipe_id": cr.id,
                    "display_order": cr.display_order,
                    "added_at": cr.added_at.isoformat() if cr.added_at else None,
                    "recipe": cr.recipe.serialize(current_user_id=current_user_id) if cr.recipe else None
                }
                for cr in sorted(self.collection_recipes, key=lambda c: c.display_order)
            ]

        return data

    def __repr__(self):
        return f"<Collection ID {self.id} | Title: {self.title} | Owner: {self.owner_id} | Public: {self.is_public}>"



######################################
##########      CHATS      ###########
######################################

class Chat(db.Model):
    """Chat represents a conversation between two users.
    
    Each chat has exactly two participants. Direct messaging is 1-on-1.
    """
    __tablename__ = "chats"

    #------------#
    # Attributes #
    #------------#

    # Primary Key
    id:           Mapped[int]      = mapped_column( Integer,      primary_key=True,  autoincrement=True)

    # Foreign Keys (the two participants)
    user1_id:     Mapped[int]      = mapped_column( Integer,      ForeignKey("users.id", ondelete="CASCADE"),  nullable=False)
    user2_id:     Mapped[int]      = mapped_column( Integer,      ForeignKey("users.id", ondelete="CASCADE"),  nullable=False)

    # Timestamps
    created_at:   Mapped[datetime] = mapped_column( DateTime(timezone=True),     default=func.now(), server_default=func.now(),                          nullable=False)
    updated_at:   Mapped[datetime] = mapped_column( DateTime(timezone=True),     default=func.now(), server_default=func.now(), onupdate=func.now(),    nullable=False)


    #-------------------#
    # Table Constraints #
    #-------------------#
    __table_args__ = (
        # Ensure users can't chat with themselves
        CheckConstraint("user1_id != user2_id", name='check_no_self_chat'),
        # Ensure unique chat between two users (prevent duplicate chats)
        UniqueConstraint('user1_id', 'user2_id', name='unique_chat_participants'),
    )


    #-----------#
    # Relations #
    #-----------#

    # Many-to-one relationships with User (participants)
    user1: Mapped["User"] = relationship(
        "User",
        foreign_keys=[user1_id],
        back_populates="chats_as_user1"
    )

    user2: Mapped["User"] = relationship(
        "User", 
        foreign_keys=[user2_id],
        back_populates="chats_as_user2"
    )

    # One-to-many relationship with Message
    messages: Mapped[List["Message"]] = relationship(
        "Message",
        back_populates="chat",
        cascade="all, delete-orphan",
        order_by="Message.created_at"
    )


    #----------------#
    # Helper Methods #
    #----------------#
    
    @property
    def last_message(self):
        """Get the most recent message in this chat.
        
        PERFORMANCE NOTE: This property loads ALL messages for each chat.
        For better performance, use a database query to get only the latest message.
        """
        if self.messages:
            return max(self.messages, key=lambda m: m.created_at)
        return None
    
    def get_other_participant(self, current_user_id: int) -> Optional["User"]:
        """Get the other participant in the chat (not the current user)."""
        if self.user1_id == current_user_id:
            return self.user2
        elif self.user2_id == current_user_id:
            return self.user1
        return None
    
    def is_participant(self, user_id: int) -> bool:
        """Check if a user is a participant in this chat."""
        return user_id == self.user1_id or user_id == self.user2_id
    
    def get_unread_count_for_user(self, user_id: int) -> int:
        """Get count of unread messages for a specific user."""
        if not self.is_participant(user_id):
            return 0
        
        unread_messages = [msg for msg in self.messages 
                          if msg.sender_id != user_id and not msg.is_read]
        return len(unread_messages)


    #---------------#
    # Serialization #
    #---------------#
    def serialize(self, current_user_id: Optional[int] = None, include_messages: bool = False) -> Dict[str, Any]:
        """Serialize chat data with performance optimizations."""
        other_participant = self.get_other_participant(current_user_id) if current_user_id else None
        
        data = {
            "chat_id":     self.id,
            "created_at":  self.created_at.isoformat() if self.created_at else None,
            "updated_at":  self.updated_at.isoformat() if self.updated_at else None,
            "participant": {
                "user_id":        other_participant.id if other_participant else None,
                "username":       other_participant.username if other_participant else None,
                "full_name":      other_participant.full_name if other_participant else None,
                "cloudinary_url": other_participant.cloudinary_url if other_participant else None
            } if other_participant else None,
            "last_message": self.last_message.serialize() if self.last_message else None,
            "unread_count": self.get_unread_count_for_user(current_user_id) if current_user_id else 0
        }

        if include_messages:
            data["messages"] = [message.serialize() for message in self.messages]

        return data

    #------------------------#
    # Optimized Class Methods #
    #------------------------#
    
    @classmethod
    def get_optimized_chat_list(cls, user_id: int):
        """Get chat list with optimized queries to avoid N+1 problems.
        
        This method fetches all chats for a user with:
        - Preloaded participants (user1, user2)
        - Last message data via subquery  
        - Unread counts via subquery
        
        Returns raw data suitable for efficient serialization.
        """
        from sqlalchemy import and_, or_, desc, case, func
        
        # Subquery for unread counts per chat for this user
        unread_count_subquery = (
            db.session.query(
                Message.chat_id,
                func.count(Message.id).label('unread_count')
            )
            .filter(
                and_(
                    Message.sender_id != user_id,  # Not sent by current user
                    Message.is_read == False       # Not read yet
                )
            )
            .group_by(Message.chat_id)
            .subquery()
        )
        
        # Subquery for last message per chat
        last_message_subquery = (
            db.session.query(
                Message.chat_id,
                Message.content.label('last_msg_content'),
                Message.created_at.label('last_msg_timestamp')
            )
            .join(
                # Subquery to get the latest message ID per chat
                db.session.query(
                    Message.chat_id,
                    func.max(Message.created_at).label('max_created_at')
                ).group_by(Message.chat_id).subquery('max_msg'),
                and_(
                    Message.chat_id == text('max_msg.chat_id'),
                    Message.created_at == text('max_msg.max_created_at')
                )
            )
            .subquery()
        )
        
        # Main query with all optimizations
        query = (
            db.session.query(
                cls.id.label('chat_id'),
                cls.created_at,
                cls.updated_at,
                cls.user1_id,
                cls.user2_id,
                
                # Other participant data (conditional based on which user is current)
                case(
                    (cls.user1_id == user_id, cls.user2_id),
                    else_=cls.user1_id
                ).label('other_participant_id'),
                
                # Last message data
                last_message_subquery.c.last_msg_content,
                last_message_subquery.c.last_msg_timestamp,
                
                # Unread count
                func.coalesce(unread_count_subquery.c.unread_count, 0).label('unread_count')
            )
            .outerjoin(last_message_subquery, cls.id == last_message_subquery.c.chat_id)
            .outerjoin(unread_count_subquery, cls.id == unread_count_subquery.c.chat_id)
            .filter(
                or_(cls.user1_id == user_id, cls.user2_id == user_id)
            )
            .order_by(desc(func.coalesce(last_message_subquery.c.last_msg_timestamp, cls.created_at)))
        )
        
        return query.all()
    
    @classmethod
    def get_optimized_chat_list_paginated(cls, user_id: int, page: int = 1, per_page: int = 20):
        """Get paginated chat list with optimized queries.
        
        Args:
            user_id: The user ID to get chats for
            page: Page number (1-based)
            per_page: Chats per page (max 50)
            
        Returns:
            Dict with chats, pagination info, and total unread count
        """
        from sqlalchemy import and_, or_, desc, case, func, text
        
        # First get total chat count and total unread count
        total_chats = (
            db.session.query(func.count(cls.id))
            .filter(or_(cls.user1_id == user_id, cls.user2_id == user_id))
            .scalar() or 0
        )
        
        # Get total unread count across all chats (efficient single query)
        total_unread = (
            db.session.query(func.count(Message.id))
            .join(cls, Message.chat_id == cls.id)
            .filter(
                and_(
                    or_(cls.user1_id == user_id, cls.user2_id == user_id),
                    Message.sender_id != user_id,
                    Message.is_read == False
                )
            )
            .scalar() or 0
        )
        
        # Calculate pagination
        total_pages = (total_chats + per_page - 1) // per_page
        offset = (page - 1) * per_page
        
        # Subquery for unread counts per chat for this user
        unread_count_subquery = (
            db.session.query(
                Message.chat_id,
                func.count(Message.id).label('unread_count')
            )
            .filter(
                and_(
                    Message.sender_id != user_id,  # Not sent by current user
                    Message.is_read == False       # Not read yet
                )
            )
            .group_by(Message.chat_id)
            .subquery()
        )
        
        # Subquery for last message per chat
        last_message_subquery = (
            db.session.query(
                Message.chat_id,
                Message.content.label('last_msg_content'),
                Message.created_at.label('last_msg_timestamp')
            )
            .join(
                # Subquery to get the latest message ID per chat
                db.session.query(
                    Message.chat_id,
                    func.max(Message.created_at).label('max_created_at')
                ).group_by(Message.chat_id).subquery('max_msg'),
                and_(
                    Message.chat_id == text('max_msg.chat_id'),
                    Message.created_at == text('max_msg.max_created_at')
                )
            )
            .subquery()
        )
        
        # Main paginated query
        query = (
            db.session.query(
                cls.id.label('chat_id'),
                cls.created_at,
                cls.updated_at,
                cls.user1_id,
                cls.user2_id,
                
                # Other participant data
                case(
                    (cls.user1_id == user_id, cls.user2_id),
                    else_=cls.user1_id
                ).label('other_participant_id'),
                
                # Last message data
                last_message_subquery.c.last_msg_content,
                last_message_subquery.c.last_msg_timestamp,
                
                # Unread count
                func.coalesce(unread_count_subquery.c.unread_count, 0).label('unread_count')
            )
            .outerjoin(last_message_subquery, cls.id == last_message_subquery.c.chat_id)
            .outerjoin(unread_count_subquery, cls.id == unread_count_subquery.c.chat_id)
            .filter(
                or_(cls.user1_id == user_id, cls.user2_id == user_id)
            )
            .order_by(desc(func.coalesce(last_message_subquery.c.last_msg_timestamp, cls.created_at)))
            .offset(offset)
            .limit(per_page)
        )
        
        chats = query.all()
        
        return {
            'chats': chats,
            'total_unread': total_unread,
            'pagination': {
                'current_page': page,
                'per_page': per_page,
                'total_pages': total_pages,
                'total_chats': total_chats,
                'has_next': page < total_pages,
                'has_prev': page > 1
            }
        }
    
    @classmethod  
    def get_optimized_chat_data(cls, chat_id: int, current_user_id: int, include_messages: bool = False):
        """Get a single chat with optimized loading.
        
        Args:
            chat_id: The chat ID to fetch
            current_user_id: Current user ID for permission checking
            include_messages: Whether to include message list
            
        Returns:
            Dict with chat data ready for JSON serialization, or None if not found
        """
        from sqlalchemy import and_, or_, desc, func
        
        # First, get the basic chat with participants preloaded
        chat = (
            db.session.query(cls)
            .options(
                db.joinedload(cls.user1),
                db.joinedload(cls.user2)
            )
            .filter(
                and_(
                    cls.id == chat_id,
                    or_(cls.user1_id == current_user_id, cls.user2_id == current_user_id)
                )
            )
            .first()
        )
        
        if not chat:
            return None
        
        # Get other participant
        other_participant = chat.get_other_participant(current_user_id)
        
        # Build basic response
        result = {
            "chat_id": chat.id,
            "created_at": chat.created_at.isoformat() if chat.created_at else None,
            "updated_at": chat.updated_at.isoformat() if chat.updated_at else None,
            "participant": {
                "user_id": other_participant.id if other_participant else None,
                "username": other_participant.username if other_participant else None,
                "full_name": other_participant.full_name if other_participant else None,
                "cloudinary_url": other_participant.cloudinary_url if other_participant else None
            } if other_participant else None,
            "unread_count": 0  # Will be calculated below
        }
        
        if include_messages:
            # Efficiently load messages with sender info
            messages = (
                db.session.query(Message)
                .options(db.joinedload(Message.sender))
                .filter(Message.chat_id == chat_id)
                .order_by(Message.created_at)
                .all()
            )
            
            result["messages"] = [msg.serialize() for msg in messages]
            
            # Calculate unread count from loaded messages
            unread_count = sum(1 for msg in messages 
                             if msg.sender_id != current_user_id and not msg.is_read)
            result["unread_count"] = unread_count
            
            # Set last message from loaded data
            if messages:
                result["last_message"] = messages[-1].serialize()
            else:
                result["last_message"] = None
        else:
            # Get just the last message efficiently
            last_message = (
                db.session.query(Message)
                .options(db.joinedload(Message.sender))
                .filter(Message.chat_id == chat_id)
                .order_by(desc(Message.created_at))
                .first()
            )
            
            result["last_message"] = last_message.serialize() if last_message else None
            
            # Get unread count efficiently
            unread_count = (
                db.session.query(func.count(Message.id))
                .filter(
                    and_(
                        Message.chat_id == chat_id,
                        Message.sender_id != current_user_id,
                        Message.is_read == False
                    )
                )
                .scalar() or 0
            )
            result["unread_count"] = unread_count
        
        return result
    
    @classmethod  
    def get_optimized_chat_data_paginated(cls, chat_id: int, current_user_id: int, page: int = 1, per_page: int = 50):
        """Get a single chat with paginated messages for efficient loading.
        
        Args:
            chat_id: The chat ID to fetch
            current_user_id: Current user ID for permission checking
            page: Page number (1-based)
            per_page: Messages per page (max 100)
            
        Returns:
            Dict with chat data and paginated messages, or None if not found
        """
        from sqlalchemy import and_, or_, desc, func
        
        # First, get the basic chat with participants preloaded
        chat = (
            db.session.query(cls)
            .options(
                db.joinedload(cls.user1),
                db.joinedload(cls.user2)
            )
            .filter(
                and_(
                    cls.id == chat_id,
                    or_(cls.user1_id == current_user_id, cls.user2_id == current_user_id)
                )
            )
            .first()
        )
        
        if not chat:
            return None
        
        # Get other participant
        other_participant = chat.get_other_participant(current_user_id)
        
        # Get total message count
        total_messages = (
            db.session.query(func.count(Message.id))
            .filter(Message.chat_id == chat_id)
            .scalar() or 0
        )
        
        # Calculate pagination info
        total_pages = (total_messages + per_page - 1) // per_page  # Ceiling division
        offset = (page - 1) * per_page
        
        # Get paginated messages (most recent first, then reverse for chronological order)
        messages_query = (
            db.session.query(Message)
            .options(db.joinedload(Message.sender))
            .filter(Message.chat_id == chat_id)
            .order_by(desc(Message.created_at))
            .offset(offset)
            .limit(per_page)
        )
        
        messages = list(reversed(messages_query.all()))  # Reverse to get chronological order
        
        # Calculate unread count from all messages (not just current page)
        unread_count = (
            db.session.query(func.count(Message.id))
            .filter(
                and_(
                    Message.chat_id == chat_id,
                    Message.sender_id != current_user_id,
                    Message.is_read == False
                )
            )
            .scalar() or 0
        )
        
        # Build response
        result = {
            "chat_id": chat.id,
            "created_at": chat.created_at.isoformat() if chat.created_at else None,
            "updated_at": chat.updated_at.isoformat() if chat.updated_at else None,
            "participant": {
                "user_id": other_participant.id if other_participant else None,
                "username": other_participant.username if other_participant else None,
                "full_name": other_participant.full_name if other_participant else None,
                "cloudinary_url": other_participant.cloudinary_url if other_participant else None
            } if other_participant else None,
            "unread_count": unread_count,
            "messages": [msg.serialize() for msg in messages],
            "pagination": {
                "current_page": page,
                "per_page": per_page,
                "total_pages": total_pages,
                "total_messages": total_messages,
                "has_next": page < total_pages,
                "has_prev": page > 1
            }
        }
        
        # Set last message from the most recent message (regardless of current page)
        if total_messages > 0:
            last_message = (
                db.session.query(Message)
                .options(db.joinedload(Message.sender))
                .filter(Message.chat_id == chat_id)
                .order_by(desc(Message.created_at))
                .first()
            )
            result["last_message"] = last_message.serialize() if last_message else None
        else:
            result["last_message"] = None
        
        return result


    #-----------------#
    # __repr__ Method #
    #-----------------#
    def __repr__(self):
        return f"<Chat ID {self.id} | Users: {self.user1_id}, {self.user2_id}>"


#########################################
##########      MESSAGES      ###########
#########################################

class Message(db.Model):
    """Message represents a single message within a chat.
    
    Each message belongs to a chat and has a sender.
    """
    
    __tablename__ = "messages"

    #------------#
    # Attributes #
    #------------#

    # Primary Key
    id:           Mapped[int]      = mapped_column( Integer,      primary_key=True,                     autoincrement=True)

    # Foreign Keys
    chat_id:      Mapped[int]      = mapped_column( Integer,      ForeignKey("chats.id", ondelete="CASCADE"),    nullable=False)
    sender_id:    Mapped[int]      = mapped_column( Integer,      ForeignKey("users.id", ondelete="CASCADE"),    nullable=False)

    # Message content
    content:      Mapped[str]      = mapped_column( Text,                               nullable=False)

    # Message state
    is_read:      Mapped[bool]     = mapped_column( Boolean,      default=False,        nullable=False)
    is_edited:    Mapped[bool]     = mapped_column( Boolean,      default=False,        nullable=False)

    # Timestamps
    created_at:   Mapped[datetime] = mapped_column( DateTime(timezone=True),            nullable=False,   default=func.now(), server_default=func.now())
    read_at:      Mapped[Optional[datetime]] = mapped_column( DateTime(timezone=True),  nullable=True)
    edited_at:    Mapped[Optional[datetime]] = mapped_column( DateTime(timezone=True),  nullable=True)
           

    #-------------------#
    # Table Constraints #
    #-------------------#
    __table_args__ = (
        # Ensure message content is not empty
        # Note: char_length() is PostgreSQL-specific, will fail on SQLite, MySQL, etc.
        CheckConstraint("char_length(content) > 0", name='check_message_content_not_empty'),
    )


    #-----------#
    # Relations #
    #-----------#

    # Many-to-one relationship with Chat
    chat: Mapped["Chat"] = relationship(
        "Chat",
        back_populates="messages"
    )

    # Many-to-one relationship with User (sender)
    sender: Mapped["User"] = relationship(
        "User",
        back_populates="sent_messages"
    )


    #-----------------#
    # Helper Methods  #
    #-----------------#
    
    def mark_as_read(self):
        """Mark the message as read and set read timestamp."""
        if not self.is_read:
            self.is_read = True
            self.read_at = datetime.now()
    
    def mark_as_edited(self):
        """Mark the message as edited and set edited timestamp."""
        self.is_edited = True
        self.edited_at = datetime.now()


    #---------------#
    # Serialization #
    #---------------#
    def serialize(self) -> Dict[str, Any]:
        
        data = {
            "message_id":  self.id,
            "chat_id":     self.chat_id,
            "sender_id":   self.sender_id,
            "content":     self.content,
            "is_read":     self.is_read,
            "is_edited":   self.is_edited,
            "created_at":  self.created_at.isoformat() if self.created_at else None,
            "read_at":     self.read_at.isoformat()    if self.read_at    else None,
            "edited_at":   self.edited_at.isoformat()  if self.edited_at  else None,
            "sender": {
                "user_id":        self.sender.id             if self.sender else None,
                "username":       self.sender.username       if self.sender else None,
                "full_name":      self.sender.full_name      if self.sender else None,
                "cloudinary_url": self.sender.cloudinary_url if self.sender else None
            } if self.sender else None
        }
        return data


    #-----------------#
    # __repr__ Method #
    #-----------------#
    def __repr__(self):
        return f"<Message ID {self.id} | Chat: {self.chat_id} | Sender: {self.sender_id} | Read: {self.is_read}>"


