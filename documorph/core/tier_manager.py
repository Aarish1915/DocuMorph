import os
import json
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class TierManager:
    """
    Dynamically manages rate limits and batch sizes based on the provided API key and tier.
    """
    
    TIER_PROFILES = {
        "gemini_free": {
            "max_crops_per_call": 10,  # Flash-Lite can handle ~10 crops reliably
            "max_polish_pages": 5,     # Output token limit protection
            "api_delay_seconds": 4.5,  # Strict 15 RPM limit
            "max_retries": 4,
            "vision_model": "gemini-3.5-flash-lite",
            "text_model": "gemini-3.5-flash-lite"
        },
        "gemini_paid": {
            "max_crops_per_call": 30,  # Paid tiers can handle much larger native multi-part
            "max_polish_pages": 20,
            "api_delay_seconds": 0.1,  # Virtually no delay
            "max_retries": 2,
            "vision_model": "gemini-1.5-flash",
            "text_model": "gemini-1.5-flash"
        },
        "openai_tier1": {
            "max_crops_per_call": 15,
            "max_polish_pages": 10,
            "api_delay_seconds": 0.5,
            "max_retries": 3,
            "vision_model": "gpt-4o-mini",
            "text_model": "gpt-4o-mini"
        }
    }

    def __init__(self):
        self.active_tier = "gemini_free" # Default fallback
        self.load_config()

    def load_config(self):
        """Loads configuration from config.json if it exists (set by Web App)"""
        if os.path.exists("config.json"):
            try:
                with open("config.json", "r", encoding="utf-8") as f:
                    config = json.load(f)
                    tier = config.get("tier", "gemini_free")
                    model_override = config.get("model")
                    
                    if tier in self.TIER_PROFILES:
                        self.active_tier = tier
                        logger.info(f"TierManager activated profile: {self.active_tier}")
                    else:
                        logger.warning(f"Unknown tier '{tier}' in config.json. Falling back to gemini_free.")
                        
                    # If UI explicitly selected a model, override the tier default
                    if model_override:
                        self.TIER_PROFILES[self.active_tier]["vision_model"] = model_override
                        self.TIER_PROFILES[self.active_tier]["text_model"] = model_override
                        
            except Exception as e:
                logger.error(f"Failed to load config.json: {e}")
                
    def get_profile(self) -> Dict[str, Any]:
        return self.TIER_PROFILES[self.active_tier]
        
    def get(self, key: str) -> Any:
        return self.TIER_PROFILES[self.active_tier].get(key)
