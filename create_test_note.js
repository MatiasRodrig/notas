const http = require('http');

const data = JSON.stringify({
  title: 'Prueba de Mermaid',
  content: `# Test de Mermaid

Este es un diagrama para verificar la funcionalidad:

\`\`\`mermaid
graph TD;
    A[Inicio] --> B{¿Funciona?};
    B -- Sí --> C[¡Genial!];
    B -- No --> D[Revisar Código];
\`\`\`
`,
  categoryId: 'cat-1'
});

const options = {
  hostname: 'localhost',
  port: 4222,
  path: '/api/notes',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('✅ Status:', res.statusCode);
    console.log('✅ Response:', body);
  });
});

req.on('error', (e) => {
  console.error('❌ Error:', e.message);
});

req.write(data);
req.end();
