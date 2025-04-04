from fastapi import FastAPI, HTTPException, Response, status
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
import copy

app = FastAPI(
    title="Simple Items API (GET Only)",
    description="A minimal API focusing only on GET /items for Dredd testing.",
    version="1.0.0"
)

# --- Simplified Models based on OpenAPI --- #
class ItemBase(BaseModel):
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

# --- Items Endpoints --- #
@app.get("/items", response_model=List[Item], tags=["Items"])
async def get_items():
    """Get a list of all items."""
    return list(items_db.values())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)
