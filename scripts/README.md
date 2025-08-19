# M365 Tenant Admin Tool - Status Tracking System

This directory contains a comprehensive status tracking and monitoring system for the M365 Tenant Admin Tool project. The system automatically monitors file changes, tracks server status, and maintains a real-time project status document.

## Files Overview

### Core Scripts

- **`update-status.js`** - Main status monitoring script with file watching capabilities
- **`status-logger.js`** - Utility script for manual status logging and system health checks  
- **`cli-wrapper.js`** - CLI wrapper for handling npm script arguments
- **`README.md`** - This documentation file

## Features

### Automated Monitoring (`update-status.js`)
- **File Watching**: Monitors changes in `src/`, configuration files, and environment files
- **Git Tracking**: Automatically detects git changes and commits  
- **Server Status**: Checks if backend (port 3004) and frontend (port 3000) are running
- **Real-time Updates**: Updates `PROJECT_STATUS.md` when changes are detected
- **Debounced Updates**: Prevents excessive updates from rapid file changes
- **Change Logging**: Maintains a chronological log of all project changes

### Manual Utilities (`status-logger.js`)
- **Health Checks**: Comprehensive system health validation
- **Server Monitoring**: Check status of development servers
- **Environment Validation**: Verify all required environment variables
- **Git Status**: Detailed git repository information
- **Custom Logging**: Add manual entries to the project status
- **JSON Output**: Machine-readable output for automation

## Usage

### NPM Scripts (Recommended)

```bash
# Start continuous file monitoring (runs until stopped)
npm run status:watch

# Manual status update
npm run status:update

# Quick health check
npm run status:check

# Add custom log entry  
npm run status:log

# Check server status
npm run status:servers

# Full system health check with details
npm run status:health

# Validate environment configuration
npm run status:env

# Show git status information
npm run status:git
```

### Direct Script Usage

```bash
# File monitoring
node scripts/update-status.js --watch          # Start continuous monitoring
node scripts/update-status.js --once           # Single update
node scripts/update-status.js --verbose        # Verbose logging

# Status utilities
node scripts/status-logger.js log "Custom message"
node scripts/status-logger.js servers --json
node scripts/status-logger.js health --verbose
node scripts/status-logger.js env
node scripts/status-logger.js git
node scripts/status-logger.js update
```

## How It Works

### File Watching System
The `update-status.js` script uses Node.js `fs.watch` to monitor:
- All TypeScript/JavaScript files in `src/`
- Configuration files (`package.json`, `tsconfig.json`, etc.)
- Environment files (`.env`)
- Key project files

When changes are detected, it:
1. Debounces rapid changes (1 second delay)
2. Logs the change type and file
3. Updates the PROJECT_STATUS.md file
4. Records the change in the internal change log

### Status Generation
The system generates comprehensive status information including:
- **Server Status**: Real-time port checks for backend/frontend
- **Git Information**: Branch, changes, last commit
- **System Health**: Node.js version, memory usage, uptime
- **Environment Status**: Validates required variables
- **File System**: Checks for required directories and files
- **Change History**: Chronological log of recent changes

### Status File Structure
The generated `PROJECT_STATUS.md` includes:
- **Header**: Last update time, git branch, current status
- **Server Status**: Backend and frontend server information
- **System Health**: Environment and configuration status
- **Git Status**: Repository state and pending changes
- **Recent Changes**: Chronological change log
- **Preserved Content**: Maintains existing project documentation

## Configuration

### Environment Variables
The scripts respect these environment variables:
- `NODE_ENV` - Development environment setting
- Standard `.env` variables for the M365 tool

### Monitored Ports
- **Backend**: Port 3004 (configured in CONFIG.servers)
- **Frontend**: Port 3000 (configured in CONFIG.servers)

### Watched Paths
```javascript
const watchPaths = [
  'src',              // All source code
  'package.json',     // Dependencies
  'tsconfig.json',    // TypeScript config
  'tsconfig.backend.json',
  'vite.config.ts',   // Build config
  '.env'              // Environment variables
];
```

### Ignored Paths
- `node_modules/`
- `dist/` and `dist-backend/`
- `logs/`
- `.git/`
- Temporary files (`.tmp`, `.lock`, `.log`)

## Examples

### Starting Continuous Monitoring
```bash
npm run status:watch
# Output:
# [2025-08-19T14:30:00.000Z] [INFO] Starting file watch mode...
# [2025-08-19T14:30:00.100Z] [INFO] Started watching 5 paths
# [2025-08-19T14:30:00.200Z] [INFO] Status monitoring active. Press Ctrl+C to stop.
```

