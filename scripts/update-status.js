#!/usr/bin/env node
/**
 * M365 Tenant Admin Tool - Status Update Script
 * 
 * This script automatically monitors file changes and updates PROJECT_STATUS.md
 * with real-time information about:
 * - File modifications (via fs.watch)
 * - Git changes and commits
 * - Server status (backend on port 3004, frontend on port 3000)
 * - System health checks
 * 
 * Usage:
 *   node scripts/update-status.js [options]
 * 
 * Options:
 *   --watch, -w     Start file watching mode
 *   --once, -o      Update status once and exit
 *   --verbose, -v   Enable verbose logging
 *   --help, -h      Show this help message
 * 
 * Examples:
 *   node scripts/update-status.js --watch        # Start continuous monitoring
 *   node scripts/update-status.js --once         # Single status update
 *   npm run status:watch                         # Via npm script
 *   npm run status:update                        # Via npm script
 */

const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');
const net = require('net');

// Configuration
const CONFIG = {
  projectRoot: process.cwd(),
  statusFile: 'PROJECT_STATUS.md',
  watchPatterns: [
    'src/**/*.ts',
    'src/**/*.tsx',
    'src/**/*.js',
    'src/**/*.json',
    '*.json',
    '*.md',
    '.env'
  ],
  ignorePaths: [
    'node_modules',
    'dist',
    'dist-backend',
    'logs',
    '.git'
  ],
  servers: {
    backend: { port: 3004, name: 'Backend Server' },
    frontend: { port: 3000, name: 'Frontend Server' }
  }
};

class StatusUpdater {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.watchers = new Map();
    this.debounceTimeout = null;
    this.lastUpdate = null;
    this.changeLog = [];
    
