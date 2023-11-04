import { Controller, Handler, Interface } from "./interface.js";
import { NextFunction, Request, Response } from "express";
import { OpenApiRequest } from "./types.js";
import { ArgsRetriever } from "./ArgsRetriever.js";
import { RequestBodyCoordinator } from "./RequestBodyCoordinator/RequestBodyCoordinator.js";
import { OpenAPIV3 } from "express-openapi-validator/dist/framework/types.js";

export class EOVHandlerAdapter {
  private argsRetriever: ArgsRetriever;

  constructor(
    apiSpec: OpenAPIV3.Document,
    requestBodyCoordinator: RequestBodyCoordinator
  ) {
    this.argsRetriever = new ArgsRetriever(apiSpec, requestBodyCoordinator);
  }

  connect<I extends Interface<unknown, unknown>, E = unknown>(
    handler: Handler<I, E>
  ): Controller {
    return async (request: Request, response: Response, next: NextFunction) => {
      try {
        const input = this.argsRetriever.retrieve(request as OpenApiRequest);
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
