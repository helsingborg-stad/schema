const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../schema.jsonld');
const classesDir = path.join(__dirname, '../schema/definitions/classes');
const propertiesDir = path.join(__dirname, '../schema/definitions/properties');

// Read the original schema.jsonld to get the @context
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const context = schema['@context'];

// Helper to read all JSON files in a directory
function readJsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  let results = [];
  fs.readdirSync(dir).forEach(f => {
    const fullPath = path.join(dir, f);
    if (fs.statSync(fullPath).isDirectory()) {
      results = results.concat(readJsonFiles(fullPath));
    } else if (f.endsWith('.jsonld')) {
      results.push(JSON.parse(fs.readFileSync(fullPath, 'utf8')));
    }
  });
  return results;
}

// Collect all definitions
const classes = readJsonFiles(classesDir);
const properties = readJsonFiles(propertiesDir);

// Build the merged schema
const merged = {
  '@context': context,
  '@graph': [...classes, ...properties]
};

// Write back to schema.jsonld
fs.writeFileSync(schemaPath, JSON.stringify(merged, null, 4));
console.log('schema.jsonld has been updated!');
