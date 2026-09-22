# NEXA Tool Safety Boundaries

NEXA can interact with local tools, so tool routing must be treated as a security boundary.

## Permission classes
| Class | Examples | Default |
|---|---|---|
| SAFE | Read system status, list files | Allow |
| SENSITIVE | Access private files, browser state | Confirm |
| DESTRUCTIVE | Delete data, change system settings | Block or confirm |

## Tool design rules
- Validate structured arguments before execution.
- Keep terminal commands behind an explicit allowlist.
- Prefer 127.0.0.1 for local services.
- Never pass secrets into prompts, logs, or command output unnecessarily.
- Return a verified execution result instead of claiming success.
- Keep destructive operations reversible where practical.

## Testing
Every new tool should cover valid input, malformed input, denied permission, confirmation-required flow, execution failure, and sensitive-data redaction in logs.

A tool should fail closed when its permission decision cannot be established.