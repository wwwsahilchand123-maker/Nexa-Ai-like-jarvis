# NEXA Tool Safety Guide

## Tool boundary
Treat every external tool call as a privileged operation. Validate arguments before execution and keep the minimum permissions needed for the task.

## Input handling
Do not pass raw user text directly into shell commands, file paths, database queries, or network requests. Use allowlists and structured arguments where possible.

## Confirmation
Actions that can delete data, send messages, change system settings, or make external requests should have an explicit confirmation boundary.

## Secrets
API keys and tokens belong in environment variables or a secret manager. Never commit them to source files, logs, screenshots, or example configuration.

## Failure behavior
Return a clear error when a tool fails and avoid silently retrying an action that may have side effects.
