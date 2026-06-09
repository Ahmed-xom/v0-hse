import { Pool } from 'pg';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createTableFromExcelSheet(filename, sheetName, headers) {
  const tableName = `excel_${sheetName.replace(/-/g, '_').substring(0, 30).toLowerCase()}`;
  const columns = headers
    .map((h, i) => {
      const colName = (h || `col_${i + 1}`)
        .replace(/[^a-zA-Z0-9_]/g, '_')
        .toLowerCase()
        .substring(0, 30);
      return `"${colName}" TEXT`;
    })
    .join(', ');

  const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (
    id SERIAL PRIMARY KEY,
    ${columns},
    created_at TIMESTAMP DEFAULT NOW()
  )`;

  try {
    await pool.query(sql);
    console.log(`✓ Created table: ${tableName}`);
    return tableName;
  } catch (err) {
    console.error(`✗ Failed to create ${tableName}:`, err.message);
    throw err;
  }
}

async function importExcelData() {
  const himayaPath = '/tmp/himaya';
  const files = fs.readdirSync(himayaPath).filter(f => f.endsWith('.xls') || f.endsWith('.xlsx')).sort();

  let tablesCreated = 0;

  for (const file of files) {
    const filepath = path.join(himayaPath, file);
    try {
      const wb = XLSX.readFile(filepath);

      for (const sheetName of wb.SheetNames) {
        const ws = wb.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const headers = data[0] || [];

        // Create table
        const tableName = await createTableFromExcelSheet(file, sheetName, headers);
        tablesCreated++;

        // Insert data rows
        if (data.length > 1) {
          for (let i = 1; i < data.length; i++) {
            const row = data[i];
            const values = headers.map((_, idx) => row[idx] || null);
            const placeholders = values.map((_, idx) => `$${idx + 1}`).join(', ');
            const colNames = headers.map(h => `"${(h || `col_${headers.indexOf(h) + 1}`).replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase().substring(0, 30)}"`).join(', ');

            try {
              await pool.query(
                `INSERT INTO ${tableName} (${colNames}) VALUES (${placeholders})`,
                values
              );
            } catch (err) {
              // Log but continue on insert errors
              if (i <= 3) {
                console.log(`  ⚠ Insert error in row ${i}:`, err.message.substring(0, 50));
              }
            }
          }
          console.log(`  → Imported ${data.length - 1} rows`);
        }
      }
    } catch (err) {
      console.error(`✗ Error processing ${file}:`, err.message);
    }
  }

  console.log(`\n✓ All ${tablesCreated} tables created successfully`);
  await pool.end();
}

importExcelData().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
