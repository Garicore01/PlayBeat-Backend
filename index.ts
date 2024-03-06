// src/index.js
import express, { type Express, Request, Response } from "express";
import dotenv from "dotenv";

import { routes } from "./routes/routesExport.js";

import bodyParser from "body-parser";

const app: Express = express();
const port = process.env.PORT || 3000;

// body-parser
app.use(bodyParser.json({ limit: "50mb", type: "application/json" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
dotenv.config();

// Routes
app.use(routes);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
