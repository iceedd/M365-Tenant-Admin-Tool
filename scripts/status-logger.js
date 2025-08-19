#!/usr/bin/env node
/**
 * M365 Tenant Admin Tool - Status Logger Utility
 * 
 * This utility script provides manual status logging and system health checking.
 * It can be called directly or via npm scripts to:
 * - Add manual log entries to PROJECT_STATUS.md
 * - Check current server status  
 * - Perform system health validation
 * - Validate environment configuration
 * 
 * Usage:
 *   node scripts/status-logger.js <command> [options]
 * 
 * Commands:
 *   log <message>     Add a manual log entry
 *   servers          Check server status (ports 3004, 3000)
 *   health           Full system health check
 *   env              Validate environment configuration
 *   git              Show git status information
 *   update           Force status file update
 * 
 * Options:
 *   --verbose, -v    Enable verbose logging
 *   --json, -j       Output in JSON format
 *   --help, -h       Show help for specific command
 * 
 * Examples:
 *   node scripts/status-logger.js log "Started new feature development"
 *   node scripts/status-logger.js servers --json
 *   node scripts/status-logger.js health --verbose
 *   npm run status:log "Custom message"
 *   npm run status:servers
 *   npm run status:health
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const net = require('net');
const { StatusUpdater, CONFIG } = require('./update-status.js');

class StatusLogger {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.jsonOutput = options.json || false;
    this.updater = new StatusUpdater(options);
  }

  /**
   * Log messages with optional JSON output
   */
  log(message, data = null) {
    if (this.jsonOutput && data) {
      console.log(JSON.stringify({ message, data, timestamp: new Date().toISOString() }, null, 2));
    } else if (this.jsonOutput) {
      console.log(JSON.stringify({ message, timestamp: new Date().toISOString() }, null, 2));
    } else {
      const timestamp = new Date().toLocaleString();
      console.log(`[${timestamp}] ${message}`);
      if (data && this.verbose) {
        console.log('Data:', data);
      }
    }
  }

  /**
   * Log error messages
   */
  logError(message, error = null) {
    if (this.jsonOutput) {
      console.error(JSON.stringify({ 
        error: message, 
        details: error?.message || error,
        timestamp: new Date().toISOString() 
      }, null, 2));
    } else {
      console.error(`ERROR: ${message}`);
      if (error && this.verbose) {
        console.error('Details:', error);
      }
    }
  }

  /**
   * Check if ports are in use
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
   * Get detailed server status
   */
  async getServerStatus() {
    const results = {};
    
    for (const [key, config] of Object.entries(CONFIG.servers)) {
      const isRunning = await this.checkPort(config.port);
      
      results[key] = {
        name: config.name,
        port: config.port,
        running: isRunning,
        status: isRunning ? 'RUNNING' : 'STOPPED',
        healthCheck: isRunning ? `http://localhost:${config.port}${key === 'backend' ? '/api/health' : ''}` : null
      };

      // Try to get additional info for running servers
      if (isRunning && key === 'backend') {
        try {
          const healthResponse = execSync(`curl -s http://localhost:${config.port}/api/health`, { 
            encoding: 'utf8',
            timeout: 5000 
          });
          results[key].healthResponse = JSON.parse(healthResponse);
        } catch (error) {
          results[key].healthError = 'Unable to reach health endpoint';
        }
      }
    }
    
    return results;
  }

  /**
   * Perform comprehensive system health check
   */
  async performHealthCheck() {
    const health = {
      timestamp: new Date().toISOString(),
      overall: 'UNKNOWN',
      checks: {}
    };

    // Check 1: Environment variables
    health.checks.environment = this.checkEnvironment();
    
    // Check 2: Required files and directories
    health.checks.filesystem = this.checkFilesystem();
    
    // Check 3: Git repository status
    health.checks.git = this.checkGitStatus();
    
    // Check 4: Node.js and dependencies
    health.checks.nodejs = await this.checkNodeJsHealth();
    
    // Check 5: Server status
    health.checks.servers = await this.getServerStatus();
    
    // Check 6: Log files
    health.checks.logging = this.checkLogFiles();

    // Determine overall health
    const failedChecks = Object.entries(health.checks).filter(([key, check]) => 
      check.status === 'FAIL' || check.status === 'ERROR'
    );
    
    if (failedChecks.length === 0) {
      health.overall = 'HEALTHY';
    } else if (failedChecks.length <= 2) {
      health.overall = 'WARNING';
    } else {
      health.overall = 'CRITICAL';
    }
    
    health.summary = {
      totalChecks: Object.keys(health.checks).length,
      passedChecks: Object.values(health.checks).filter(c => c.status === 'PASS' || c.status === 'RUNNING').length,
      failedChecks: failedChecks.length,
      failedCheckNames: failedChecks.map(([key]) => key)
    };

    return health;
  }

  /**
   * Check environment configuration
   */
  checkEnvironment() {
    const requiredBackendVars = [
      'PORT', 'AZURE_CLIENT_ID', 'AZURE_TENANT_ID', 'AZURE_REDIRECT_URI',
      'JWT_SECRET', 'SESSION_SECRET', 'GRAPH_API_ENDPOINT'
    ];
    
    const requiredFrontendVars = [
      'VITE_API_BASE_URL', 'VITE_AZURE_CLIENT_ID', 'VITE_AZURE_TENANT_ID', 
      'VITE_AZURE_REDIRECT_URI'
    ];

    const envPath = path.join(CONFIG.projectRoot, '.env');
    const result = {
      status: 'UNKNOWN',
      envFile: {
        exists: fs.existsSync(envPath),
        path: envPath,
        lastModified: null
      },
      variables: {
        backend: {},
        frontend: {}
      },
      missing: [],
      issues: []
    };

    if (result.envFile.exists) {
      result.envFile.lastModified = fs.statSync(envPath).mtime;
      
      // Load environment variables
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envVars = {};
      
      envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          envVars[match[1].trim()] = match[2].trim();
        }
      });

      // Check backend variables
      requiredBackendVars.forEach(varName => {
        const exists = varName in envVars;
        const value = envVars[varName];
        result.variables.backend[varName] = {
          exists,
          hasValue: exists && value.length > 0,
          length: exists ? value.length : 0
        };
        
        if (!exists || !value) {
          result.missing.push(`Backend: ${varName}`);
        }
      });

      // Check frontend variables
      requiredFrontendVars.forEach(varName => {
        const exists = varName in envVars;
        const value = envVars[varName];
        result.variables.frontend[varName] = {
          exists,
          hasValue: exists && value.length > 0,
          length: exists ? value.length : 0
        };
        
        if (!exists || !value) {
          result.missing.push(`Frontend: ${varName}`);
        }
      });

      // Check for common issues
      if (envVars.JWT_SECRET === 'generate-a-strong-random-string-for-jwt') {
        result.issues.push('JWT_SECRET is using default placeholder value');
      }
      
      if (envVars.SESSION_SECRET === 'generate-a-strong-random-string-for-session') {
        result.issues.push('SESSION_SECRET is using default placeholder value');
      }

      result.status = result.missing.length === 0 ? 'PASS' : 'FAIL';
    } else {
      result.status = 'FAIL';
      result.issues.push('.env file does not exist');
    }

    return result;
  }

  /**
   * Check filesystem requirements
   */
  checkFilesystem() {
    const requiredPaths = [
      { path: 'src', type: 'directory' },
      { path: 'src/server.ts', type: 'file' },
      { path: 'package.json', type: 'file' },
      { path: 'tsconfig.json', type: 'file' },
      { path: 'tsconfig.backend.json', type: 'file' },
      { path: 'logs', type: 'directory' },
      { path: 'node_modules', type: 'directory' }
    ];

    const result = {
      status: 'PASS',
      paths: {},
      missing: [],
      issues: []
    };

    requiredPaths.forEach(({ path: relativePath, type }) => {
      const fullPath = path.join(CONFIG.projectRoot, relativePath);
      const exists = fs.existsSync(fullPath);
      let stats = null;
      
      if (exists) {
        stats = fs.statSync(fullPath);
      }

      result.paths[relativePath] = {
        exists,
        type,
        fullPath,
        stats: stats ? {
          size: stats.size,
          modified: stats.mtime,
          isDirectory: stats.isDirectory(),
          isFile: stats.isFile()
        } : null
      };

      if (!exists) {
        result.missing.push(relativePath);
        result.status = 'FAIL';
      } else if ((type === 'directory' && !stats.isDirectory()) || 
                 (type === 'file' && !stats.isFile())) {
        result.issues.push(`${relativePath} exists but is wrong type (expected ${type})`);
        result.status = 'FAIL';
      }
    });

    return result;
  }

  /**
   * Check Git repository status
   */
  checkGitStatus() {
    const result = {
      status: 'UNKNOWN',
      repository: {
        exists: false,
        branch: null,
        hasChanges: false,
        lastCommit: null
      },
      remotes: [],
      issues: []
    };

    try {
      // Check if .git directory exists
      const gitDir = path.join(CONFIG.projectRoot, '.git');
      result.repository.exists = fs.existsSync(gitDir);
      
      if (!result.repository.exists) {
        result.status = 'FAIL';
        result.issues.push('Not a git repository');
        return result;
      }

      // Get branch info
      result.repository.branch = execSync('git branch --show-current', { 
        encoding: 'utf8', 
        cwd: CONFIG.projectRoot 
      }).trim();

      // Check for uncommitted changes
      const statusOutput = execSync('git status --porcelain', { 
        encoding: 'utf8', 
        cwd: CONFIG.projectRoot 
      }).trim();
      result.repository.hasChanges = statusOutput.length > 0;
      
      if (result.repository.hasChanges) {
        result.repository.changes = statusOutput.split('\n').map(line => {
          const [status, ...pathParts] = line.split(' ');
          return {
            status: status.trim(),
            path: pathParts.join(' ').trim()
          };
        });
      }

      // Get last commit
      result.repository.lastCommit = execSync('git log -1 --pretty=format:"%h - %s (%cr)"', { 
        encoding: 'utf8', 
        cwd: CONFIG.projectRoot 
      }).trim();

      // Get remotes
      const remotesOutput = execSync('git remote -v', { 
        encoding: 'utf8', 
        cwd: CONFIG.projectRoot 
      }).trim();
      
      if (remotesOutput) {
        result.remotes = remotesOutput.split('\n').map(line => {
          const [name, url, type] = line.split(/\s+/);
          return { name, url, type };
        });
      }

      result.status = 'PASS';

    } catch (error) {
      result.status = 'FAIL';
      result.issues.push(`Git command error: ${error.message}`);
    }

    return result;
  }

  /**
   * Check Node.js and dependencies health
   */
  async checkNodeJsHealth() {
    const result = {
      status: 'PASS',
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        memory: process.memoryUsage()
      },
      npm: {},
      dependencies: {
        status: 'UNKNOWN',
        outdated: [],
        vulnerabilities: null
      },
      issues: []
    };

    try {
      // Get npm version
      result.npm.version = execSync('npm --version', { encoding: 'utf8' }).trim();
      
      // Check if node_modules exists and is recent
      const nodeModulesPath = path.join(CONFIG.projectRoot, 'node_modules');
      if (fs.existsSync(nodeModulesPath)) {
        const stats = fs.statSync(nodeModulesPath);
        const packageJsonStats = fs.statSync(path.join(CONFIG.projectRoot, 'package.json'));
        
        result.dependencies.nodeModulesExists = true;
        result.dependencies.nodeModulesModified = stats.mtime;
        result.dependencies.packageJsonModified = packageJsonStats.mtime;
        
        // Check if node_modules is older than package.json
        if (stats.mtime < packageJsonStats.mtime) {
          result.issues.push('node_modules appears to be outdated (older than package.json)');
          result.status = 'WARNING';
        }
      } else {
        result.dependencies.nodeModulesExists = false;
        result.issues.push('node_modules directory does not exist');
        result.status = 'FAIL';
      }

      // Quick dependency check (don't run full audit due to time)
      try {
        const packageJson = JSON.parse(fs.readFileSync(path.join(CONFIG.projectRoot, 'package.json'), 'utf8'));
        result.dependencies.totalDependencies = Object.keys(packageJson.dependencies || {}).length;
        result.dependencies.totalDevDependencies = Object.keys(packageJson.devDependencies || {}).length;
        result.dependencies.status = 'CHECKED';
      } catch (error) {
        result.issues.push('Unable to read package.json');
        result.status = 'FAIL';
      }

    } catch (error) {
      result.issues.push(`Node.js health check error: ${error.message}`);
      result.status = 'FAIL';
    }

    return result;
  }

  /**
   * Check log files status
   */
  checkLogFiles() {
    const logDirectory = path.join(CONFIG.projectRoot, 'logs');
    const expectedLogFiles = ['app.log', 'error.log', 'exceptions.log', 'rejections.log'];
    
    const result = {
      status: 'PASS',
      directory: {
        exists: fs.existsSync(logDirectory),
        path: logDirectory
      },
      files: {},
      issues: []
    };

    if (!result.directory.exists) {
      result.status = 'FAIL';
      result.issues.push('Logs directory does not exist');
      return result;
    }

    expectedLogFiles.forEach(filename => {
      const filePath = path.join(logDirectory, filename);
      const exists = fs.existsSync(filePath);
      
      result.files[filename] = {
        exists,
        path: filePath
      };

      if (exists) {
        const stats = fs.statSync(filePath);
        result.files[filename].stats = {
          size: stats.size,
          modified: stats.mtime,
          sizeHuman: this.formatBytes(stats.size)
        };
      } else {
        result.issues.push(`Log file ${filename} does not exist`);
      }
    });

    return result;
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Add manual log entry
   */
  async addManualLogEntry(message, category = 'MANUAL') {
    try {
      this.updater.addToChangeLog(category, message, {
        source: 'manual',
        user: process.env.USER || process.env.USERNAME || 'unknown',
        workingDirectory: process.cwd()
      });

      await this.updater.updateStatus(`Manual log entry: ${message}`);
      this.log(`Log entry added: ${message}`);
      
    } catch (error) {
      this.logError('Failed to add log entry', error);
      throw error;
    }
  }

  /**
   * Show help for specific commands
   */
  showCommandHelp(command) {
    const helpText = {
      log: `
Add a manual log entry to PROJECT_STATUS.md

Usage: node scripts/status-logger.js log <message>

Examples:
  node scripts/status-logger.js log "Started new feature development"
  node scripts/status-logger.js log "Fixed authentication bug"
  npm run status:log "Custom message"
`,
      servers: `
Check status of backend (port 3004) and frontend (port 3000) servers

Usage: node scripts/status-logger.js servers [options]

Options:
  --json, -j    Output in JSON format
  --verbose, -v Include detailed server information

Examples:
  node scripts/status-logger.js servers
  node scripts/status-logger.js servers --json
  npm run status:servers
`,
      health: `
Perform comprehensive system health check

Usage: node scripts/status-logger.js health [options]

Options:
  --json, -j    Output in JSON format  
  --verbose, -v Include detailed health information

Checks performed:
  - Environment variables configuration
  - Required files and directories
  - Git repository status
  - Node.js and npm status
  - Log files status
  - Server status

Examples:
  node scripts/status-logger.js health
  node scripts/status-logger.js health --verbose --json
  npm run status:health
`,
      env: `
Validate environment configuration

Usage: node scripts/status-logger.js env [options]

Options:
  --json, -j    Output in JSON format

Validates:
  - .env file existence
  - Required backend variables
  - Required frontend variables
  - Common configuration issues

Examples:
  node scripts/status-logger.js env
  node scripts/status-logger.js env --json
`,
      git: `
Show git repository status information

Usage: node scripts/status-logger.js git [options]

Options:
  --json, -j    Output in JSON format

Shows:
  - Current branch
  - Uncommitted changes
  - Last commit information
  - Remote repositories

Examples:
  node scripts/status-logger.js git
  node scripts/status-logger.js git --json
`,
      update: `
Force update of PROJECT_STATUS.md file

Usage: node scripts/status-logger.js update

Examples:
  node scripts/status-logger.js update
`
    };

    if (helpText[command]) {
      console.log(helpText[command]);
    } else {
      console.log(`No help available for command: ${command}`);
    }
  }
}

