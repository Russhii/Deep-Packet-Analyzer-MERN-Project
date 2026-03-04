from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

class AppType(str, Enum):
    UNKNOWN = "Unknown"
    HTTP = "HTTP"
    HTTPS = "HTTPS"
    DNS = "DNS"
    YOUTUBE = "YouTube"
    FACEBOOK = "Facebook"
    GOOGLE = "Google"
    TIKTOK = "TikTok"
    INSTAGRAM = "Instagram"
    TWITTER = "Twitter"
    NETFLIX = "Netflix"
    AMAZON = "Amazon"
    GITHUB = "GitHub"
    WHATSAPP = "WhatsApp"

class RuleType(str, Enum):
    IP = "ip"
    APP = "app"
    DOMAIN = "domain"

class Capture(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    file_path: str
    upload_time: datetime = Field(default_factory=datetime.utcnow)
    file_size: int
    analyzed: bool = False
    analysis_time: Optional[datetime] = None

class Flow(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    capture_id: str
    src_ip: str
    dst_ip: str
    src_port: int
    dst_port: int
    protocol: str
    app_type: AppType = AppType.UNKNOWN
    sni: Optional[str] = None
    packet_count: int = 0
    byte_count: int = 0
    blocked: bool = False
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None
    # ML Classification fields
    ml_category: Optional[str] = None
    ml_confidence: Optional[float] = None
    ml_probabilities: Optional[Dict[str, float]] = None

class AnalysisReport(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    capture_id: str
    total_packets: int = 0
    total_bytes: int = 0
    tcp_packets: int = 0
    udp_packets: int = 0
    forwarded: int = 0
    dropped: int = 0
    app_breakdown: Dict[str, int] = {}
    detected_domains: List[str] = []
    analysis_time: datetime = Field(default_factory=datetime.utcnow)
    # ML Classification stats
    ml_category_breakdown: Optional[Dict[str, int]] = None
    ml_feature_importance: Optional[Dict[str, float]] = None

class BlockingRule(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    rule_type: RuleType
    value: str  # IP address, app name, or domain pattern
    description: Optional[str] = None
    enabled: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class BlockingRuleCreate(BaseModel):
    rule_type: RuleType
    value: str
    description: Optional[str] = None
    enabled: bool = True

class BlockingRuleUpdate(BaseModel):
    enabled: Optional[bool] = None
    description: Optional[str] = None
