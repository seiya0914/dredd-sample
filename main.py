from fastapi import FastAPI, HTTPException, status, Depends, Body, Header, Response
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
import copy # Import copy for deep copies

app = FastAPI(
    title="Sample API for Dredd Testing",
    description="This is a sample API server defined in OpenAPI 3.0 to be tested with Dredd.",
    version="1.0.0"
)

# --- Models based on OpenAPI schema ---
class ItemBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)

class ItemCreate(ItemBase):
    pass

class Item(ItemBase):
    id: int
    createdAt: datetime = Field(default_factory=datetime.now)

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, pattern=r'^[a-zA-Z0-9_]+$')
    email: str = Field(..., max_length=100) # In a real app, add email validation
    fullName: Optional[str] = Field(None, max_length=100)

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int

class Config(BaseModel):
    logLevel: str
    featureFlags: Dict[str, bool]

class Status(BaseModel):
    status: str

class Ping(BaseModel):
    message: str

# --- In-memory data stores ---
demo_users_db: Dict[int, User] = {
    1: User(id=1, username="admin", email="admin@example.com", fullName="Administrator"),
    2: User(id=2, username="testuser", email="test@example.com", fullName="Test User")
}

demo_items_db: Dict[int, Item] = {
    1: Item(id=1, name='Default Item 1', description='Description 1', createdAt=datetime.now()),
    2: Item(id=2, name='Default Item 2', description='Description 2', createdAt=datetime.now())
}
next_item_id = 3
next_user_id = 3

# --- Initial State for Reset ---
initial_items_db = copy.deepcopy(demo_items_db)
initial_users_db = copy.deepcopy(demo_users_db)
initial_next_item_id = next_item_id
initial_next_user_id = next_user_id

# --- Endpoints --- #

@app.get("/status", response_model=Status, tags=["Utility"])
async def get_status():
    """Get the status of the API."""
    return Status(status="OK")

@app.get("/ping", response_model=Ping, tags=["Utility"])
async def get_ping():
    """Simple ping endpoint."""
    return Ping(message="pong")

@app.get("/config", response_model=Config, tags=["Configuration"])
async def get_config():
    """Get application configuration."""
    # Example config
    return Config(logLevel="info", featureFlags={"new_dashboard": True, "beta_feature": False})

@app.get("/items", response_model=List[Item], tags=["Items"])
async def get_items():
    """Get a list of all items."""
    return list(demo_items_db.values())

@app.post("/items", response_model=Item, status_code=status.HTTP_201_CREATED, tags=["Items"])
async def create_item(item: ItemCreate):
    """Create a new item."""
    global next_item_id
    new_item = Item(id=next_item_id, **item.model_dump(), createdAt=datetime.now())
    demo_items_db[next_item_id] = new_item
    next_item_id += 1
    return new_item

@app.get("/items/{item_id}", response_model=Item, tags=["Items"])
async def get_item(item_id: int):
    """Get details of a specific item."""
    item = demo_items_db.get(item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    return item

@app.put("/items/{item_id}", response_model=Item, tags=["Items"])
async def update_item(item_id: int, item_update: ItemCreate):
    """Update an existing item."""
    item = demo_items_db.get(item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    # Update fields
    update_data = item_update.model_dump(exclude_unset=True) # Only update provided fields
    # In Pydantic v2, model_copy is preferred for creating a new instance with updated fields
    updated_item = item.model_copy(update=update_data)
    demo_items_db[item_id] = updated_item
    return updated_item

@app.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Items"])
async def delete_item(item_id: int):
    """Delete an item."""
    if item_id not in demo_items_db:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    del demo_items_db[item_id]
    # Return No Content, FastAPI handles empty body for 204
    return Response(status_code=status.HTTP_204_NO_CONTENT) # Explicitly return Response

@app.get("/users", response_model=List[User], tags=["Users"])
async def get_users():
    """Get a list of all users."""
    return list(demo_users_db.values())

@app.post("/users", response_model=User, status_code=status.HTTP_201_CREATED, tags=["Users"])
async def create_user(user: UserCreate):
    """Create a new user."""
    global next_user_id
    # Basic validation (more needed in real app, e.g., email format, unique username)
    if not user.username or not user.email:
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid input data")
    # Check if username or email already exists
    for existing_user in demo_users_db.values():
        if existing_user.username == user.username:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")
        if existing_user.email == user.email:
             raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists")

    new_user_data = user.model_dump()
    new_user = User(id=next_user_id, **new_user_data)
    demo_users_db[next_user_id] = new_user
    next_user_id += 1
    return new_user

@app.get("/users/{user_id}", response_model=User, tags=["Users"])
async def get_user(user_id: int):
    """Get details of a specific user."""
    user = demo_users_db.get(user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

# --- Debug Endpoint ---
@app.post("/debug/reset", status_code=status.HTTP_204_NO_CONTENT, tags=["Debug"])
async def reset_state():
    """Resets the in-memory data stores to their initial state."""
    global demo_items_db, demo_users_db, next_item_id, next_user_id
    print("Resetting server state...")
    demo_items_db = copy.deepcopy(initial_items_db)
    demo_users_db = copy.deepcopy(initial_users_db)
    next_item_id = initial_next_item_id
    next_user_id = initial_next_user_id
    print(f"State reset. Items: {len(demo_items_db)}, Users: {len(demo_users_db)}")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)
