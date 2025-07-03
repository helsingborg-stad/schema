const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../schema/schema.jsonld');
const templatePath = path.join(__dirname, '../doc-template/doc-template.html');
const outputPath = path.join(__dirname, '../index.html');

const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const graph = schema['@graph'] || [];
const template = fs.readFileSync(templatePath, 'utf8');

function escapeHtml(str) {
  return (str || '').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
}

function renderProperty(prop) {
  return `<div class="property">
    <h4 id="${escapeHtml(prop['@id'])}">${escapeHtml(prop['rdfs:label'] || prop['@id'])}</h4>
    <p>${escapeHtml(prop['rdfs:comment'] || '')}</p>
    <ul>
      <li><b>Type:</b> ${escapeHtml(prop['@type'])}</li>
      <li><b>Domain:</b> ${escapeHtml((prop['schema:domainIncludes'] && prop['schema:domainIncludes']['@id']) || '')}</li>
      <li><b>Range:</b> ${escapeHtml((prop['schema:rangeIncludes'] && prop['schema:rangeIncludes']['@id']) || '')}</li>
    </ul>
  </div>`;
}

function renderClass(cls) {
  return `<div class="class">
    <h3 id="${escapeHtml(cls['@id'])}">${escapeHtml(cls['rdfs:label'] || cls['@id'])}</h3>
    <p>${escapeHtml(cls['rdfs:comment'] || '')}</p>
    <ul>
      <li><b>Type:</b> ${escapeHtml(cls['@type'])}</li>
      <li><b>Subclass of:</b> ${escapeHtml((cls['rdfs:subClassOf'] && cls['rdfs:subClassOf']['@id']) || '')}</li>
    </ul>
  </div>`;
}

const classes = graph.filter(e => e['@type'] === 'rdfs:Class');
const properties = graph.filter(e => e['@type'] === 'rdf:Property');

// Group properties by domain
const propertiesByDomain = {};
properties.forEach(prop => {
  let domain = (prop['schema:domainIncludes'] && prop['schema:domainIncludes']['@id']) || 'Other';
  if (!propertiesByDomain[domain]) propertiesByDomain[domain] = [];
  propertiesByDomain[domain].push(prop);
});

const classesHtml = classes.map(renderClass).join('\n');
const propertiesByDomainHtml = Object.entries(propertiesByDomain).map(([domain, props]) => `
    <div class="domain-group">
      <h3>${escapeHtml(domain)}</h3>
      ${props.map(renderProperty).join('\n')}
    </div>
  `).join('\n');

const html = template
  .replace(/{{title}}/g, 'Municipio Schema Documentation')
  .replace('{{classes}}', classesHtml)
  .replace('{{propertiesByDomain}}', propertiesByDomainHtml);

fs.writeFileSync(outputPath, html);
console.log('Documentation generated at index.html');
