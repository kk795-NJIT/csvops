"""Webhook service - sends data to external endpoints with signing"""
import hmac
import hashlib
import json
import time
from datetime import datetime
from typing import Optional
import httpx
from collections import defaultdict
from threading import Lock


# Simple in-memory rate limiting (can upgrade to Redis later)
class RateLimiter:
    """Simple rate limiter per user"""
    def __init__(self, max_requests: int = 10, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)
        self.lock = Lock()
    
    def is_allowed(self, user_id: int) -> tuple[bool, str]:
        """Check if user is allowed to make a request"""
        with self.lock:
            now = time.time()
            # Clean old requests
            self.requests[user_id] = [
                t for t in self.requests[user_id] 
                if now - t < self.window_seconds
            ]
            
            if len(self.requests[user_id]) >= self.max_requests:
                return False, f"Rate limit exceeded. Max {self.max_requests} webhook requests per minute."
            
            self.requests[user_id].append(now)
            return True, ""


# Global rate limiter instance
webhook_rate_limiter = RateLimiter(max_requests=10, window_seconds=60)


def create_signature(payload: str, secret: str, timestamp: int) -> str:
    """Create HMAC-SHA256 signature for webhook payload"""
    message = f"{timestamp}.{payload}"
    signature = hmac.new(
        secret.encode('utf-8'),
        message.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    return f"sha256={signature}"


def validate_url(url: str) -> tuple[bool, str]:
    """Basic URL validation for webhooks"""
    if not url:
        return False, "URL is required"
    
    if not url.startswith(('http://', 'https://')):
        return False, "URL must start with http:// or https://"
    
    # Block localhost and private IPs in production (allow in dev)
    blocked_hosts = ['localhost', '127.0.0.1', '0.0.0.0', '::1']
    for blocked in blocked_hosts:
        if blocked in url.lower():
            # In development, allow localhost
            import os
            if os.getenv('ALLOW_LOCALHOST_WEBHOOKS', 'true').lower() != 'true':
                return False, f"Cannot send webhooks to {blocked}"
    
    return True, ""


async def send_webhook(
    url: str,
    data: list[dict],
    user_id: int,
    signing_secret: Optional[str] = None,
    custom_headers: Optional[dict] = None,
    include_metadata: bool = True,
    file_name: Optional[str] = None,
) -> dict:
    """
    Send data to a webhook endpoint.
    
    Args:
        url: The webhook URL
        data: List of row dictionaries to send
        user_id: User ID for rate limiting
        signing_secret: Optional HMAC secret for signing
        custom_headers: Optional custom headers to include
        include_metadata: Whether to include metadata in payload
        file_name: Optional file name for metadata
    
    Returns:
        dict with success, message, status_code
    """
    # Rate limit check
    allowed, message = webhook_rate_limiter.is_allowed(user_id)
    if not allowed:
        return {"success": False, "message": message, "status_code": 429}
    
    # URL validation
    valid, message = validate_url(url)
    if not valid:
        return {"success": False, "message": message, "status_code": 400}
    
    # Build payload
    timestamp = int(time.time())
    
    payload = {
        "data": data,
        "count": len(data),
    }
    
    if include_metadata:
        payload["metadata"] = {
            "source": "ops-csv-cleaner",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "file_name": file_name,
            "row_count": len(data),
        }
    
    payload_json = json.dumps(payload, separators=(',', ':'))
    
    # Build headers
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Ops-CSV-Cleaner/1.0",
        "X-Webhook-Timestamp": str(timestamp),
    }
    
    # Add signature if secret provided
    if signing_secret:
        signature = create_signature(payload_json, signing_secret, timestamp)
        headers["X-Webhook-Signature"] = signature
    
    # Add custom headers
    if custom_headers:
        for key, value in custom_headers.items():
            # Prevent overriding security headers
            if key.lower() not in ['content-type', 'x-webhook-signature', 'x-webhook-timestamp']:
                headers[key] = str(value)
    
    # Send request
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, content=payload_json, headers=headers)
            
            if response.status_code >= 200 and response.status_code < 300:
                return {
                    "success": True,
                    "message": f"Successfully sent {len(data)} rows to webhook",
                    "status_code": response.status_code,
                }
            else:
                return {
                    "success": False,
                    "message": f"Webhook returned status {response.status_code}: {response.text[:200]}",
                    "status_code": response.status_code,
                }
    except httpx.TimeoutException:
        return {
            "success": False,
            "message": "Webhook request timed out after 30 seconds",
            "status_code": 408,
        }
    except httpx.RequestError as e:
        return {
            "success": False,
            "message": f"Failed to connect to webhook: {str(e)}",
            "status_code": 503,
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Unexpected error: {str(e)}",
            "status_code": 500,
        }
