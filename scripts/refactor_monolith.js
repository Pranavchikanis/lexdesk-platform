const fs = require('fs');
const path = require('path');

const appsDir = path.join(__dirname, '../apps');
const dirs = [
  'public-service', 'notification-service', 'messaging-service', 'intake-service', 
  'document-service', 'case-service', 'booking-service', 'billing-service', 
  'auth-service', 'admin-service', 'ai-service'
];

for (const dir of dirs) {
  const file = path.join(appsDir, dir, 'index.js');
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Check if it's already wrapped
    if (content.includes('require.main === module')) {
      console.log('Already wrapped in ' + dir);
      continue;
    }

    const regex = /app\.listen\([^{]+{\s*console\.log\((['`"])[^'"`]*?\1\);\s*}\);/g;
    
    if (regex.test(content)) {
      content = content.replace(regex, (match) => {
        return 'if (require.main === module) {\n  ' + match + '\n} else {\n  module.exports = app;\n}';
      });
      fs.writeFileSync(file, content);
      console.log('Successfully updated ' + dir);
    } else {
      console.log('WARNING: No exact app.listen match found in ' + dir + '. Please check manually.');
    }
  }
}
