from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Boolean, DateTime, Date, ForeignKey, Integer, String, Text, JSON, func, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

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


############################################
###########         USER         ###########
############################################

class User(db.Model):
    __tablename__ = "user"

    #------------#
    # Attributes #
    #------------#

    # Primary Key
    id:              Mapped[int]      = mapped_column( Integer,      primary_key=True,                     autoincrement=True)

    # Remaining Attributes
    email:           Mapped[str]      = mapped_column( String(40),   unique=True,         nullable=False)
    username:        Mapped[str]      = mapped_column( String(40),   unique=True,         nullable=False)
    full_name:       Mapped[str]      = mapped_column( String(80),                        nullable=False)
    plain_psswrd:    Mapped[str]      = mapped_column( String(255),                       nullable=True)
    hashed_psswrd:   Mapped[str]      = mapped_column( String(255),                       nullable=False)
    description:     Mapped[str]      = mapped_column( Text,                            nullable=True)
    country:         Mapped[str]      = mapped_column( String(100),                     nullable=True)
    is_active:       Mapped[bool]     = mapped_column( Boolean,      default=True,        nullable=False)
    created_at:      Mapped[datetime] = mapped_column( DateTime,     default=func.now(),  nullable=False)

    # Cloudinary attributes
    cloudinary_url:         Mapped[str]      = mapped_column( String(255), nullable=True)
    cloudinary_img_id:      Mapped[str]      = mapped_column( String(100), nullable=True)


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

    # One-to-many relationship with CommentLike --> shows all comment likes by this user
    comment_likes: Mapped[List["CommentLike"]] = relationship(
        "CommentLike",
        back_populates="user",
        cascade="all, delete-orphan"
    )


    #---------------#
    # Serialization #
    #---------------#
    def serialize(self):
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
            
            # Social network metrics
            "followers_count":   len(self.follower_relationships),
            "following_count":   len(self.following_relationships),
            
            "plain_psswrd":      self.plain_psswrd # THIS IS FOR TESTING PURPOSES
            # do not serialize the hashed password, its a security breach
        }


    #-----------------#
    # Helper Methods  #
    #-----------------#
    
    def is_following(self, user):
        """Check if this user is following another user"""
        return any(follow.followed_id == user.id for follow in self.following_relationships)
    
    def is_followed_by(self, user):
        """Check if this user is followed by another user"""
        return any(follow.follower_id == user.id for follow in self.follower_relationships)


    #-----------------#
    # __repr__ Method #
    #-----------------#
    def __repr__(self):
        return f"<User ID {self.id} | Username: {self.username} | Email: {self.email} | Name: {self.full_name} | Plain Password: {self.plain_psswrd}>"



############################################
##########        RECIPE         ###########
############################################

