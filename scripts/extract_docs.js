const fs = require('fs');
const d = JSON.parse(fs.readFileSync('e:\\\\automation\\\\n8n-workflows\\\\BILLFLOW_ALL_22_WORKFLOWS.json', 'utf8'));

const workflows = {};
d.nodes.forEach(n => {
    const match = n.name.match(/WF-(\d+):/);
    if (match) {
        const wf = match[1];
        if (!workflows[wf]) workflows[wf] = [];
        workflows[wf].push({
            name: n.name,
            type: n.type,
            notes: n.notes || '',
            originalName: n.originalName || ''
        });
    }
});

let md = '# BillFlow Automations Explained\n\nThis document explains what every step in the 22 automated workflows is responsible for.\n\n';

Object.keys(workflows).sort((a,b) => parseInt(a) - parseInt(b)).forEach(wf => {
    md += `## WF-${wf}\n`;
    workflows[wf].forEach(n => {
        md += `- **${n.name}** \n  - *Type*: \`${n.type}\`\n  - *Purpose*: ${n.notes ? n.notes : 'Executes the ' + n.originalName + ' operation.'}\n`;
    });
    md += '\n';
});

fs.writeFileSync('e:\\\\automation\\\\n8n-workflows\\\\WORKFLOW_STEPS_EXPLAINED.md', md, 'utf8');
console.log('Documentation written to e:\\automation\\n8n-workflows\\WORKFLOW_STEPS_EXPLAINED.md');
