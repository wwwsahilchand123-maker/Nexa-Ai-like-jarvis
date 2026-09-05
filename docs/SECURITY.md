# Security Model

NEXA deliberately avoids unrestricted AI-controlled shell access.

Permission levels:
- SAFE: read-only / low-impact operations.
- SENSITIVE: actions that can alter state; configurable confirmation.
- DESTRUCTIVE: deletion, uninstall, arbitrary scripts, security changes; confirmation is mandatory.

Terminal commands are allowlisted. The agent cannot silently elevate privileges.

For production use:
1. Keep credentials in OS-secure storage.
2. Do not log secrets.
3. Keep browser profiles isolated.
4. Review tool permissions.
5. Keep Demo Mode enabled during development.
