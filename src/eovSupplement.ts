import { Handler } from "express";
import { OpenAPIV3 } from "express-openapi-validator/dist/framework/types";
import { ContentType, HTTP_METHODS, OpenApiRequest } from "./types";
import { contentTypeFrom, httpMethodFrom, pathKey } from "./utils";

interface Metadata {
  originalRef: string;
}

export const eovSupplement = (doc: OpenAPIV3.Document) => {
  const map = new Map<string, Metadata>();
  for (const path in doc.paths) {
    for (const httpMethod of HTTP_METHODS) {
      const operation = doc.paths[path][httpMethod];
      if (operation?.requestBody && "content" in operation.requestBody) {
        for (const contentType in operation.requestBody.content) {
          const content = operation.requestBody.content[contentType];
          if (content.schema && "$ref" in content.schema) {
            const key = pathKey(path, httpMethod, contentType as ContentType);
            map.set(key, { originalRef: content.schema.$ref });
          }
        }
      }
    }
  }

  const handler: Handler = (rawReq, res, next) => {
    const req = rawReq as OpenApiRequest;
    if (!req.openapi) {
      throw new Error(
        "openapi is not defined in request. please use express-openapi-validator before this"
      );
    }

    if (
      !req.openapi.schema.requestBody ||
      "$ref" in req.openapi.schema.requestBody
    ) {
      return next();
    }

    const httpMethod = httpMethodFrom(req);
    const contentType = contentTypeFrom(req);
    const key = pathKey(req.openapi.openApiRoute, httpMethod, contentType);
    const metadata = map.get(key);
    if (metadata && req.openapi.schema.requestBody.content[contentType]) {
      req.openapi.schema.requestBody.content[contentType].originalRef =
        metadata.originalRef;
    }
    next();
  };
  return handler;
};
