import httpx
import asyncio
from typing import Dict, Optional, Any
from functools import lru_cache
import time

from app.utils.config import settings

class SnakService:
    """
    Service for communicating with the SNAK integration wrapper
    """
    def __init__(self):
        self.base_url = settings.SNAK_INTEGRATION_URL
        self.timeout = 10.0  # seconds
        self.price_cache: Dict[str, Dict[str, Any]] = {}
        self.cache_ttl = 30  # seconds
        self.max_retries = 3
        self.retry_delay = 1  # seconds
    
    async def get_crypto_price(self, symbol: str) -> float:
        """
        Get the current price of a cryptocurrency
        Uses caching to reduce dependency on the SNAK wrapper
        """
        symbol = symbol.upper()
        
        # Check if price is in cache and not expired
        if symbol in self.price_cache:
            cache_entry = self.price_cache[symbol]
            if time.time() - cache_entry['timestamp'] < self.cache_ttl:
                return cache_entry['price']
        
        # Fetch fresh price
        price = await self._fetch_price(symbol)
        
        # Update cache
        self.price_cache[symbol] = {
            'price': price,
            'timestamp': time.time()
        }
        
        return price
    
    async def _fetch_price(self, symbol: str) -> float:
        """
        Fetch price from the SNAK integration wrapper
        Includes retry logic for resilience
        """
        url = f"{self.base_url}/price/{symbol}"
        
        for attempt in range(self.max_retries):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.get(url)
                    response.raise_for_status()
                    data = response.json()
                    
                    return data['price']
            except (httpx.RequestError, httpx.HTTPStatusError) as e:
                # Log the error
                print(f"Error fetching price for {symbol} (attempt {attempt+1}/{self.max_retries}): {str(e)}")
                
                # Last attempt, raise the error
                if attempt == self.max_retries - 1:
                    raise
                
                # Wait before retrying
                await asyncio.sleep(self.retry_delay)
    
    async def initiate_stake_transfer(
        self,
        from_address: str,
        to_address: str,
        amount: str,
        token_address: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Initiate a token transfer using the SNAK integration wrapper
        """
        url = f"{self.base_url}/transfer"
        payload = {
            "fromAddress": from_address,
            "toAddress": to_address,
            "amount": amount
        }
        
        if token_address:
            payload["tokenAddress"] = token_address
        
        for attempt in range(self.max_retries):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.post(url, json=payload)
                    response.raise_for_status()
                    return response.json()
            except (httpx.RequestError, httpx.HTTPStatusError) as e:
                # Log the error
                print(f"Error initiating transfer (attempt {attempt+1}/{self.max_retries}): {str(e)}")
                
                # Last attempt, raise the error
                if attempt == self.max_retries - 1:
                    raise
                
                # Wait before retrying
                await asyncio.sleep(self.retry_delay)
    
    async def validate_address(self, address: str) -> bool:
        """
        Validate an Ethereum address using the SNAK integration wrapper
        """
        url = f"{self.base_url}/validate-address/{address}"
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url)
                response.raise_for_status()
                data = response.json()
                return data.get('isValid', False)
        except (httpx.RequestError, httpx.HTTPStatusError):
            # Fallback to simple address validation if service is unavailable
            return self._validate_address_format(address)
    
    def _validate_address_format(self, address: str) -> bool:
        """
        Simple validation of Ethereum address format as fallback
        """
        return address.startswith('0x') and len(address) == 42 and all(c in '0123456789abcdefABCDEF' for c in address[2:])

# Create a singleton instance
snak_service = SnakService() 