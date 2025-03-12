# backend/app/domain/schemas/token.py
from typing import Optional
from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: str


class TokenPayload(BaseModel):
    sub: str  # user id
    exp: float  # expiration timestamp
    type: str  # access or refresh


class RefreshToken(BaseModel):
    refresh_token: str
    