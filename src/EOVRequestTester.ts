import express from "express";
import cookieParser from "cookie-parser";
import * as bodyParser from "body-parser";
import OpenApiValidator from "express-openapi-validator";
import { OpenAPIV3 } from "express-openapi-validator/dist/framework/types";
import { OpenApiRequest } from "./types";
import { eovSupplement } from "./eovSupplement";
import * as fs from "fs";
import * as jsYaml from "js-yaml";

export class EOVRequestTester<R> {
  private app: express.Express;
  private result:
    | { type: "success"; value: R }
    | { type: "error"; error: Error }
    | { type: "intermediate" } = { type: "intermediate" };

  constructor(apiSpecPath: string, func: (req: OpenApiRequest) => Promise<R>) {
    const apiSpec = jsYaml.load(
      fs.readFileSync(apiSpecPath, "utf-8")
    ) as OpenAPIV3.Document;

    this.app = express();
    this.app.use(cookieParser());
    this.app.use(bodyParser.raw());
    this.app.use(bodyParser.json({ type: "application/json", limit: "400kb" }));
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(bodyParser.text());
    this.app.use((req, res, next) => {
      console.log(req.body);
      next();
    });
    this.app.use(
      OpenApiValidator.middleware({
        apiSpec: apiSpecPath,
        serDes: [
          OpenApiValidator.serdes.dateTime.serializer,
          OpenApiValidator.serdes.dateTime.deserializer,
          OpenApiValidator.serdes.date.serializer,
        ],
      })
    );
    this.app.use(eovSupplement(apiSpec));
    this.app.all("*", async (req, res) => {
      const result = await func(req as OpenApiRequest);
      this.result = { type: "success", value: result };
      res.json("OK");
    });

    const errorHandler: express.ErrorRequestHandler = (err, req, res, next) => {
      this.result = { type: "error", error: err };
      res.status(500).end(err.message);
    };
    this.app.use(errorHandler);
  }

  async test(fn: (app: express.Express) => Promise<unknown>) {
    await fn(this.app);

    if (this.result.type === "intermediate") {
      throw new Error("Result is not ready yet");
    }

    if (this.result.type === "error") {
      throw this.result.error;
    }

    return this.result.value;
  }
}
