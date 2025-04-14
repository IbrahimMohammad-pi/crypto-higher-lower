from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Dict, Optional, Any, List
import asyncio

from app.services.snak_service import snak_service

router = APIRouter()

class PriceResponse(BaseModel):
    symbol: str
    price: float
    timestamp: float = Field(default_factory=lambda: __import__('time').time())

class TransferRequest(BaseModel):
    from_address: str
    to_address: str
    amount: str
    token_address: Optional[str] = None

class TransferResponse(BaseModel):
    tx_hash: str
    from_address: str
    to_address: str
    amount: str
    token_address: Optional[str] = None
    timestamp: str

class AddressValidationResponse(BaseModel):
    address: str
    is_valid: bool

@router.get("/price/{symbol}", response_model=PriceResponse)
async def get_price(symbol: str):
    """
    Get the current price of a cryptocurrency
    """
    try:
        price = await snak_service.get_crypto_price(symbol)
        return PriceResponse(symbol=symbol.upper(), price=price)
    except Exception as e:
        # Convert any SNAK service errors to HTTP exceptions
        raise HTTPException(status_code=503, detail=f"Error fetching price: {str(e)}")

@router.post("/transfer", response_model=TransferResponse)
async def transfer_tokens(transfer_data: TransferRequest):
    """
    Initiate a token transfer between wallets
    """
    try:
        # Validate addresses
        from_valid = await snak_service.validate_address(transfer_data.from_address)
        to_valid = await snak_service.validate_address(transfer_data.to_address)
        
        if not from_valid:
            raise HTTPException(status_code=400, detail="Invalid sender address")
        
        if not to_valid:
            raise HTTPException(status_code=400, detail="Invalid recipient address")
        
        # Validate token address if provided
        if transfer_data.token_address and not await snak_service.validate_address(transfer_data.token_address):
            raise HTTPException(status_code=400, detail="Invalid token address")
        
        # Perform the transfer
        result = await snak_service.initiate_stake_transfer(
            from_address=transfer_data.from_address,
            to_address=transfer_data.to_address,
            amount=transfer_data.amount,
            token_address=transfer_data.token_address
        )
        
        return TransferResponse(
            tx_hash=result.get("txHash", ""),
            from_address=transfer_data.from_address,
            to_address=transfer_data.to_address,
            amount=transfer_data.amount,
            token_address=transfer_data.token_address,
            timestamp=result.get("timestamp", "")
        )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Convert any SNAK service errors to HTTP exceptions
        raise HTTPException(status_code=503, detail=f"Transfer failed: {str(e)}")

@router.get("/validate-address/{address}", response_model=AddressValidationResponse)
async def validate_address(address: str):
    """
    Validate a cryptocurrency wallet address
    """
    try:
        is_valid = await snak_service.validate_address(address)
        return AddressValidationResponse(address=address, is_valid=is_valid)
    except Exception as e:
        # Convert any SNAK service errors to HTTP exceptions
        raise HTTPException(status_code=503, detail=f"Address validation failed: {str(e)}")

@router.get("/supported-symbols", response_model=List[str])
async def get_supported_symbols():
    """
    Get list of supported cryptocurrency symbols
    """
    # This is a simple predefined list of commonly supported cryptocurrencies
    # In a production environment, this should be fetched from the SNAK service
    return [
        "BTC", "ETH", "SOL", "AVAX", "USDT", 
        "BNB", "XRP", "ADA", "DOGE", "MATIC",
        "DOT", "UNI", "LINK", "ATOM", "LTC"
    ] 