# Changelog

All notable changes to NEXA AI are documented here.

## [Unreleased]

### Added
- Permission-aware tool execution documentation.
- Local demo-mode guidance for exploring the agent without external provider credentials.

### Security
- Keep destructive actions behind explicit confirmation or policy controls.
- Keep local services bound to `127.0.0.1` unless remote access is intentional.

## [0.1.0] - Initial portfolio release

- Modular Windows desktop assistant foundation.
- Agent, memory, provider and tool layers.
- Electron + React desktop interface.
- FastAPI backend with local storage.
