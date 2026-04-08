const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function createNote() {
    const db = await open({
        filename: path.join(__dirname, 'data', 'notes.db'),
        driver: sqlite3.Database
    });

    const id = `note-${Date.now()}`;
    const title = 'Prueba de Mermaid';
    const content = `# Test de Mermaid

Este es un diagrama para verificar la funcionalidad:

\`\`\`mermaid
graph TD;
    A[Inicio] --> B{¿Funciona?};
    B -- Sí --> C[¡Genial!];
    B -- No --> D[Revisar Código];
\`\`\`
`;
    const categoryId = 'cat-1';

    await db.run(`
        INSERT INTO notes (id, title, content, category_id, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'))
    `, id, title, content, categoryId);

    console.log('✅ Nota creada en DB con ID:', id);
    await db.close();
}

createNote().catch(err => console.error('❌ Error:', err));
