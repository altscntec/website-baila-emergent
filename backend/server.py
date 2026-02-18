from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusCheckCreate(BaseModel):
    client_name: str


class EmailSubscriber(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    city: str
    country: str
    age: int
    subscribed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    source: Optional[str] = "website"


class EmailSubscriberCreate(BaseModel):
    name: str
    email: EmailStr
    city: str
    country: str
    age: int
    source: Optional[str] = "website"


class GalleryImage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    url: str
    alt: str = "Baila Dembow Event"
    order: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class GalleryImageCreate(BaseModel):
    url: str
    alt: Optional[str] = "Baila Dembow Event"


class Event(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    city: str
    venue: str
    date: str
    time: str
    title: str
    description: str
    ticket_url: str
    status: str  # "upcoming", "almost_sold_out", "sold_out"
    price_from: Optional[str] = None
    price_door: Optional[str] = None
    image_url: Optional[str] = None


# Routes
@api_router.get("/")
async def root():
    return {"message": "Baila Dembow API"}


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    _ = await db.status_checks.insert_one(doc)
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks


@api_router.post("/subscribe", response_model=EmailSubscriber)
async def subscribe_email(input: EmailSubscriberCreate):
    """Subscribe an email to the Baila Dembow community"""
    # Check if email already exists
    existing = await db.subscribers.find_one({"email": input.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already subscribed")
    
    subscriber_obj = EmailSubscriber(**input.model_dump())
    doc = subscriber_obj.model_dump()
    doc['subscribed_at'] = doc['subscribed_at'].isoformat()
    
    await db.subscribers.insert_one(doc)
    return subscriber_obj


@api_router.get("/subscribers", response_model=List[EmailSubscriber])
async def get_subscribers():
    """Get all subscribers (admin endpoint)"""
    subscribers = await db.subscribers.find({}, {"_id": 0}).to_list(1000)
    for sub in subscribers:
        if isinstance(sub['subscribed_at'], str):
            sub['subscribed_at'] = datetime.fromisoformat(sub['subscribed_at'])
    return subscribers


@api_router.get("/events", response_model=List[Event])
async def get_events():
    """Get all upcoming events"""
    events = [
        {
            "id": "amsterdam-xl-feb-2026",
            "city": "Amsterdam",
            "venue": "IJland, Amsterdam Noord",
            "date": "2026-02-28",
            "time": "23:00 - 05:00",
            "title": "BAILA DEMBOW XL // IJLAND",
            "description": "¡QUÉ CLASE AMSTERDAM - LLEGÓ LA LEYENDA! For the first time ever, a full tribute to legendary Juan Luis Guerra, performed live by Gerardo Rosales's Combo Mundial. After the tribute, pure reggaeton, dembow, and Latin club heat until the early morning.",
            "ticket_url": "https://weeztix.shop/v9f38e5c",
            "status": "upcoming",
            "price_from": "€10",
            "price_door": "€35",
            "image_url": "https://customer-assets.emergentagent.com/job_baila-dembow/artifacts/c61u2vl4_1600%20X%20900%20%281920%20x%201005%20px%29%20%282%29.png"
        },
        {
            "id": "leiden-march-2026",
            "city": "Leiden",
            "venue": "Wibar Club, Willem Barentszstraat 39",
            "date": "2026-03-14",
            "time": "23:59 - 05:00",
            "title": "BAILA DEMBOW // LEIDEN",
            "description": "LEIDEN, WE'RE COMING FOR YOU. After conquering Amsterdam, London, and dance floors across Europe, Baila Dembow makes history in the Netherlands' oldest university city. Six hours. One warehouse. Zero rules.",
            "ticket_url": "https://weeztix.shop/erxqk52c",
            "status": "almost_sold_out",
            "price_from": "€10",
            "price_door": "€25",
            "image_url": "https://customer-assets.emergentagent.com/job_baila-dembow/artifacts/qe9qcun6_14%20March%20Leiden%20.png"
        },
        {
            "id": "amsterdam-kingsnight-2026",
            "city": "Amsterdam",
            "venue": "IJland, Amsterdam",
            "date": "2026-04-26",
            "time": "23:00 - 05:00",
            "title": "BAILA DEMBOW XL // KINGSNIGHT 2026",
            "description": "We're taking over IJland for King's Night with six hours of dembow, reggaeton, and the Latin sounds that fill our dancefloors every time. This is the XL edition. Bigger venue, longer night, same energy.",
            "ticket_url": "https://weeztix.shop/v9f38e5c",
            "status": "upcoming",
            "price_from": "€15",
            "price_door": "€30",
            "image_url": "https://customer-assets.emergentagent.com/job_baila-dembow/artifacts/d4cz8fiu_26%3A04%20Amsterdam.png"
        }
    ]
    return events


# Gallery endpoints
@api_router.get("/gallery", response_model=List[GalleryImage])
async def get_gallery_images():
    """Get all gallery images ordered by order field"""
    images = await db.gallery.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    for img in images:
        if isinstance(img.get('created_at'), str):
            img['created_at'] = datetime.fromisoformat(img['created_at'])
    
    # If no images in DB, return default images
    if not images:
        default_images = [
            {"id": "default-1", "url": "https://customer-assets.emergentagent.com/job_baila-dembow/artifacts/3jggmoj3_DSC03325%202.JPG", "alt": "Baila Dembow crowd energy", "order": 0},
            {"id": "default-2", "url": "https://customer-assets.emergentagent.com/job_baila-dembow/artifacts/7x9ijnic_DSC03865%202.JPG", "alt": "Atmospheric club lighting", "order": 1},
            {"id": "default-3", "url": "https://customer-assets.emergentagent.com/job_baila-dembow/artifacts/9jxy50ay_BAILA%20DEMBOW%20HALLOWEEN%2031-10-2025%20INSTA-66%202.JPG", "alt": "Halloween event energy", "order": 2},
            {"id": "default-4", "url": "https://customer-assets.emergentagent.com/job_baila-dembow/artifacts/491ta7ee_BAILA%20DEMBOW%20HALLOWEEN%2031-10-2025%20NL-282%202.JPG", "alt": "DJ performing", "order": 3},
            {"id": "default-5", "url": "https://customer-assets.emergentagent.com/job_baila-dembow/artifacts/cad4fk12_BAILA%20DEMBOW%20HALLOWEEN%2031-10-2025%20NL-220%202.JPG", "alt": "Crowd interaction", "order": 4}
        ]
        return default_images
    return images


@api_router.post("/gallery", response_model=GalleryImage)
async def add_gallery_image(input: GalleryImageCreate):
    """Add a new image to the gallery"""
    # Get current max order
    max_order_doc = await db.gallery.find_one(sort=[("order", -1)])
    max_order = max_order_doc["order"] + 1 if max_order_doc else 0
    
    image_obj = GalleryImage(url=input.url, alt=input.alt, order=max_order)
    doc = image_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.gallery.insert_one(doc)
    return image_obj


@api_router.delete("/gallery/{image_id}")
async def delete_gallery_image(image_id: str):
    """Delete an image from the gallery"""
    result = await db.gallery.delete_one({"id": image_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Image not found")
    return {"message": "Image deleted successfully"}


@api_router.put("/gallery/reorder")
async def reorder_gallery_images(image_ids: List[str]):
    """Reorder gallery images by providing list of image IDs in desired order"""
    for index, image_id in enumerate(image_ids):
        await db.gallery.update_one({"id": image_id}, {"$set": {"order": index}})
    return {"message": "Gallery reordered successfully"}


# Admin password (simple protection)
ADMIN_PASSWORD = "bailadembow2024"


@api_router.post("/admin/verify")
async def verify_admin_password(password: str):
    """Verify admin password"""
    if password == ADMIN_PASSWORD:
        return {"valid": True}
    raise HTTPException(status_code=401, detail="Invalid password")


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
