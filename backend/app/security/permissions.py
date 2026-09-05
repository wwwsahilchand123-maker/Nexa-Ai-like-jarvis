from enum import Enum
from dataclasses import dataclass

class Permission(str, Enum):
    SAFE = "safe"
    SENSITIVE = "sensitive"
    DESTRUCTIVE = "destructive"

@dataclass
class PermissionDecision:
    allowed: bool
    needs_confirmation: bool
    reason: str = ""

def decide(permission: Permission, confirmed: bool = False) -> PermissionDecision:
    if permission == Permission.SAFE:
        return PermissionDecision(True, False)
    if permission == Permission.DESTRUCTIVE:
        return PermissionDecision(confirmed, not confirmed, "Explicit confirmation is required.")
    return PermissionDecision(confirmed, not confirmed, "Confirmation is required for this action.")
