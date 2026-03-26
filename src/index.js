import express from "express";
import cors from "cors";
import { matchRouter } from "./routes/matches.js";

const app = express();
const port = 8000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Sports Server run successfully");
});

app.use('/matches', matchRouter)



app.listen(port, () => {
  console.log(`server running on the : http://localhost:${port}`);
});
