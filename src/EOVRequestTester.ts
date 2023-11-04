import express from "express";
import cookieParser from "cookie-parser";
import * as bodyParser from "body-parser";
import OpenApiValidator from "express-openapi-validator";
import { OpenApiRequest } from "./types.js";

export class EOVRequestTester<R> {
  private app: express.Express;
  private result:
    | { type: "success"; value: R }
    | { type: "error"; error: Error }
    | { type: "intermediate" } = { type: "intermediate" };

  constructor(apiSpecPath: string, func: (req: OpenApiRequest) => Promise<R>) {
    this.app = express();
    this.app.use(cookieParser());
    this.app.use(bodyParser.raw());
    this.app.use(bodyParser.json({ type: "application/json", limit: "400kb" }));
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(bodyParser.text());
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
    this.app.all("*", async (req, res, next) => {
      try {
        const result = await func(req as OpenApiRequest);
        this.result = { type: "success", value: result };
        res.json("OK");
      } catch (err) {
        next(err);
      }
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
