import { Controller, Handler, Interface } from "./interface";
import { Request, Response } from "express";
import { OpenApiRequest } from "./types";
import { ArgsRetriever } from "./ArgsRetriever";

export class EOVHandlerAdapter {
  constructor(private argsRetriever: ArgsRetriever) {}

  createController(
    handler: Handler<Interface<unknown, unknown>, unknown>
  ): Controller {
    return async (request: Request, response: Response) => {
      const input = this.argsRetriever.retrieve(request as OpenApiRequest);
      const output = await handler(input);

      response.status(output.httpCode);

      const body = output.type === "success" ? output.payload : output.error;
      if (typeof body === "object") {
        response.json(body);
      } else {
        response.end(body);
      }
    };
  }
}
