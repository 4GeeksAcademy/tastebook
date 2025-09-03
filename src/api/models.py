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
            "created_at":  self.created_at.isoformat() if self.created_at else None
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