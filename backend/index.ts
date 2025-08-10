import express from 'express';
import pg from 'pg';

const app = express();
const PORT = 5000;
const pool = new pg.Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'whiteboard',
  password: 'yourpassword',
  port: 5432,
});

app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});