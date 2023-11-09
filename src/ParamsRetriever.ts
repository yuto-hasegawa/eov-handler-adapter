import camelcase from "camelcase";
import { ContentType, HTTP_METHODS, OpenApiRequest } from "./types.js";
import { ParamsConverter } from "./ParamsConverter/ParamsConverter.js";
import {
  contentTypeFrom,
  httpMethodFrom,
  pathKey,
  scanSchema,
} from "./utils.js";
import { OpenAPIV3 } from "express-openapi-validator/dist/framework/types.js";

interface Metadata {
  originalRef: string;
}

export class ParamsRetriever {
  private basePath: string;
  private metadataMap: Map<string, Metadata> = new Map();

  constructor(
    apiSpec: OpenAPIV3.Document,
    private paramsConverter: ParamsConverter
  ) {
    if (apiSpec.servers && apiSpec.servers.length > 0) {
      this.basePath = new URL(apiSpec.servers[0].url).pathname;
    } else {
      this.basePath = "";
    }

    for (const path in apiSpec.paths) {
      for (const httpMethod of HTTP_METHODS) {
        const operation = apiSpec.paths[path][httpMethod];
        if (operation?.requestBody && "content" in operation.requestBody) {
          for (const contentType in operation.requestBody.content) {
            const content = operation.requestBody.content[contentType];
            if (content.schema && "$ref" in content.schema) {
              const key = pathKey(path, httpMethod, contentType as ContentType);
              this.metadataMap.set(key, { originalRef: content.schema.$ref });
            }
          }
        }
      }
    }
  }

  retrieve(req: OpenApiRequest): Record<string, unknown> {
    const params: Record<string, unknown> = {};
    const httpMethod = httpMethodFrom(req);

    const requestBodySchema = req.openapi.schema.requestBody;
    if (requestBodySchema) {
      if ("$ref" in requestBodySchema) {
        throw new Error(
          "$ref in request body is not supported. please make sure that $refParser is set to 'dereference' in express-openapi-validator"
        );
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
        throw new Error(
          "$ref in request body is not supported. please make sure that $refParser is set to 'dereference' in express-openapi-validator"
        );
      }

      const key = pathKey(
        req.openapi.openApiRoute.slice(this.basePath.length),
        httpMethod,
        contentType
      );
      const metadata = this.metadataMap.get(key);
      if (metadata) {
        content.originalRef = metadata.originalRef;
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

      const wrappedValues = this.paramsConverter.wrapRequestBody(
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
          throw new Error(
            "$ref in parameter is not supported. please make sure that $refParser is set to 'dereference' in express-openapi-validator"
          );
        }

        const key = this.paramsConverter.convParamKey(param.name);

        switch (param.in) {
          case "path":
            params[key] = req.openapi.pathParams[param.name];
            break;
          case "query":
            params[key] = req.query[param.name];
            break;
          case "header":
            params[key] = req.headers[param.name.toLowerCase()];
            break;
          case "cookie":
            params[key] = req.cookies[param.name];
            break;
        }
      }
    }

    return params;
  }
}
