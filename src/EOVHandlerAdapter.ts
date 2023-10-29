import { Controller, Handler, Interface } from "./interface";
import { Request, Response } from "express";
import { OpenApiRequest } from "./types";
import { ArgsRetriever } from "./ArgsRetriever";
import { RequestBodyCoordinator } from "./RequestBodyCoordinator/RequestBodyCoordinator";

export class EOVHandlerAdapter {
  private argsRetriever: ArgsRetriever;

  constructor(requestBodyCoordinator: RequestBodyCoordinator) {
    this.argsRetriever = new ArgsRetriever(requestBodyCoordinator);
  }

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
