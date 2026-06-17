const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');

const dbPath = path.join(os.homedir(), '.n8n', 'database.sqlite');
console.log('Opening database at:', dbPath);

try {
  const db = new Database(dbPath, { fileMustExist: true });
  
  // Find workflows to delete (starting with 'WF-')
  const workflows = db.prepare("SELECT id, name FROM workflow_entity WHERE name LIKE 'WF-%'").all();
  console.log(`Found ${workflows.length} workflows to delete:`);
  workflows.forEach(w => console.log(`- [${w.id}] ${w.name}`));
  
  if (workflows.length > 0) {
    const ids = workflows.map(w => w.id);
    
    // Begin transaction to safely delete
    const deleteTx = db.transaction(() => {
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
      
      if (tables.includes('shared')) {
        const info = db.prepare("DELETE FROM shared WHERE workflowId IN (" + ids.map(() => '?').join(',') + ")").run(...ids);
        console.log(`Deleted ${info.changes} records from shared`);
      }
      
      // Let's also check if there is workflow_tag or similar junction table
      const junctionTable = tables.find(t => t.includes('tag') && t.includes('workflow'));
      if (junctionTable) {
        try {
          const info = db.prepare(`DELETE FROM ${junctionTable} WHERE workflowId IN (` + ids.map(() => '?').join(',') + `)`).run(...ids);
          console.log(`Deleted ${info.changes} records from ${junctionTable}`);
        } catch (e) {
          // ignore if table doesn't have workflowId
        }
      }
      
      const info = db.prepare("DELETE FROM workflow_entity WHERE id IN (" + ids.map(() => '?').join(',') + ")").run(...ids);
      console.log(`Deleted ${info.changes} records from workflow_entity`);
    });
    
    deleteTx();
    console.log('Deletion completed successfully!');
  } else {
    console.log('No separate WF-* workflows found to delete.');
  }
  process.exit(0);
} catch (err) {
  console.error('Error modifying n8n database:', err);
  process.exit(1);
}
