const { Client } = require('pg')
const fs = require('fs')
const dotenv = require('dotenv')
dotenv.config({ path: '.env.local' })

const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL
if (!connectionString) {
  console.error('Missing SUPABASE_DB_URL or DATABASE_URL')
  process.exit(1)
}

let sql = process.env.SQL
const fileArg = process.argv[2]
if (!sql && fileArg) {
  if (!fs.existsSync(fileArg)) {
    console.error(`SQL file not found: ${fileArg}`)
    process.exit(1)
  }
  sql = fs.readFileSync(fileArg, 'utf8')
}
if (!sql) {
  console.error('Provide SQL via env SQL or file path argument')
  process.exit(1)
}

async function main() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  })
  await client.connect()
  try {
    const res = await client.query(sql)
    if (res && res.rows) {
      console.log(JSON.stringify(res.rows, null, 2))
    } else {
      console.log('OK')
    }
  } catch (e) {
    console.error(e)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()

