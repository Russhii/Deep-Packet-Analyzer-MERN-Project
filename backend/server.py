from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from models import (
    Capture, Flow, AnalysisReport, BlockingRule, 
    BlockingRuleCreate, BlockingRuleUpdate, AppType, RuleType
)
from pcap_analyzer import PcapAnalyzer
from typing import List
import shutil
from datetime import datetime

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create uploads directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Create the main app without a prefix
app = FastAPI(title="Packet Analyzer DPI Engine")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== CAPTURE ENDPOINTS ====================

@api_router.post("/captures/upload", response_model=Capture)
async def upload_pcap(pcap: UploadFile = File(...)):
    """Upload a PCAP file"""
    try:
        # Validate file extension
        if not pcap.filename.endswith(('.pcap', '.pcapng')):
            raise HTTPException(status_code=400, detail="Only PCAP files are allowed")
        
        # Create capture record
        capture = Capture(
            filename=pcap.filename,
            file_path="",
            file_size=0
        )
        
        # Save file
        file_path = UPLOAD_DIR / f"{capture.id}_{pcap.filename}"
        with open(file_path, "wb") as f:
            content = await pcap.read()
            f.write(content)
            capture.file_size = len(content)
        
        capture.file_path = str(file_path)
        
        # Save to database
        doc = capture.model_dump()
        doc['upload_time'] = doc['upload_time'].isoformat()
        await db.captures.insert_one(doc)
        
        logger.info(f"Uploaded PCAP: {capture.filename} ({capture.file_size} bytes)")
        return capture
    
    except Exception as e:
        logger.error(f"Error uploading PCAP: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/captures", response_model=List[Capture])
async def list_captures():
    """List all captures"""
    try:
        captures = await db.captures.find({}, {"_id": 0}).to_list(1000)
        
        # Convert ISO strings back to datetime
        for cap in captures:
            if isinstance(cap['upload_time'], str):
                cap['upload_time'] = datetime.fromisoformat(cap['upload_time'])
            if cap.get('analysis_time') and isinstance(cap['analysis_time'], str):
                cap['analysis_time'] = datetime.fromisoformat(cap['analysis_time'])
        
        return captures
    except Exception as e:
        logger.error(f"Error listing captures: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/captures/{capture_id}", response_model=Capture)
