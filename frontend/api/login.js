import pkg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  try {
    // 🔥 handle method
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    // 🔥 parse body (WAJIB di Vercel)
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    const { email, password } = body;

    console.log("EMAIL:", email);
    console.log("PASSWORD:", password);

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    console.log("DB RESULT:", result.rows);

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }

    const user = result.rows[0];

    console.log("USER PASSWORD:", user.password);

    const match = await bcrypt.compare(password, user.password);

    console.log("MATCH:", match);

    if (!match) {
      return res.status(400).json({ message: 'Wrong password' });
    }

    return res.status(200).json({
      message: 'Login success',
      user
    });

  } catch (err) {
    console.error("ERROR LOGIN:", err);
    return res.status(500).json({
      message: err.message
    });
  }
}

export const config = {
  runtime: 'nodejs'
};