### Adding Custom Log Entry
```bash
node scripts/status-logger.js log "Started implementing new user management feature"
# Output:
# [8/19/2025, 2:30:00 PM] Log entry added: Started implementing new user management feature
```

### Checking System Health
```bash
npm run status:health
# Output:
# [8/19/2025, 2:30:00 PM] System Health: HEALTHY
# Data: {
#   "overall": "HEALTHY",
#   "summary": {
#     "totalChecks": 6,
#     "passedChecks": 6,
#     "failedChecks": 0
#   }
# }
```

### JSON Output for Automation
```bash
node scripts/status-logger.js servers --json
# Output:
# {
#   "message": "Server Status Check Complete",
#   "data": {
#     "backend": {
#       "name": "Backend Server",
#       "port": 3004,
#       "running": true,
#       "status": "RUNNING"
#     },
#     "frontend": {
#       "name": "Frontend Server", 
#       "port": 3000,
#       "running": false,
#       "status": "STOPPED"
#     }
#   },
#   "timestamp": "2025-08-19T14:30:00.000Z"
# }
```

## Error Handling

### Graceful Shutdown
The monitoring script handles:
- `SIGINT` (Ctrl+C) - Graceful shutdown
- `SIGTERM` - Process termination  
- `uncaughtException` - Unexpected errors

### Robust Error Recovery
- Git command failures don't crash the system
- File system errors are logged and handled
- Network timeouts for server checks
- Invalid JSON/configuration files are handled gracefully

### Logging
All errors and important events are logged with:
- Timestamps
- Log levels (INFO, WARN, ERROR)
- Contextual information
- Structured data for debugging

## Integration with Development Workflow

### Recommended Usage
1. **Start monitoring**: Run `npm run status:watch` in a dedicated terminal
2. **Development work**: Make changes to code, the system tracks automatically
3. **Manual entries**: Use `npm run status:log` for important milestones
4. **Health checks**: Run `npm run status:health` before commits
5. **Server monitoring**: Use `npm run status:servers` to verify services

### IDE Integration
The scripts can be integrated with IDEs that support npm scripts:
- **VS Code**: Use the npm scripts explorer
- **WebStorm**: Access via npm tool window
- **Command palette**: Quick access to status commands

### CI/CD Integration
The JSON output mode enables integration with build systems:
```bash
# In CI pipeline
npm run status:health --json > health-report.json
```

## Troubleshooting

### Common Issues

**"Port is not in use" but server seems running**
- The port check uses a simple TCP connection test
- Some firewalls may block the test
- Use `netstat -an | findstr 3004` to verify manually

**File watching not working**
- Ensure sufficient file descriptor limits on Linux/Mac
- Windows may require administrator privileges for some directories
- Check that watched directories exist and are readable

**Git commands failing**
- Ensure git is installed and in PATH
- Verify the project directory is a git repository
- Check file permissions for .git directory

### Debug Mode
Enable verbose logging for troubleshooting:
```bash
node scripts/update-status.js --watch --verbose
node scripts/status-logger.js health --verbose
```

### Manual Recovery
If the status system becomes unresponsive:
1. Stop all monitoring: `Ctrl+C` or `killall node`
2. Run a manual update: `npm run status:update`
3. Restart monitoring: `npm run status:watch`

## Customization

### Adding New Monitoring Paths
Edit `CONFIG.watchPatterns` in `update-status.js`:
```javascript
watchPatterns: [
  'src/**/*.ts',
  'src/**/*.tsx', 
  'custom-directory/**/*.js',  // Add custom paths
  'config/*.yaml'              // Add config files
]
```

### Modifying Server Ports
Update `CONFIG.servers` in `update-status.js`:
```javascript
servers: {
  backend: { port: 3004, name: 'Backend Server' },
  frontend: { port: 3000, name: 'Frontend Server' },
  api: { port: 8080, name: 'API Gateway' }  // Add new services
}
```

### Custom Health Checks
Extend the `performHealthCheck()` method in `status-logger.js` to add custom validation logic.

## Contributing

When modifying the status tracking system:
1. Test all npm scripts after changes
2. Verify file watching works correctly  
3. Ensure graceful shutdown handling
4. Update this README with new features
5. Test error conditions and recovery

## License

This status tracking system is part of the M365 Tenant Admin Tool project.