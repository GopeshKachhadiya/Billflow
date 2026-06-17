const fs = require('fs');
const path = require('path');

const dir = 'e:\\automation\\n8n-workflows';
const sourceDir = path.join(dir, 'archive');
const files = fs.readdirSync(sourceDir)
  .filter(f => f.startsWith('WF-') && f.endsWith('.json'))
  .sort(); // Sort to ensure WF-01, WF-02...

const wfNodeNames = {};
const filesData = [];

// 1. Gather all node names first for expression updating
files.forEach(file => {
  const match = file.match(/^WF-(\d+)/);
  if (!match) return;
  const wfNum = match[1];
  const prefix = `WF-${wfNum}`;
  
  const filePath = path.join(sourceDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  const names = data.nodes.map(n => n.name);
  wfNodeNames[prefix] = names;
});

// Recursive function to update string parameters
function updateExpressionParams(obj, prefix, nodeNames) {
  if (typeof obj === 'string') {
    let updated = obj;
    // Sort node names by length descending to avoid partial matches
    const sortedNames = [...nodeNames].sort((a, b) => b.length - a.length);
    sortedNames.forEach(name => {
      const escapeRegex = s => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const escapedName = escapeRegex(name);
      
      // Match $('name') or $("name") or $node('name')
      const regex = new RegExp(`(['"])${escapedName}(['"])`, 'g');
      updated = updated.replace(regex, `$1${prefix}: ${name}$2`);
    });
    return updated;
  } else if (Array.isArray(obj)) {
    return obj.map(item => updateExpressionParams(item, prefix, nodeNames));
  } else if (obj !== null && typeof obj === 'object') {
    const newObj = {};
    for (const key in obj) {
      newObj[key] = updateExpressionParams(obj[key], prefix, nodeNames);
    }
    return newObj;
  }
  return obj;
}

// 2. Load and process each workflow file
files.forEach((file, fileIdx) => {
  const match = file.match(/^WF-(\d+)/);
  if (!match) return;
  const wfNum = match[1];
  const prefix = `WF-${wfNum}`;
  const xOffset = fileIdx * 2500; // Separation offset horizontally
  
  const filePath = path.join(sourceDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // Process nodes
  data.nodes.forEach(node => {
    node.originalName = node.name;
    node.name = `${prefix}: ${node.name}`;
    if (node.position) {
      node.position[0] += xOffset;
    }
    node.parameters = updateExpressionParams(node.parameters, prefix, wfNodeNames[prefix]);
  });
  
  // Process connections
  const newConnections = {};
  for (const srcNode in data.connections) {
    const newSrc = `${prefix}: ${srcNode}`;
    newConnections[newSrc] = {};
    for (const connType in data.connections[srcNode]) {
      newConnections[newSrc][connType] = data.connections[srcNode][connType].map(branch => {
        return branch.map(target => {
          return {
            node: `${prefix}: ${target.node}`,
            type: target.type,
            index: target.index
          };
        });
      });
    }
  }
  
  filesData.push({
    wfNum,
    prefix,
    nodes: data.nodes,
    connections: newConnections
  });
});

// 3. Delete "Trigger WF-02 Bill Send" from WF-01 and bypass it to connect directly to WF-02's "Set Variables"
const wf01 = filesData.find(d => d.prefix === 'WF-01');
const wf02 = filesData.find(d => d.prefix === 'WF-02');

if (wf01 && wf02) {
  // Delete the Execute Workflow node from WF-01 nodes
  const targetNodeName = 'WF-01: Trigger WF-02 Bill Send';
  wf01.nodes = wf01.nodes.filter(n => n.name !== targetNodeName);
  
  // Delete the connection from this node if any
  delete wf01.connections[targetNodeName];
  
  // Re-route connection in WF-01 "Bill Status = Sent?" output 0 (true) to WF-02's "Set Variables"
  const ifNodeName = 'WF-01: Bill Status = Sent?';
  const newTargetNodeName = 'WF-02: Set Variables';
  
  if (wf01.connections[ifNodeName] && wf01.connections[ifNodeName].main) {
    wf01.connections[ifNodeName].main = wf01.connections[ifNodeName].main.map((branch, idx) => {
      if (idx === 0) {
        return branch.map(target => {
          if (target.node === targetNodeName) {
            return {
              node: newTargetNodeName,
              type: 'main',
              index: 0
            };
          }
          return target;
        });
      }
      return branch;
    });
  }
  console.log('Successfully connected WF-01 directly to WF-02');
}

// 4. Merge all nodes and connections
let mergedNodes = [];
let mergedConnections = {};

filesData.forEach(wf => {
  mergedNodes = mergedNodes.concat(wf.nodes);
  mergedConnections = Object.assign(mergedConnections, wf.connections);
});

const finalWorkflow = {
  id: "billflowcore0001",
  name: "BillFlow Core Automation",
  nodes: mergedNodes,
  connections: mergedConnections,
  active: false,
  settings: {
    executionOrder: "v1"
  },
  tags: []
};

fs.writeFileSync(
  path.join(dir, 'BILLFLOW_ALL_22_WORKFLOWS.json'),
  JSON.stringify(finalWorkflow, null, 2),
  'utf8'
);

console.log(`Successfully combined 22 workflows into one single workflow canvas with ${mergedNodes.length} nodes!`);
