const fs = require('fs');
const path = require('path');

const appsDir = path.join(__dirname, '../apps');
const dirs = [
  'public-service', 'notification-service', 'messaging-service', 'intake-service', 
  'document-service', 'case-service', 'booking-service', 'billing-service',
  'api-gateway', 'auth-service', 'admin-service', 'ai-service'
];

dirs.forEach(dir => {
  const indexPath = path.join(appsDir, dir, 'index.js');
  if (fs.existsSync(indexPath)) {
    let content = fs.readFileSync(indexPath, 'utf8');
    
    // First remove any existing module.exports or if (require.main === module) blocks
    content = content.replace(/if\s*\(require\.main\s*===\s*module\)\s*\{[\s\S]*\} else \{\n  module\.exports = app;\n\}/g, '');
    content = content.replace(/module\.exports\s*=\s*app;?/g, '');
    
    // Now find any raw app.listen block
    content = content.replace(/app\.listen\([^;]*;/g, "if (require.main === module) {\n  $& \n} else {\n  module.exports = app;\n}");
    
    // Some might have a slightly different format, or missing semicolons.
    // Let's just forcefully append the export if it doesn't have require.main
    if (!content.includes('require.main === module')) {
       // if it failed to match, we fallback
       content = content.replace(/app\.listen\([\s\S]*\}\);/g, "if (require.main === module) {\n  $&\n} else {\n  module.exports = app;\n}");
    }

    // Safety net: ensure there is an export
    if (!content.includes('module.exports = app')) {
        content += "\nmodule.exports = app;\n";
        // Also comment out app.listen manually
        content = content.replace(/app\.listen/g, "// app.listen");
    }
    
    fs.writeFileSync(indexPath, content);
    console.log("Fixed " + dir);
  }
});
