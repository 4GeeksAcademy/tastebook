from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column

db = SQLAlchemy()

class User(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean(), nullable=False)


    def serialize(self):
        return {
            "id": self.id,
            "email": self.email,
            # do not serialize the password, its a security breach
        }

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Boolean, DateTime, Date, ForeignKey, Integer, String, Text, JSON, func, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

from datetime import datetime, date
from typing import List, Optional, Dict, Any



#########################################################################################
#########################################################################################
#############                            TABLES                             #############
#############                          TasteBook                            #############
#############                           Database                            #############
#############                       with SQL Alchemy                        #############
#########################################################################################
#########################################################################################


db = SQLAlchemy()


############################################
###########         User         ###########
############################################

class User(db.Model):
    __tablename__ = "user"

    ###------------###
    ### ATTRIBUTES ###
    ###------------###

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


    ### RELATIONS ###

    # One-to-many relationship with Recipe (author) --> shows all recipes created by this user
    recipes: Mapped[List["Recipe"]] = relationship(
        "Recipe", 
        back_populates="author",
        cascade="all, delete-orphan"
    )


    ### SERIALIZATION ###
    def serialize(self):
        return {
            "user_id":     self.id,
            "email":       self.email,
            "username":    self.username,
            "full_name":   self.full_name,
            "profile_url": self.profile_url,
            "is_active":   self.is_active,
            "created_at":  self.created_at.isoformat() if self.created_at else None
        }


    ### __repr__ METHOD ###
    def __repr__(self):
        return f"<User ID {self.id} | Username: {self.username} | Email: {self.email} | Name: {self.full_name}>"



############################################
##########        Recipe          ##########
############################################

class Recipe(db.Model):
    __tablename__ = "recipe"


    ### ATTRIBUTES ###

    # Primary Key and Foreign Keys
    id:           Mapped[int]  = mapped_column( Integer, primary_key=True,     autoincrement=True)
    author_id:    Mapped[int]  = mapped_column( Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)

    # Remaining Attributes                                                                       
    title:        Mapped[str]  = mapped_column( String(100),     nullable=False)
    description:  Mapped[str]  = mapped_column( Text,            nullable=True)
    
    # OPTION 1: Store as structured JSON (RECOMMENDED)
    ingredients:  Mapped[List[Dict[str, Any]]] = mapped_column( JSON,                    nullable=False)
    # Example structure: [{"quantity": 2, "unit": "cups", "ingredient": "flour"}, {"quantity": 1, "unit": "tsp", "ingredient": "salt"}]
    
    instructions: Mapped[List[str]] = mapped_column( JSON,                               nullable=False)
    # Example structure: ["Preheat oven to 350°F", "Mix dry ingredients", "Bake for 25 minutes"]
    
    # OPTION 2: Store as plain text (uncomment if you prefer this approach)
    # ingredients:  Mapped[str]      = mapped_column( Text,                                nullable=False)
    # instructions: Mapped[str]      = mapped_column( Text,                                nullable=False)
    
    created_at:   Mapped[datetime] = mapped_column( DateTime,      default=func.now(),   nullable=False)


    ### TABLE CONSTRAINTS ###
    __table_args__ = (
        CheckConstraint("json_array_length(ingredients) > 0",  name='check_has_ingredients'),
        CheckConstraint("json_array_length(instructions) > 0", name='check_has_instructions'),
        CheckConstraint("char_length(title) > 0",              name='check_title_not_empty'),
    )


    ### RELATIONS ###

    # Many-to-one relationship with User (recipes) --> shows the author of the recipe
    author: Mapped["User"] = relationship(
        "User", 
        back_populates="recipes"
    )


    ### SERIALIZATION ###
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


    ### HELPER METHODS (if using JSON structure) ###
    def add_ingredient(self, quantity: float, unit: str, ingredient: str):
        """Add an ingredient to the recipe"""
        if not self.ingredients:
            self.ingredients = []
        self.ingredients.append({
            "quantity": quantity,
            "unit": unit,
            "ingredient": ingredient
        })

    def add_instruction(self, instruction: str):
        """Add an instruction step to the recipe"""
        if not self.instructions:
            self.instructions = []
        self.instructions.append(instruction)

    def get_ingredients_text(self) -> str:
        """Get ingredients as formatted text"""
        if not self.ingredients:
            return ""
        return "\n".join([
            f"• {ing['quantity']} {ing['unit']} {ing['ingredient']}"
            for ing in self.ingredients
        ])

    def get_instructions_text(self) -> str:
        """Get instructions as formatted text"""
        if not self.instructions:
            return ""
        return "\n".join([
            f"{i+1}. {instruction}"
            for i, instruction in enumerate(self.instructions)
        ])


    ### __repr__ METHOD ###
    def __repr__(self):
        return f"<Recipe ID {self.id} | Title: {self.title} | Author ID: {self.author_id} | Created: {self.created_at.strftime('%Y-%m-%d') if self.created_at else 'N/A'}>"



#########################################################################################
#############                     USAGE EXAMPLES                            #############
#########################################################################################

# Example of creating a recipe with structured data:
"""
# Create user
user = User(
    email="chef@example.com",
    username="masterchef",
    full_name="Gordon Ramsay",
    hashed_password="hashed_password_here"
)

# Create recipe
recipe = Recipe(
    author_id=user.id,
    title="Classic Chocolate Chip Cookies",
    description="Delicious homemade chocolate chip cookies",
    ingredients=[
        {"quantity": 2.25, "unit": "cups", "ingredient": "all-purpose flour"},
        {"quantity": 1, "unit": "tsp", "ingredient": "baking soda"},
        {"quantity": 1, "unit": "tsp", "ingredient": "salt"},
        {"quantity": 1, "unit": "cup", "ingredient": "butter, softened"},
        {"quantity": 0.75, "unit": "cup", "ingredient": "granulated sugar"},
        {"quantity": 0.75, "unit": "cup", "ingredient": "brown sugar"},
        {"quantity": 2, "unit": "large", "ingredient": "eggs"},
        {"quantity": 2, "unit": "tsp", "ingredient": "vanilla extract"},
        {"quantity": 2, "unit": "cups", "ingredient": "chocolate chips"}
    ],
    instructions=[
        "Preheat oven to 375°F (190°C)",
        "In a medium bowl, whisk together flour, baking soda, and salt",
        "In a large bowl, cream together butter and both sugars until light and fluffy",
        "Beat in eggs one at a time, then add vanilla",
        "Gradually blend in flour mixture",
        "Stir in chocolate chips",
        "Drop rounded tablespoons of dough onto ungreased cookie sheets",
        "Bake 9-11 minutes or until golden brown",
        "Cool on baking sheet for 2 minutes, then transfer to wire rack"
    ]
)
"""


ingredients = [
    {
        "quantity": 2,
        "unit": "cups",
        "ingredient": "flour"
    },
    {
        "quantity": 1,
        "unit": "tsp",
        "ingredient": "salt"
    }
]


instructions = [
    "Preheat oven to 350°F",
    "Mix dry ingredients",
    "Bake for 25 minutes"
]