async def get_capture(capture_id: str):
    """Get a specific capture"""
    try:
        capture = await db.captures.find_one({"id": capture_id}, {"_id": 0})
        if not capture:
            raise HTTPException(status_code=404, detail="Capture not found")
        
        # Convert ISO strings back to datetime
        if isinstance(capture['upload_time'], str):
            capture['upload_time'] = datetime.fromisoformat(capture['upload_time'])
        if capture.get('analysis_time') and isinstance(capture['analysis_time'], str):
            capture['analysis_time'] = datetime.fromisoformat(capture['analysis_time'])
        
        return capture
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting capture: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/captures/{capture_id}/analyze")
async def analyze_capture(capture_id: str):
    """Run DPI analysis on a capture"""
    try:
        # Get capture
        capture = await db.captures.find_one({"id": capture_id}, {"_id": 0})
        if not capture:
            raise HTTPException(status_code=404, detail="Capture not found")
        
        # Get blocking rules
        rules = await db.rules.find({"enabled": True}, {"_id": 0}).to_list(1000)
        
        # Run analysis
        logger.info(f"Starting analysis of capture {capture_id}")
        analyzer = PcapAnalyzer(capture['file_path'], capture_id, rules)
        flows, report = analyzer.analyze()
        
        # Store flows
        flow_docs = [flow.model_dump() for flow in flows]
        for flow in flow_docs:
            if flow.get('first_seen'):
                flow['first_seen'] = flow['first_seen'].isoformat()
            if flow.get('last_seen'):
                flow['last_seen'] = flow['last_seen'].isoformat()
        
        if flow_docs:
            await db.flows.insert_many(flow_docs)
        
        # Store report
        report_doc = report.model_dump()
        report_doc['analysis_time'] = report_doc['analysis_time'].isoformat()
        await db.reports.insert_one(report_doc)
        
        # Update capture
        await db.captures.update_one(
            {"id": capture_id},
            {"$set": {
                "analyzed": True,
                "analysis_time": datetime.utcnow().isoformat()
            }}
        )
        
        logger.info(f"Analysis complete: {len(flows)} flows, {report.total_packets} packets")
        
        return {
            "message": "Analysis complete",
            "flows_count": len(flows),
            "total_packets": report.total_packets
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing capture: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# ==================== ANALYSIS ENDPOINTS ====================

@api_router.get("/analysis/report/{capture_id}", response_model=AnalysisReport)
async def get_analysis_report(capture_id: str):
    """Get analysis report for a capture"""
    try:
        report = await db.reports.find_one({"capture_id": capture_id}, {"_id": 0})
        if not report:
            raise HTTPException(status_code=404, detail="Analysis report not found")
        
        # Convert ISO string back to datetime
        if isinstance(report['analysis_time'], str):
            report['analysis_time'] = datetime.fromisoformat(report['analysis_time'])
        
        return report
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting report: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/analysis/flows/{capture_id}", response_model=List[Flow])
async def get_flows(capture_id: str):
    """Get flows for a capture"""
    try:
        flows = await db.flows.find({"capture_id": capture_id}, {"_id": 0}).to_list(10000)
        
        # Convert ISO strings back to datetime
        for flow in flows:
            if flow.get('first_seen') and isinstance(flow['first_seen'], str):
                flow['first_seen'] = datetime.fromisoformat(flow['first_seen'])
            if flow.get('last_seen') and isinstance(flow['last_seen'], str):
                flow['last_seen'] = datetime.fromisoformat(flow['last_seen'])
        
        return flows
    except Exception as e:
        logger.error(f"Error getting flows: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# ==================== RULES ENDPOINTS ====================

@api_router.get("/rules", response_model=List[BlockingRule])
async def list_rules():
    """List all blocking rules"""
    try:
        rules = await db.rules.find({}, {"_id": 0}).to_list(1000)
        
        # Convert ISO strings back to datetime
        for rule in rules:
            if isinstance(rule['created_at'], str):
                rule['created_at'] = datetime.fromisoformat(rule['created_at'])
        
        return rules
    except Exception as e:
        logger.error(f"Error listing rules: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/rules", response_model=BlockingRule)
async def create_rule(rule_input: BlockingRuleCreate):
    """Create a new blocking rule"""
    try:
        rule = BlockingRule(**rule_input.model_dump())
        
        doc = rule.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.rules.insert_one(doc)
        
        logger.info(f"Created rule: {rule.rule_type} - {rule.value}")
        return rule
    except Exception as e:
        logger.error(f"Error creating rule: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@api_router.patch("/rules/{rule_id}", response_model=BlockingRule)
async def update_rule(rule_id: str, rule_update: BlockingRuleUpdate):
    """Update a blocking rule"""
    try:
        # Get existing rule
        existing = await db.rules.find_one({"id": rule_id}, {"_id": 0})
        if not existing:
            raise HTTPException(status_code=404, detail="Rule not found")
        
        # Update fields
        update_data = rule_update.model_dump(exclude_unset=True)
        if update_data:
            await db.rules.update_one(
                {"id": rule_id},
                {"$set": update_data}
            )
        
        # Get updated rule
        updated = await db.rules.find_one({"id": rule_id}, {"_id": 0})
        if isinstance(updated['created_at'], str):
            updated['created_at'] = datetime.fromisoformat(updated['created_at'])
        
        return updated
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating rule: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/rules/{rule_id}")
async def delete_rule(rule_id: str):
    """Delete a blocking rule"""
    try:
        result = await db.rules.delete_one({"id": rule_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Rule not found")
        
        logger.info(f"Deleted rule: {rule_id}")
        return {"message": "Rule deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting rule: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# ==================== HEALTH CHECK ====================

@api_router.get("/")
async def root():
    return {
        "message": "Packet Analyzer DPI Engine API",
        "version": "1.0.0",
        "status": "running"
    }

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
