const fs = require('fs');
const path = require('path');

function search(dir) {
    fs.readdirSync(dir).forEach(file => {
        const full = path.join(dir, file);
        if (fs.statSync(full).isDirectory() && !full.includes('node_modules') && !full.includes('.git') && !full.includes('.agent')) {
            search(full);
        } else if (full.endsWith('.js') || full.endsWith('.html')) {
            const content = fs.readFileSync(full, 'utf8');
            if (content.includes('restrito') || content.includes('superadministrador')) {
                console.log(full);
            }
        }
    });
}

search('.');