    // Bind methods
    this.updateStatus = this.updateStatus.bind(this);
    this.handleFileChange = this.handleFileChange.bind(this);
  }

  /**
   * Log messages with timestamp
   */
  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;
    
    if (level === 'ERROR') {
      console.error(`${prefix} ${message}`);
    } else if (level === 'WARN') {
      console.warn(`${prefix} ${message}`);
    } else if (this.verbose || level === 'INFO') {
      console.log(`${prefix} ${message}`);
    }
  }

  /**
   * Check if a port is in use
   */
  async checkPort(port) {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.listen(port, () => {
        server.once('close', () => resolve(false));
        server.close();
      });
      
      server.on('error', () => resolve(true));
    });
  }

  /**
   * Get server status for both backend and frontend
   */
  async getServerStatus() {
    const status = {};
    
    for (const [key, config] of Object.entries(CONFIG.servers)) {
      const isRunning = await this.checkPort(config.port);
      status[key] = {
        name: config.name,
        port: config.port,
        running: isRunning,
        status: isRunning ? 'RUNNING ✅' : 'STOPPED ❌'
      };
    }
    
    return status;
  }

  /**
   * Get git status information
   */
  getGitStatus() {
    try {
      const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
      const lastCommit = execSync('git log -1 --pretty=format:"%h - %s (%cr)"', { encoding: 'utf8' });
      
      return {
        branch,
        hasChanges: status.length > 0,
        status: status || 'Clean working directory',
        lastCommit,
        files: status ? status.split('\n').map(line => {
          const [statusCode, ...pathParts] = line.split(' ');
          return {
            status: statusCode.trim(),
            path: pathParts.join(' ').trim()
          };
        }) : []
      };
    } catch (error) {
      this.log(`Error getting git status: ${error.message}`, 'ERROR');
      return {
        branch: 'unknown',
        hasChanges: false,
        status: 'Error reading git status',
        lastCommit: 'unknown',
        files: []
      };
    }
  }

  /**
   * Get system health information
   */
  async getSystemHealth() {
    const health = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };

    // Check if .env file exists and has required variables
    const envPath = path.join(CONFIG.projectRoot, '.env');
    health.envFile = {
      exists: fs.existsSync(envPath),
      lastModified: fs.existsSync(envPath) ? fs.statSync(envPath).mtime : null
    };

    // Check key directories
    health.directories = {};
    for (const dir of ['src', 'logs', 'node_modules']) {
      const dirPath = path.join(CONFIG.projectRoot, dir);
      health.directories[dir] = fs.existsSync(dirPath);
    }

    return health;
  }

  /**
   * Add entry to change log
   */
  addToChangeLog(type, description, details = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      type,
      description,
      details
    };
    
    this.changeLog.unshift(entry);
    
    // Keep only last 50 entries
    if (this.changeLog.length > 50) {
      this.changeLog = this.changeLog.slice(0, 50);
    }
    
    this.log(`Change logged: ${type} - ${description}`, 'DEBUG');
  }

  /**
   * Update the PROJECT_STATUS.md file
   */
  async updateStatus(reason = 'Manual update') {
    try {
      this.log(`Updating status: ${reason}`);
      
      const [serverStatus, gitStatus, systemHealth] = await Promise.all([
        this.getServerStatus(),
        Promise.resolve(this.getGitStatus()),
        this.getSystemHealth()
      ]);

      // Read current PROJECT_STATUS.md
      const statusPath = path.join(CONFIG.projectRoot, CONFIG.statusFile);
      let statusContent = '';
      
      if (fs.existsSync(statusPath)) {
        statusContent = fs.readFileSync(statusPath, 'utf8');
      }

      // Generate new status sections
      const newStatus = this.generateStatusContent({
        serverStatus,
        gitStatus,
        systemHealth,
        reason,
        existingContent: statusContent
      });

      // Write updated status
      fs.writeFileSync(statusPath, newStatus, 'utf8');
      
      this.lastUpdate = new Date().toISOString();
      this.addToChangeLog('STATUS_UPDATE', reason, {
        serverStatus,
        gitStatus: {
          branch: gitStatus.branch,
          hasChanges: gitStatus.hasChanges
        }
      });
      
      this.log(`Status updated successfully at ${this.lastUpdate}`);
      
    } catch (error) {
      this.log(`Error updating status: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  /**
   * Generate the complete status content
   */
  generateStatusContent({ serverStatus, gitStatus, systemHealth, reason, existingContent }) {
    const timestamp = new Date().toISOString();
    const formattedTime = new Date().toLocaleString('en-US', { 
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    // Extract existing sections we want to preserve
    const preservedSections = this.extractPreservedSections(existingContent);

    return `# M365 Tenant Admin Tool - Project Status

**Last Updated:** ${formattedTime}  
**Update Reason:** ${reason}  
**Current Branch:** ${gitStatus.branch}  
**Git Status:** ${gitStatus.hasChanges ? 'Has uncommitted changes' : 'Clean working directory'}  
**Last Commit:** ${gitStatus.lastCommit}

## Current Server Status

### Backend Server
- **Status:** ${serverStatus.backend.status}
- **Port:** ${serverStatus.backend.port}
- **Health Check:** ${serverStatus.backend.running ? `http://localhost:${serverStatus.backend.port}/api/health` : 'Server not running'}

### Frontend Server  
- **Status:** ${serverStatus.frontend.status}
- **Port:** ${serverStatus.frontend.port}
- **Development URL:** ${serverStatus.frontend.running ? `http://localhost:${serverStatus.frontend.port}` : 'Server not running'}

## System Health

### Environment
- **Node.js Version:** ${systemHealth.nodeVersion}
- **Platform:** ${systemHealth.platform}
- **Environment:** ${systemHealth.environment}
- **Process Uptime:** ${Math.floor(systemHealth.uptime)} seconds

### Configuration Files
- **Environment File (.env):** ${systemHealth.envFile.exists ? '✅ Exists' : '❌ Missing'}
${systemHealth.envFile.lastModified ? `- **Last Modified:** ${systemHealth.envFile.lastModified}` : ''}

### Required Directories
${Object.entries(systemHealth.directories).map(([dir, exists]) => 
  `- **${dir}/:** ${exists ? '✅ Exists' : '❌ Missing'}`
).join('\n')}

### Memory Usage
- **RSS:** ${Math.round(systemHealth.memory.rss / 1024 / 1024)} MB
- **Heap Used:** ${Math.round(systemHealth.memory.heapUsed / 1024 / 1024)} MB
- **Heap Total:** ${Math.round(systemHealth.memory.heapTotal / 1024 / 1024)} MB

## Git Status

### Current State
- **Branch:** ${gitStatus.branch}
- **Working Directory:** ${gitStatus.hasChanges ? 'Has changes' : 'Clean'}

${gitStatus.hasChanges ? `### Pending Changes
${gitStatus.files.map(file => `- **${file.status}** ${file.path}`).join('\n')}` : ''}

## Recent Changes Log

${this.changeLog.slice(0, 10).map(entry => {
  const time = new Date(entry.timestamp).toLocaleString();
  return `### ${time}
- **Type:** ${entry.type}
- **Description:** ${entry.description}
${entry.details && Object.keys(entry.details).length > 0 ? `- **Details:** ${JSON.stringify(entry.details, null, 2)}` : ''}`;
}).join('\n\n')}

${this.changeLog.length === 0 ? 'No recent changes logged.' : ''}

${preservedSections}

---

**Status Tracking System Active**  
*This document is automatically updated by the status monitoring system.*  
*Last system check: ${timestamp}*
`;
  }

  /**
   * Extract sections from existing content that should be preserved
   */
  extractPreservedSections(content) {
    if (!content) return '';
    
    // Look for sections we want to preserve (everything after "## Project Overview" if it exists)
    const preserveFromMarker = '## Project Overview';
    const markerIndex = content.indexOf(preserveFromMarker);
    
    if (markerIndex !== -1) {
      return '\n' + content.substring(markerIndex);
    }
    
    // If no specific marker found, preserve content after first major section
    const lines = content.split('\n');
    let preserveFromLine = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('## ') && !lines[i].includes('Server Status') && !lines[i].includes('System Health') && !lines[i].includes('Git Status') && !lines[i].includes('Recent Changes')) {
        preserveFromLine = i;
        break;
      }
    }
    
    if (preserveFromLine !== -1) {
      return '\n' + lines.slice(preserveFromLine).join('\n');
    }
    
    return '';
  }

  /**
   * Handle file change events
   */
  handleFileChange(eventType, filename, filepath) {
    // Debounce rapid file changes
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    
    this.debounceTimeout = setTimeout(() => {
      this.log(`File changed: ${eventType} - ${filepath}`, 'DEBUG');
      this.addToChangeLog('FILE_CHANGE', `File modified: ${filename}`, {
        eventType,
        filepath,
        timestamp: new Date().toISOString()
      });
      
      this.updateStatus(`File change detected: ${filename}`);
    }, 1000);
  }

  /**
   * Start watching files for changes
   */
  startWatching() {
    this.log('Starting file watch mode...');
    
    const watchPaths = [
      'src',
      'package.json',
      'tsconfig.json',
      'tsconfig.backend.json',
      'vite.config.ts',
      '.env'
    ];
    
    watchPaths.forEach(watchPath => {
      const fullPath = path.join(CONFIG.projectRoot, watchPath);
      
      if (fs.existsSync(fullPath)) {
        try {
          const watcher = fs.watch(fullPath, { recursive: true }, (eventType, filename) => {
            if (filename && !this.shouldIgnoreFile(filename)) {
              this.handleFileChange(eventType, filename, path.join(watchPath, filename));
            }
          });
          
          this.watchers.set(watchPath, watcher);
          this.log(`Watching: ${fullPath}`, 'DEBUG');
          
        } catch (error) {
          this.log(`Error watching ${fullPath}: ${error.message}`, 'ERROR');
        }
      }
    });
    
    this.log(`Started watching ${this.watchers.size} paths`);
    this.addToChangeLog('SYSTEM', 'File watching started', {
      watchedPaths: watchPaths,
      watchersActive: this.watchers.size
    });
  }

  /**
   * Check if a file should be ignored
   */
  shouldIgnoreFile(filename) {
    const ignoredExtensions = ['.tmp', '.lock', '.log'];
    const ignoredNames = ['node_modules', '.git', 'dist', 'dist-backend'];
    
    return ignoredExtensions.some(ext => filename.endsWith(ext)) ||
           ignoredNames.some(name => filename.includes(name));
  }

  /**
   * Stop all file watchers
   */
  stopWatching() {
    this.log('Stopping file watchers...');
    
    for (const [path, watcher] of this.watchers) {
      try {
        watcher.close();
        this.log(`Stopped watching: ${path}`, 'DEBUG');
      } catch (error) {
        this.log(`Error stopping watcher for ${path}: ${error.message}`, 'ERROR');
      }
    }
    
    this.watchers.clear();
    this.addToChangeLog('SYSTEM', 'File watching stopped');
    this.log('All file watchers stopped');
  }

  /**
   * Graceful shutdown
   */
  shutdown() {
    this.log('Shutting down status updater...');
    this.stopWatching();
    
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    
    // Final status update
    this.updateStatus('System shutdown').catch(error => {
      this.log(`Error during final status update: ${error.message}`, 'ERROR');
    }).finally(() => {
      process.exit(0);
    });
  }
}

// CLI Interface
function showHelp() {
  console.log(`
M365 Tenant Admin Tool - Status Update Script

Usage: node scripts/update-status.js [options]

Options:
  --watch, -w     Start file watching mode (continuous monitoring)
  --once, -o      Update status once and exit  
  --verbose, -v   Enable verbose logging
  --help, -h      Show this help message

Examples:
  node scripts/update-status.js --watch        # Start continuous monitoring
  node scripts/update-status.js --once         # Single status update
  npm run status:watch                         # Via npm script
  npm run status:update                        # Via npm script

The script monitors:
  - File changes in src/ directory
  - Git repository status
  - Server status (ports 3004 and 3000)
  - System health metrics
  - Environment configuration

All changes are logged to PROJECT_STATUS.md with timestamps.
`);
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const options = {
    watch: args.includes('--watch') || args.includes('-w'),
    once: args.includes('--once') || args.includes('-o'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    help: args.includes('--help') || args.includes('-h')
  };

  if (options.help) {
    showHelp();
    return;
  }

  const updater = new StatusUpdater(options);

  // Handle graceful shutdown
  process.on('SIGINT', () => updater.shutdown());
  process.on('SIGTERM', () => updater.shutdown());
  process.on('uncaughtException', (error) => {
    updater.log(`Uncaught exception: ${error.message}`, 'ERROR');
    updater.shutdown();
  });

  try {
    if (options.watch) {
      // Initial update
      await updater.updateStatus('File watching started');
      
      // Start watching
      updater.startWatching();
      
      // Keep the process alive
      updater.log('Status monitoring active. Press Ctrl+C to stop.');
      
    } else {
      // Single update
      await updater.updateStatus(options.once ? 'Manual status update' : 'Automated status check');
      updater.log('Status update completed');
    }
    
  } catch (error) {
    updater.log(`Fatal error: ${error.message}`, 'ERROR');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { StatusUpdater, CONFIG };