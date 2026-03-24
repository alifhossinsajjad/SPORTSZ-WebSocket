import express from "express";

const app = express();
const PORT = 8000;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Hello from Express on port 8000!" });
});

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
