import express from 'express';

const app = express();
const port = 3004;

app.get('/', (_req, res) => {
  res.json({ message: 'API is running' });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});