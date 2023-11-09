import { Controller, Handler, Interface } from "./interface.js";
import { NextFunction, Request, Response } from "express";
import { OpenApiRequest } from "./types.js";
import { ParamsRetriever } from "./ParamsRetriever.js";
import { ParamsConverter } from "./ParamsConverter/ParamsConverter.js";
import { OpenAPIV3 } from "express-openapi-validator/dist/framework/types.js";

export class EOVHandlerAdapter {
  private paramsRetriever: ParamsRetriever;

  constructor(apiSpec: OpenAPIV3.Document, paramsConverter: ParamsConverter) {
    this.paramsRetriever = new ParamsRetriever(apiSpec, paramsConverter);
  }

  connect<I extends Interface<unknown, unknown>, E = unknown>(
    handler: Handler<I, E>
  ): Controller {
    return async (request: Request, response: Response, next: NextFunction) => {
      try {
        const input = this.paramsRetriever.retrieve(request as OpenApiRequest);
        const output = await handler(input);

        response.status(output.httpCode);

        const body = output.type === "success" ? output.payload : output.error;
        if (typeof body === "object") {
          response.json(body);
        } else {
          response.end(body);
        }
      } catch (err) {
        next(err);
      }
    };
  }
}
