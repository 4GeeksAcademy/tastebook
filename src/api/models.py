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
    hashed_psswrd:   Mapped[str]      = mapped_column( String(255),                       nullable=False)
    profile_url:     Mapped[str]      = mapped_column( String(255),                       nullable=True)
    is_active:       Mapped[bool]     = mapped_column( Boolean,      default=True,        nullable=False)
    created_at:      Mapped[datetime] = mapped_column( DateTime,     default=func.now(),  nullable=False)

    # Cloudinary attributes
    cloudinary_url:         Mapped[str]      = mapped_column( String(255), nullable=True)
    cloudinary_img_id:          Mapped[str]      = mapped_column( String(100), nullable=True)


    #-----------#
    # Relations #
    #-----------#

    # One-to-many relationship with Recipe (author) --> shows all recipes created by this user
    recipes: Mapped[List["Recipe"]] = relationship(
        "Recipe", 
        back_populates="author",
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
            "profile_url": self.profile_url,
            "is_active":   self.is_active,
            "created_at":  self.created_at.isoformat() if self.created_at else None,
            "cloudinary_url": self.cloudinary_url,
            "cloudinary_img_id": self.cloudinary_img_id
            # do not serialize the password, its a security breach
        }



    #-----------------#
    # __repr__ Method #
    #-----------------#
    def __repr__(self):
        return f"<User ID {self.id} | Username: {self.username} | Email: {self.email} | Name: {self.full_name}>"



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
            "id":          self.id,
            "recipe_id":   self.recipe_id,
            "url":         self.url,
            "image_id":    self.image_id,
            "is_primary":  self.is_primary,
            "uploaded_at": self.uploaded_at.isoformat() if self.uploaded_at else None
        }

    #-----------------#
    # __repr__ Method #
    #-----------------#
    def __repr__(self):
        return f"<RecipeImage ID {self.id} | Recipe ID: {self.recipe_id} | Primary: {self.is_primary}>"


