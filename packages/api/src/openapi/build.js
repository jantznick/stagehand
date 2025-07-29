import { buildOpenAPISpec } from './index.js';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Build the OpenAPI specification
const spec = buildOpenAPISpec();

// Write to a static file
const outputPath = join(__dirname, 'openapi-spec.json');
writeFileSync(outputPath, JSON.stringify(spec, null, 2));

console.log(`✅ OpenAPI specification built successfully!`);
console.log(`📁 Output: ${outputPath}`);
console.log(`📊 Spec includes:`);
console.log(`   - ${Object.keys(spec.paths).length} endpoints`);
console.log(`   - ${Object.keys(spec.components.schemas).length} schemas`);
console.log(`   - ${spec.tags?.length || 0} tags`); 