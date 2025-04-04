from fastapi import FastAPI, HTTPException, Response, status
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
import copy

app = FastAPI(
    title="Simple Items API",
    description="A very simple API to demonstrate GET and POST /items with Dredd.",
    version="1.0.0",
)

# --- Simplified Models based on OpenAPI --- #
class ItemBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)

class ItemCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)

class Item(ItemBase):
    id: int
    createdAt: datetime

# --- Simplified In-memory data store --- #
items_db: Dict[int, Item] = {
    1: Item(id=1, name="Sample Item", description="A sample item description", createdAt=datetime.now()),
    2: Item(id=2, name="Another Item", description=None, createdAt=datetime.now()),
}
next_item_id = 3 # Start next ID from 3

# --- Items Endpoints --- #
@app.get("/items", response_model=List[Item], tags=["Items"])
async def get_items():
    """Get a list of all items."""
    return list(items_db.values())

@app.post("/items", response_model=Item, status_code=status.HTTP_201_CREATED)
async def create_item(item_in: ItemCreate):
    """Create a new item."""
    global next_item_id
    new_id = next_item_id
    new_item = Item(
        id=new_id,
        name=item_in.name,
        description=item_in.description,
        createdAt=datetime.now()
    )
    items_db[new_id] = new_item
    next_item_id += 1
    return new_item

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)
