import camelcase from "camelcase";
import { OpenApiRequest } from "./types";
import { RequestBodyCoordinator } from "./RequestBodyCoordinator/RequestBodyCoordinator";
import { contentTypeFrom, scanSchema } from "./utils";

export class ArgsRetriever {
  constructor(private requestBodyCoordinator: RequestBodyCoordinator) {}

  retrieve(req: OpenApiRequest): Record<string, unknown> {
    const params: Record<string, unknown> = {};

    const requestBodySchema = req.openapi.schema.requestBody;
    if (requestBodySchema) {
      if ("$ref" in requestBodySchema) {
        throw new Error("$ref is not supposed to be in request");
      }

      const contentType = contentTypeFrom(req);
      if (!(contentType in requestBodySchema.content)) {
        throw new Error(
          `content type ${contentType} is not supported with ${req.openapi.openApiRoute}`
        );
      }

      const content = requestBodySchema.content[contentType];
      if (!content.schema) {
        throw new Error(`schema for ${contentType} is not defined`);
      }

      if ("$ref" in content.schema) {
        throw new Error("$ref is not supposed to be in request metadata");
      }

      let fileValues: Record<
        string,
        Express.Multer.File | Express.Multer.File[]
      > = {};
      if (contentType === "multipart/form-data") {
        if (!content.schema.properties) {
          throw new Error("properties for multipart/form-data is not defined");
        }
        const files = Array.isArray(req.files) ? req.files : [];
        scanSchema(content.schema.properties, [], (path, prop) => {
          const name = path[0];
          if ("$ref" in prop) {
            return;
          }
          if (prop.format === "binary") {
            const file = files.find((file) => file.fieldname === name);
            if (file) {
              fileValues[name] = file;
            }
          }
          if (
            prop.type === "array" &&
            "format" in prop.items &&
            prop.items.format === "binary"
          ) {
            const fls = files.filter((file) => file.fieldname === name);
            fileValues[name] = fls;
          }
        });
      }

      const value =
        content.schema.type === "object"
          ? { ...req.body, ...fileValues }
          : req.body;

      const wrappedValues = this.requestBodyCoordinator.wrap(
        contentType,
        value,
        req.openapi
      );
      for (const key in wrappedValues) {
        params[key] = wrappedValues[key];
      }
    }

    const paramsSchema = req.openapi.schema.parameters;
    if (paramsSchema) {
      for (const param of paramsSchema) {
        if ("$ref" in param) {
          throw new Error("$ref in parameters is not supported");
        }

        switch (param.in) {
          case "path":
            params[param.name] = req.openapi.pathParams[param.name];
            break;
          case "query":
            params[param.name] = req.query[param.name];
            break;
          case "header":
            params[
              camelcase(param.name, { preserveConsecutiveUppercase: true })
            ] = req.headers[param.name.toLowerCase()];
            break;
          case "cookie":
            params[param.name] = req.cookies[param.name];
            break;
        }
      }
    }

    return params;
  }
}
