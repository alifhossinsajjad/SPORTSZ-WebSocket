import express from "express";

const app = express();
const port = 8000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Sports Server run successfully");
});

app.listen(port, () => {
  console.log(`server running on the : http://localhost:${port}`);
});
