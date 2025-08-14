import chalk from "chalk";
import { buildApp } from "./app";

(async () => {
  const app = await buildApp();

  console.log(chalk.cyan("\n=== Rotas registradas ===\n"));
  app
    .printRoutes()
    .split("\n")
    .forEach((line) => {
      if (line.includes("POST")) console.log(chalk.green(line));
      else if (line.includes("GET")) console.log(chalk.blue(line));
      else console.log(line);
    });
  console.log(chalk.cyan("\n========================\n"));

  await app.listen({ port: 3001, host: "0.0.0.0" });
  console.log(chalk.yellow("Servidor rodando em http://localhost:3001"));
  console.log(chalk.yellow("Docs em http://localhost:3001/docs"));
})();
