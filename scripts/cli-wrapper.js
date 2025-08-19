#!/usr/bin/env node
/**
 * M365 Tenant Admin Tool - CLI Wrapper
 * 
 * This wrapper handles npm script arguments for the status logging system.
 * It enables commands like: npm run status:log "Custom message"
 * 
 * Usage via npm scripts:
 *   npm run status:log "message"     - Add custom log entry
 *   npm run status:servers          - Check server status  
 *   npm run status:health           - Full system health check
 */

const { spawn } = require('child_process');
const path = require('path');

// Get npm script arguments
const args = process.argv.slice(2);

// If this is a log command and we have a message, pass it properly
if (process.env.npm_lifecycle_event === 'status:log') {
  const message = args.join(' ') || process.env.npm_config_message || 'Manual log entry';
  
  const child = spawn('node', [
    path.join(__dirname, 'status-logger.js'), 
    'log', 
    message
  ], {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  child.on('exit', (code) => {
    process.exit(code);
  });
  
} else {
  // For other commands, just pass through
  console.error('CLI wrapper called incorrectly. Use npm scripts directly.');
  process.exit(1);
}