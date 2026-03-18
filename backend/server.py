from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import csv
import io
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import resend

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

# Resend email configuration
resend.api_key = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')


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


# Kingsday Weekender Models
class KingsdaySubscriber(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    normalized_email: str
    verified: bool = False
    verification_token: str = Field(default_factory=lambda: str(uuid.uuid4()))
    has_spun: bool = False
    spin_result: Optional[str] = None
    coupon_code: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    verified_at: Optional[datetime] = None


class KingsdaySubscribeRequest(BaseModel):
    email: EmailStr


class KingsdaySpinRequest(BaseModel):
    email: EmailStr


class SpinResult(BaseModel):
    success: bool
    prize: Optional[str] = None
    coupon_code: Optional[str] = None
    message: str
    email_sent: Optional[bool] = None


class DiscountCode(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    type: str = "10_percent"
    is_used: bool = False
    assigned_email: Optional[str] = None
    assigned_at: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class BulkUploadRequest(BaseModel):
    codes: List[str]


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
            "id": "amsterdam-march-2026",
            "city": "Amsterdam",
            "venue": "Oliva, Rembrandtplein 17",
            "date": "2026-03-28",
            "time": "23:00 - 05:00",
            "title": "BAILA DEMBOW // AMSTERDAM",
            "description": "Baila Dembow takes over Oliva for a night of Reggaeton, Dembow, and pure Latin Caribbean energy. Expect CO2 cannons, confetti, and non-stop perreo. ID required.",
            "ticket_url": "https://shop.ticketapp.com/jvgfntzixg",
            "status": "upcoming",
            "price_from": "€10",
            "price_door": "€25",
            "image_url": "https://customer-assets.emergentagent.com/job_6f6a7dfa-4ba2-45da-a0d7-cabd89498e04/artifacts/1jkedt5t_1600%20X%20900%20%281920%20x%201005%20px%29%20%281920%20x%201080%20px%29.png"
        },
        {
            "id": "rotterdam-april-2026",
            "city": "Rotterdam",
            "venue": "Reverse, Rotterdam",
            "date": "2026-04-04",
            "time": "23:00 - 05:00",
            "title": "BAILA DEMBOW // ROTTERDAM",
            "description": "A full night of reggaeton, dembow, and Latin club energy. Features artists like Bad Bunny, El Alfa, Feid, Karol G, and Daddy Yankee. Early birds sell out fast!",
            "ticket_url": "https://weeztix.shop/4s84rxxa",
            "status": "upcoming",
            "price_from": "€10",
            "price_door": "€25",
            "image_url": "https://customer-assets.emergentagent.com/job_6f6a7dfa-4ba2-45da-a0d7-cabd89498e04/artifacts/pb0bj0h6_2.png"
        },
        {
            "id": "groningen-april-2026",
            "city": "Groningen",
            "venue": "Huize Maas, Groningen",
            "date": "2026-04-18",
            "time": "23:00 - 05:00",
            "title": "BAILA DEMBOW // GRONINGEN",
            "description": "Baila Dembow's FIRST event in Groningen! A full night of reggaeton, dembow, and Latin club energy. Like our sold-out events in Amsterdam, Rotterdam, and London. First edition means first-round ticket prices!",
            "ticket_url": "https://weeztix.shop/n9q3madk",
            "status": "upcoming",
            "price_from": "€10",
            "price_door": "€25",
            "image_url": "https://customer-assets.emergentagent.com/job_6f6a7dfa-4ba2-45da-a0d7-cabd89498e04/artifacts/o855nyo1_3.png"
        },
        {
            "id": "rotterdam-kingsnight-2026",
            "city": "Rotterdam",
            "venue": "Reverse, Rotterdam",
            "date": "2026-04-26",
            "time": "23:00 - 05:00",
            "title": "BAILA DEMBOW // ROTTERDAM - KONINGSNACHT",
            "description": "A Latin upgrade for Koningsnacht in Rotterdam! Reggaeton, dembow, and Latin club energy. Bad Bunny, El Alfa, Feid, Karol G, Daddy Yankee all night.",
            "ticket_url": "https://weeztix.shop/b6a5k7b6",
            "status": "upcoming",
            "price_from": "€12",
            "price_door": "€25",
            "image_url": "https://customer-assets.emergentagent.com/job_6f6a7dfa-4ba2-45da-a0d7-cabd89498e04/artifacts/xy2dceom_5.png"
        },
        {
            "id": "amsterdam-kingsnight-2026",
            "city": "Amsterdam",
            "venue": "IJland, Amsterdam",
            "date": "2026-04-26",
            "time": "23:00 - 05:00",
            "title": "BAILA DEMBOW XL // IJLAND - KINGSNIGHT 2026",
            "description": "The XL edition for King's Night in Amsterdam! Six hours of dembow, reggaeton, and Latin sounds. Packed floors, proper sound system. Limited capacity.",
            "ticket_url": "https://weeztix.shop/v9f38e5c",
            "status": "upcoming",
            "price_from": "€15",
            "price_door": "€30",
            "image_url": "https://customer-assets.emergentagent.com/job_baila-dembow/artifacts/d4cz8fiu_26%3A04%20Amsterdam.png"
        },
        {
            "id": "amsterdam-blockparty-kingsday-2026",
            "city": "Amsterdam",
            "venue": "Ferdinand Bolstraat 81h",
            "date": "2026-04-27",
            "time": "16:00 - 20:00",
            "title": "BAILA DEMBOW // LATIN BLOCK PARTY - KONINGSDAG",
            "description": "Amsterdam's FIRST Latin Block Party for Koningsdag! Outdoor celebration with grills, Latin flavor food, drinks, salsa & bachata with live percussion, and reggaeton.",
            "ticket_url": "",
            "status": "upcoming",
            "price_from": "FREE",
            "price_door": "FREE",
            "image_url": "https://customer-assets.emergentagent.com/job_6f6a7dfa-4ba2-45da-a0d7-cabd89498e04/artifacts/zsicqqq5_6.png"
        },
        {
            "id": "amsterdam-oliva-kingsday-2026",
            "city": "Amsterdam",
            "venue": "Oliva, Rembrandtplein 17",
            "date": "2026-04-27",
            "time": "20:00 - Late",
            "title": "BAILA DEMBOW // AMSTERDAM - KONINGSDAG",
            "description": "King's Day special edition at Oliva! After the street festivities, continue with reggaeton, dembow, and Latin club energy. Bad Bunny, El Alfa, Feid, Karol G, Daddy Yankee.",
            "ticket_url": "https://ticketapp.shop/jvgfntofbe",
            "status": "upcoming",
            "price_from": "€15",
            "price_door": "€25",
            "image_url": "https://customer-assets.emergentagent.com/job_6f6a7dfa-4ba2-45da-a0d7-cabd89498e04/artifacts/9tn4xu43_4.png"
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


# ==================== KINGSDAY WEEKENDER ENDPOINTS ====================

import random
import hashlib
import re

def normalize_email(email: str) -> str:
    """Normalize email to prevent alias abuse (e.g., john+promo@gmail.com -> john@gmail.com)"""
    email = email.lower().strip()
    local, domain = email.split('@')
    
    # Remove everything after + for gmail and common providers
    if domain in ['gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'yahoo.com']:
        local = local.split('+')[0]
        # Remove dots for gmail (they're ignored)
        if domain in ['gmail.com', 'googlemail.com']:
            local = local.replace('.', '')
    
    return f"{local}@{domain}"


def generate_coupon_code(prize: str) -> str:
    """Generate a unique coupon code for winners"""
    prefix = {
        "Free Ticket": "KING-FREE",
        "Backstage Pass": "KING-VIP",
        "Weekender Ticket": "KING-WEEK",
        "10% Discount": "KING-10OFF"
    }.get(prize, "KING")
    
    unique_part = str(uuid.uuid4())[:8].upper()
    return f"{prefix}-{unique_part}"


def spin_wheel() -> str:
    """Spin the wheel with weighted probabilities. Total win rate = 10%"""
    prizes = [
        ("Free Ticket", 2),           # 2%
        ("Backstage Pass", 1),        # 1%
        ("Weekender Ticket", 1),      # 1%
        ("10% Discount", 6),          # 6%
        ("Better Luck Next Time", 90) # 90%
    ]
    
    total_weight = sum(weight for _, weight in prizes)
    random_num = random.randint(1, total_weight)
    
    current_weight = 0
    for prize, weight in prizes:
        current_weight += weight
        if random_num <= current_weight:
            return prize
    
    return "Better Luck Next Time"


async def assign_discount_code(email: str) -> Optional[str]:
    """Fetch an unused discount code and assign it to the given email"""
    result = await db.discount_codes.find_one_and_update(
        {"is_used": False},
        {"$set": {
            "is_used": True,
            "assigned_email": email,
            "assigned_at": datetime.now(timezone.utc).isoformat()
        }},
        projection={"_id": 0},
        return_document=True
    )
    if result:
        return result.get("code")
    return None


async def send_discount_email(email: str, code: str) -> bool:
    """Send discount code email to user via Resend"""
    if not resend.api_key:
        logger.warning("RESEND_API_KEY not set, skipping email send")
        return False

    html_content = f"""
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FAF8F5; padding: 0;">
      <div style="background: linear-gradient(135deg, #2C2420 0%, #1a1512 100%); padding: 48px 32px; text-align: center;">
        <div style="margin-bottom: 16px;">
          <span style="display: inline-block; width: 48px; height: 2px; background-color: #8B3A3A; margin-right: 8px;"></span>
          <span style="display: inline-block; width: 48px; height: 2px; background-color: rgba(255,255,255,0.8); margin-right: 8px;"></span>
          <span style="display: inline-block; width: 48px; height: 2px; background-color: #3A4A6B;"></span>
        </div>
        <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 8px 0; letter-spacing: 2px;">BAILA DEMBOW</h1>
        <p style="color: #D4622A; font-size: 14px; letter-spacing: 3px; margin: 0;">KINGSDAY WEEKENDER 2026</p>
      </div>

      <div style="padding: 48px 32px; text-align: center;">
        <div style="width: 64px; height: 64px; background-color: rgba(212, 98, 42, 0.15); border-radius: 50%; margin: 0 auto 24px; line-height: 64px; font-size: 28px;">
          &#127881;
        </div>
        <h2 style="color: #2C2420; font-size: 24px; font-weight: 700; margin: 0 0 12px 0;">You Won a 10% Discount!</h2>
        <p style="color: #6B5E54; font-size: 16px; margin: 0 0 32px 0; line-height: 1.6;">
          Congratulations! You spun the Kingsday Weekender wheel and unlocked an exclusive discount for our events.
        </p>

        <div style="background-color: #F5F0E8; border-radius: 16px; padding: 28px; margin: 0 0 32px 0;">
          <p style="color: #6B5E54; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px 0;">Your Discount Code</p>
          <p style="color: #D4622A; font-size: 32px; font-weight: 700; font-family: 'Courier New', monospace; margin: 0; letter-spacing: 4px;">{code}</p>
        </div>

        <div style="background-color: #F5F0E8; border-radius: 12px; padding: 20px; margin: 0 0 32px 0; text-align: left;">
          <p style="color: #2C2420; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">How to use your code:</p>
          <p style="color: #6B5E54; font-size: 14px; margin: 0 0 8px 0;">1. Go to the ticket page for any Kingsday Weekender event</p>
          <p style="color: #6B5E54; font-size: 14px; margin: 0 0 8px 0;">2. Select your tickets and proceed to checkout</p>
          <p style="color: #6B5E54; font-size: 14px; margin: 0;">3. Enter code <strong style="color: #D4622A;">{code}</strong> to get 10% off</p>
        </div>

        <a href="https://bailadembow.com/#/events/kingsday-weekender-2026" style="display: inline-block; background: linear-gradient(135deg, #D4622A 0%, #B8501F 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-size: 16px; font-weight: 600; letter-spacing: 0.5px;">
          Get Your Tickets
        </a>
      </div>

      <div style="background-color: #2C2420; padding: 32px; text-align: center;">
        <p style="color: rgba(255,255,255,0.6); font-size: 12px; margin: 0 0 8px 0;">Baila Dembow &middot; Kingsday Weekender 2026</p>
        <p style="color: rgba(255,255,255,0.4); font-size: 11px; margin: 0;">Amsterdam &amp; Rotterdam &middot; April 26-27, 2026</p>
      </div>
    </div>
    """

    params = {
        "from": SENDER_EMAIL,
        "to": [email],
        "subject": "You unlocked a Kingsday reward \U0001f389",
        "html": html_content
    }

    try:
        email_response = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Discount email sent to {email}, id: {email_response}")
        return True
    except Exception as e:
        logger.error(f"Failed to send discount email to {email}: {str(e)}")
        return False


@api_router.post("/kingsday/subscribe")
async def kingsday_subscribe(request: KingsdaySubscribeRequest):
    """Subscribe to Kingsday Weekender and get verification email"""
    normalized = normalize_email(request.email)
    
    # Check if already subscribed
    existing = await db.kingsday_subscribers.find_one({"normalized_email": normalized}, {"_id": 0})
    
    if existing:
        if existing.get('verified'):
            return {
                "success": True,
                "message": "You're already verified! You can spin the wheel.",
                "verified": True,
                "has_spun": existing.get('has_spun', False)
            }
        else:
            return {
                "success": True,
                "message": "Please check your email for the verification link.",
                "verified": False,
                "verification_token": existing.get('verification_token')
            }
    
    # Create new subscriber
    subscriber = KingsdaySubscriber(
        email=request.email,
        normalized_email=normalized
    )
    
    doc = subscriber.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.kingsday_subscribers.insert_one(doc)
    
    # In production, send verification email here
    # For now, return the token for testing
    return {
        "success": True,
        "message": "Please check your email for the verification link.",
        "verified": False,
        "verification_token": subscriber.verification_token
    }


@api_router.get("/kingsday/verify/{token}")
async def verify_kingsday_email(token: str):
    """Verify email for Kingsday Weekender"""
    subscriber = await db.kingsday_subscribers.find_one({"verification_token": token}, {"_id": 0})
    
    if not subscriber:
        raise HTTPException(status_code=404, detail="Invalid verification token")
    
    if subscriber.get('verified'):
        return {"success": True, "message": "Email already verified!", "already_verified": True}
    
    # Update subscriber as verified
    await db.kingsday_subscribers.update_one(
        {"verification_token": token},
        {"$set": {"verified": True, "verified_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"success": True, "message": "Email verified! You can now spin the wheel.", "already_verified": False}


@api_router.get("/kingsday/check-eligibility")
async def check_spin_eligibility(email: str):
    """Check if user is eligible to spin"""
    normalized = normalize_email(email)
    subscriber = await db.kingsday_subscribers.find_one({"normalized_email": normalized}, {"_id": 0})
    
    if not subscriber:
        return {"eligible": False, "reason": "not_subscribed", "message": "Please subscribe first"}
    
    if not subscriber.get('verified'):
        return {"eligible": False, "reason": "not_verified", "message": "Please verify your email first"}
    
    if subscriber.get('has_spun'):
        return {
            "eligible": False,
            "reason": "already_spun",
            "message": "You've already spun the wheel",
            "previous_result": subscriber.get('spin_result'),
            "coupon_code": subscriber.get('coupon_code')
        }
    
    return {"eligible": True, "message": "You're eligible to spin!"}


@api_router.post("/kingsday/spin")
async def kingsday_spin(request: KingsdaySpinRequest):
    """Spin the wheel for Kingsday prizes"""
    normalized = normalize_email(request.email)
    subscriber = await db.kingsday_subscribers.find_one({"normalized_email": normalized}, {"_id": 0})
    
    if not subscriber:
        raise HTTPException(status_code=400, detail="Please subscribe first")
    
    if not subscriber.get('verified'):
        raise HTTPException(status_code=400, detail="Please verify your email first")
    
    if subscriber.get('has_spun'):
        return SpinResult(
            success=False,
            prize=subscriber.get('spin_result'),
            coupon_code=subscriber.get('coupon_code'),
            message="You've already spun the wheel"
        )
    
    # Spin the wheel
    prize = spin_wheel()
    coupon_code = None
    email_sent = None
    
    if prize == "10% Discount":
        # Assign a real discount code from the database
        coupon_code = await assign_discount_code(request.email)
        if not coupon_code:
            # No codes left - change prize to fallback
            prize = "Better Luck Next Time"
            logger.warning("No discount codes available, falling back to 'Better Luck Next Time'")
        else:
            # Send the discount code via email
            email_sent = await send_discount_email(request.email, coupon_code)
    elif prize != "Better Luck Next Time":
        # Other prizes still use auto-generated codes
        coupon_code = generate_coupon_code(prize)
    
    # Update subscriber with spin result
    await db.kingsday_subscribers.update_one(
        {"normalized_email": normalized},
        {"$set": {
            "has_spun": True,
            "spin_result": prize,
            "coupon_code": coupon_code
        }}
    )
    
    return SpinResult(
        success=True,
        prize=prize,
        coupon_code=coupon_code if prize != "10% Discount" else None,
        message=f"Congratulations! You won: {prize}" if prize != "Better Luck Next Time" else "Better luck next time!",
        email_sent=email_sent
    )


@api_router.get("/kingsday/events")
async def get_kingsday_events():
    """Get all Kingsday Weekender events"""
    events = [
        {
            "id": "kingsnight-ijland-2026",
            "title": "Kingsnight Main Event – IJland Amsterdam",
            "date": "2026-04-26",
            "time": "23:00 - 05:00",
            "venue": "IJland, Amsterdam",
            "description": "The ultimate Kingsnight celebration with 6 hours of dembow, reggaeton, and Latin sounds. XL edition with bigger venue and longer night.",
            "ticket_url": "https://weeztix.shop/v9f38e5c",
            "price_from": "€15",
            "type": "main"
        },
        {
            "id": "kingsday-street-party-2026",
            "title": "Kingsday Street Party",
            "date": "2026-04-27",
            "time": "12:00 - 20:00",
            "venue": "Amsterdam City Center",
            "description": "Free outdoor street party celebrating Kingsday with live DJs, dance competitions, and Latin vibes.",
            "ticket_url": "",
            "price_from": "FREE",
            "type": "free"
        },
        {
            "id": "rotterdam-kingsday-2026",
            "title": "Rotterdam Kingsday Party",
            "date": "2026-04-27",
            "time": "22:00 - 05:00",
            "venue": "Club Reverse, Rotterdam",
            "description": "Rotterdam's biggest Kingsday Latin party. Non-stop reggaeton and dembow until sunrise.",
            "ticket_url": "https://weeztix.shop/qa84k5a6",
            "price_from": "€12",
            "type": "party"
        },
        {
            "id": "amsterdam-oliva-kingsday-2026",
            "title": "Amsterdam Oliva Kingsday Party",
            "date": "2026-04-27",
            "time": "23:00 - 05:00",
            "venue": "Oliva, Rembrandtplein 17, Amsterdam",
            "description": "Kingsday afterparty at Amsterdam's hottest Latin venue. CO2 cannons, confetti, pure Caribbean energy.",
            "ticket_url": "https://shop.ticketapp.com/jvgfntzixg",
            "price_from": "€15",
            "type": "party"
        }
    ]
    return events


# ==================== DISCOUNT CODE ADMIN ENDPOINTS ====================

@api_router.post("/admin/discount-codes/upload")
async def upload_discount_codes(request: BulkUploadRequest):
    """Bulk upload discount codes (admin only)"""
    if not request.codes:
        raise HTTPException(status_code=400, detail="No codes provided")
    
    inserted = 0
    skipped = 0
    for code in request.codes:
        code = code.strip().upper()
        if not code:
            continue
        existing = await db.discount_codes.find_one({"code": code})
        if existing:
            skipped += 1
            continue
        doc = DiscountCode(code=code).model_dump()
        await db.discount_codes.insert_one(doc)
        inserted += 1
    
    return {
        "success": True,
        "inserted": inserted,
        "skipped": skipped,
        "message": f"Uploaded {inserted} new codes ({skipped} duplicates skipped)"
    }


@api_router.post("/admin/discount-codes/upload-csv")
async def upload_discount_codes_csv(file: UploadFile = File(...)):
    """Upload discount codes from a CSV file"""
    content = await file.read()
    text = content.decode('utf-8-sig')
    reader = csv.DictReader(io.StringIO(text))
    
    codes = []
    for row in reader:
        code = row.get('Code', '').strip()
        if code:
            codes.append(code)
    
    if not codes:
        raise HTTPException(status_code=400, detail="No codes found in CSV")
    
    inserted = 0
    skipped = 0
    for code in codes:
        code = code.strip().upper()
        existing = await db.discount_codes.find_one({"code": code})
        if existing:
            skipped += 1
            continue
        doc = DiscountCode(code=code).model_dump()
        await db.discount_codes.insert_one(doc)
        inserted += 1
    
    return {
        "success": True,
        "inserted": inserted,
        "skipped": skipped,
        "total_in_file": len(codes),
        "message": f"Uploaded {inserted} new codes ({skipped} duplicates skipped)"
    }


@api_router.get("/admin/discount-codes")
async def get_discount_codes(status: Optional[str] = None):
    """Get all discount codes with optional filtering. status: 'used', 'unused', or None for all"""
    query = {}
    if status == "used":
        query["is_used"] = True
    elif status == "unused":
        query["is_used"] = False
    
    codes = await db.discount_codes.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return codes


@api_router.get("/admin/discount-codes/stats")
async def get_discount_code_stats():
    """Get discount code statistics"""
    total = await db.discount_codes.count_documents({})
    used = await db.discount_codes.count_documents({"is_used": True})
    unused = await db.discount_codes.count_documents({"is_used": False})
    
    # Get recently assigned codes
    recent = await db.discount_codes.find(
        {"is_used": True},
        {"_id": 0}
    ).sort("assigned_at", -1).limit(10).to_list(10)
    
    return {
        "total": total,
        "used": used,
        "unused": unused,
        "recent_assignments": recent
    }


# ==================== END KINGSDAY ENDPOINTS ====================


# Admin password from environment variable
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")


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


@app.on_event("startup")
async def seed_discount_codes():
    """Seed discount codes from CSV on startup if the collection is empty"""
    count = await db.discount_codes.count_documents({})
    if count > 0:
        logger.info(f"Discount codes already seeded ({count} codes in DB)")
        return
    
    csv_path = ROOT_DIR / 'spin_and_win.csv'
    if not csv_path.exists():
        logger.warning("spin_and_win.csv not found, skipping seed")
        return
    
    codes = []
    with open(csv_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            code = row.get('Code', '').strip()
            if code:
                codes.append(code.upper())
    
    if not codes:
        logger.warning("No codes found in CSV")
        return
    
    docs = [DiscountCode(code=code).model_dump() for code in codes]
    await db.discount_codes.insert_many(docs)
    logger.info(f"Seeded {len(docs)} discount codes from CSV")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