// Main CLI function
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
M365 Tenant Admin Tool - Status Logger

Usage: node scripts/status-logger.js <command> [options]

Commands:
  log <message>     Add a manual log entry
  servers          Check server status
  health           Full system health check  
  env              Validate environment configuration
  git              Show git status information
  update           Force status file update
  
Options:
  --verbose, -v    Enable verbose logging
  --json, -j       Output in JSON format
  --help, -h       Show help for specific command

Examples:
  node scripts/status-logger.js log "Started development"
  node scripts/status-logger.js servers --json
  node scripts/status-logger.js health --verbose

For command-specific help:
  node scripts/status-logger.js <command> --help
`);
    return;
  }

  const command = args[0];
  const options = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    json: args.includes('--json') || args.includes('-j'),
    help: args.includes('--help') || args.includes('-h')
  };

  const logger = new StatusLogger(options);

  if (options.help) {
    logger.showCommandHelp(command);
    return;
  }

  try {
    switch (command) {
      case 'log':
        const message = args.slice(1).filter(arg => !arg.startsWith('-')).join(' ');
        if (!message) {
          console.error('Error: Message is required for log command');
          console.error('Usage: node scripts/status-logger.js log <message>');
          process.exit(1);
        }
        await logger.addManualLogEntry(message);
        break;

      case 'servers':
        const serverStatus = await logger.getServerStatus();
        logger.log('Server Status Check Complete', serverStatus);
        break;

      case 'health':
        const healthStatus = await logger.performHealthCheck();
        logger.log(`System Health: ${healthStatus.overall}`, healthStatus);
        break;

      case 'env':
        const envStatus = logger.checkEnvironment();
        logger.log(`Environment Status: ${envStatus.status}`, envStatus);
        break;

      case 'git':
        const gitStatus = logger.checkGitStatus();
        logger.log(`Git Status: ${gitStatus.status}`, gitStatus);
        break;

      case 'update':
        await logger.updater.updateStatus('Manual status update via CLI');
        logger.log('Status file updated successfully');
        break;

      default:
        console.error(`Unknown command: ${command}`);
        console.error('Run "node scripts/status-logger.js" for usage information');
        process.exit(1);
    }

  } catch (error) {
    logger.logError(`Command '${command}' failed`, error);
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

module.exports = { StatusLogger };