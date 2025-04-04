from fastapi import FastAPI, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
import datetime
from sqlmodel import SQLModel, Field as SQLField, create_engine, Session, select

DATABASE_URL = "sqlite:///./items.db"

engine = create_engine(DATABASE_URL, echo=True)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

app = FastAPI(
    title="Simple Items API (SQLite)",
    description="A simple API using SQLite and SQLModel to demonstrate GET and POST /items.",
    version="1.0.0",
    on_startup=[create_db_and_tables],
)

class ItemCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)

class Item(SQLModel, table=True):
    id: Optional[int] = SQLField(default=None, primary_key=True)
    name: str = SQLField(index=True, max_length=100)
    description: Optional[str] = SQLField(default=None, max_length=500)
    createdAt: datetime.datetime = SQLField(default_factory=lambda: datetime.datetime.now(datetime.timezone.utc))

def get_session():
    with Session(engine) as session:
        yield session

@app.get("/items", response_model=List[Item])
async def get_items(session: Session = Depends(get_session)):
    """Get a list of all items from the database."""
    items = session.exec(select(Item)).all()
    return items

@app.post("/items", response_model=Item, status_code=status.HTTP_201_CREATED)
async def create_item(item_in: ItemCreate, session: Session = Depends(get_session)):
    """Create a new item and save it to the database."""
    db_item = Item.model_validate(item_in)
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)