class Recipe(db.Model):
    __tablename__ = "recipe"

    #------------#
    # Attributes #
    #------------#

    # Primary Key and Foreign Keys
    id:           Mapped[int] = mapped_column( Integer,  primary_key=True,      autoincrement=True)
    author_id:    Mapped[int] = mapped_column( Integer,  ForeignKey("user.id",  ondelete="CASCADE"),  nullable=False)

    # Remaining Attributes                                                                       
    title:        Mapped[str]      = mapped_column( String(100),      nullable=False)
    description:  Mapped[str]      = mapped_column( Text,             nullable=True)
    created_at:   Mapped[datetime] = mapped_column( DateTime,         nullable=False,   default=func.now())

    ingredients:  Mapped[List[Dict[str, Any]]] = mapped_column( JSON, nullable=False)
    """ Example structure for INGREDIENTS: 

    ingredients = [
        {
            "ingredient": "flour"
            "quantity":    2,
            "unit":       "cups",
        },
        {
            "ingredient": "salt"
            "quantity":    1,
            "unit":       "tsp",
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


    #---------------#
    # Serialization #
    #---------------#
    def serialize(self):
        return {
            "recipe_id":    self.id,
            "author_id":    self.author_id,
            "title":        self.title,
            "description":  self.description,
            "ingredients":  self.ingredients,   # Will serialize as JSON automatically
            "instructions": self.instructions,  # Will serialize as JSON automatically
            "created_at":   self.created_at.isoformat() if self.created_at else None
        }


    #-----------------#
    # __repr__ Method #
    #-----------------#
    def __repr__(self):
        return f"<Recipe ID {self.id} | Title: {self.title} | Author ID: {self.author_id} | Created: {self.created_at.strftime('%Y-%m-%d') if self.created_at else 'N/A'}>"



############################################
#########       RECIPE IMAGE       #########
############################################

class RecipeImage(db.Model):
    __tablename__ = "recipe_image"

    # Primary Key
    id:        Mapped[int] = mapped_column( Integer, primary_key=True, autoincrement=True)
 
    # Foreign Key to Recipe 
    recipe_id: Mapped[int] = mapped_column( Integer, ForeignKey("recipe.id", ondelete="CASCADE"), nullable=False)

    # Cloudinary fields
    url:          Mapped[str]      = mapped_column( String(255),                      nullable=False)
    image_id:     Mapped[str]      = mapped_column( String(100),                      nullable=False)
    is_primary:   Mapped[bool]     = mapped_column( Boolean,     default=False,       nullable=False)
    display_order: Mapped[int]     = mapped_column( Integer,     default=0,           nullable=False)
    uploaded_at:  Mapped[datetime] = mapped_column( DateTime,    default=func.now(),  nullable=False)

    # Relation Many-to-One with Recipe --> shows the recipe this image is associated with
    recipe: Mapped["Recipe"] = relationship(
        "Recipe",
        back_populates="images"
    )


    #---------------#
    # Serialization #
    #---------------#
    def serialize(self):
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



############################################
##########         FOLLOW        ###########
############################################

class Follow(db.Model):
    __tablename__ = "follow"

    #------------#
    # Attributes #
    #------------#

    # Primary Key
    id:          Mapped[int] = mapped_column( Integer, primary_key=True, autoincrement=True)

    # Foreign Keys
    follower_id: Mapped[int] = mapped_column( Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    followed_id: Mapped[int] = mapped_column( Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)

    # Remaining Attributes
    created_at:  Mapped[datetime] = mapped_column( DateTime, default=func.now(), nullable=False)


    #-------------------#
    # Table Constraints #
    #-------------------#
    __table_args__ = (
        # Prevent users from following themselves
        CheckConstraint("follower_id != followed_id", name='check_no_self_follow'),
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
    def serialize(self):
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



############################################
##########        COMMENT        ###########
############################################

class Comment(db.Model):
    __tablename__ = "comment"

    #------------#
    # Attributes #
    #------------#

    # Primary Key
    id:              Mapped[int]      = mapped_column( Integer,      primary_key=True,                     autoincrement=True)

    # Foreign Keys
    user_id:         Mapped[int]      = mapped_column( Integer,      ForeignKey("user.id",   ondelete="CASCADE"),  nullable=False)
    recipe_id:       Mapped[int]      = mapped_column( Integer,      ForeignKey("recipe.id", ondelete="CASCADE"),  nullable=False)
    parent_comment_id: Mapped[Optional[int]] = mapped_column( Integer, ForeignKey("comment.id", ondelete="CASCADE"), nullable=True)

    # Content and State Fields
    content:         Mapped[str]      = mapped_column( Text,                              nullable=False)
    date_created:    Mapped[date]     = mapped_column( Date,         default=func.current_date(),  nullable=False)
    is_edited:       Mapped[bool]     = mapped_column( Boolean,      default=False,       nullable=False)
    is_pinned:       Mapped[bool]     = mapped_column( Boolean,      default=False,       nullable=False)


    #-------------------#
    # Table Constraints #
    #-------------------#
    __table_args__ = (
        # Ensure comment content is not empty
        CheckConstraint("char_length(content) > 0", name='check_comment_content_not_empty'),
        # Only one pinned comment per recipe (enforced in application logic)
        # Prevent self-referencing at deeper than one level (enforced in application logic)
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


    #-----------------#
    # Helper Methods  #
    #-----------------#
    
    @property
    def like_count(self) -> int:
        """Get the total number of likes for this comment"""
        return len(self.likes)
    
    def is_liked_by(self, user_id: int) -> bool:
        """Check if a specific user has liked this comment"""
        return any(like.user_id == user_id for like in self.likes)
    
    @property
    def replies_count(self) -> int:
        """Get the total number of replies to this comment"""
        return len(self.replies)


    #---------------#
    # Serialization #
    #---------------#
    def serialize(self, include_replies=True, current_user_id=None):
        """
        Serialize comment data
        
        Args:
            include_replies: Whether to include nested replies (default: True)
            current_user_id: ID of the current user to check if they liked the comment
        """
        serialized = {
            "comment_id":       self.id,
            "user_id":          self.user_id,
            "recipe_id":        self.recipe_id,
            "parent_comment_id": self.parent_comment_id,
            "content":          self.content,
            "date_created":     self.date_created.isoformat() if self.date_created else None,
            "is_edited":        self.is_edited,
            "is_pinned":        self.is_pinned,
            "like_count":       self.like_count,
            "replies_count":    self.replies_count,
            
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
                for reply in sorted(self.replies, key=lambda r: r.date_created)
            ]
        
        return serialized


    #-----------------#
    # __repr__ Method #
    #-----------------#
    def __repr__(self):
        content_preview = self.content[:50] + "..." if len(self.content) > 50 else self.content
        return f"<Comment ID {self.id} | Recipe: {self.recipe_id} | Author: {self.user_id} | Content: '{content_preview}' | Likes: {self.like_count}>"



############################################
##########     COMMENT LIKE      ###########
############################################

class CommentLike(db.Model):
    __tablename__ = "comment_like"

    #------------#
    # Attributes #
    #------------#

    # Primary Key
    id:          Mapped[int] = mapped_column( Integer, primary_key=True, autoincrement=True)

    # Foreign Keys
    user_id:     Mapped[int] = mapped_column( Integer, ForeignKey("user.id",    ondelete="CASCADE"), nullable=False)
    comment_id:  Mapped[int] = mapped_column( Integer, ForeignKey("comment.id", ondelete="CASCADE"), nullable=False)

    # Timestamp
    created_at:  Mapped[datetime] = mapped_column( DateTime, default=func.now(), nullable=False)


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
    def serialize(self):
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


