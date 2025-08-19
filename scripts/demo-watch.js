#!/usr/bin/env node
/**
 * M365 Tenant Admin Tool - Status Watching Demo
 * 
 * This script demonstrates the file watching capability by running
 * the status watcher for a short period to show how it monitors changes.
 * 
 * Usage:
 *   node scripts/demo-watch.js [duration-seconds]
 * 
 * Example:
 *   node scripts/demo-watch.js 10    # Watch for 10 seconds
 */

const { StatusUpdater } = require('./update-status.js');

async function demo() {
  const duration = parseInt(process.argv[2]) || 30; // Default 30 seconds
  
  console.log(`\n🔍 M365 Status Monitoring Demo`);
  console.log(`⏱️  Running for ${duration} seconds...`);
  console.log(`📁 Monitoring: src/, package.json, .env, and other config files`);
  console.log(`💡 Try modifying a file in src/ to see automatic updates!`);
  console.log(`📄 Check PROJECT_STATUS.md to see changes logged\n`);

  const updater = new StatusUpdater({ verbose: true });

  // Handle shutdown
  let timeoutId;
  const shutdown = () => {
    console.log('\n🛑 Stopping demo...');
    if (timeoutId) clearTimeout(timeoutId);
    updater.shutdown();
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  try {
    // Initial update
    await updater.updateStatus('File watching demo started');
    
    // Start watching
    updater.startWatching();
    
    console.log('✅ File monitoring active!');
    console.log('📝 Make some changes to files and watch the magic happen...');
    console.log('⏹️  Press Ctrl+C to stop early\n');
    
    // Run for specified duration
    timeoutId = setTimeout(() => {
      console.log(`\n⏰ Demo completed after ${duration} seconds`);
      shutdown();
    }, duration * 1000);
    
  } catch (error) {
    console.error('❌ Demo error:', error.message);
    process.exit(1);
  }
}

// Run demo if called directly
if (require.main === module) {
  demo().catch(error => {
    console.error('Fatal demo error:', error);
    process.exit(1);
  });
}