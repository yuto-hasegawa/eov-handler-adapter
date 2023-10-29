import { OpenAPIV3 } from "express-openapi-validator/dist/framework/types";
import {
  CONTENT_TYPES,
  ContentType,
  HTTP_METHODS,
  HttpMethod,
  OpenApiRequest,
} from "./types";
import * as ct from "content-type";

export const contentTypeFrom = (req: OpenApiRequest): ContentType => {
  const { type: contentType } = ct.parse(req);
  if (!(CONTENT_TYPES as readonly string[]).includes(contentType)) {
    throw new Error(`Unsupported content type: ${contentType}`);
  }
  return contentType as ContentType;
};

export const httpMethodFrom = (req: OpenApiRequest): HttpMethod => {
  const httpMethod = req.method.toLowerCase();
  if (!(HTTP_METHODS as readonly string[]).includes(httpMethod)) {
    throw new Error(`Unknown HTTP method: ${httpMethod}`);
  }
  return httpMethod as HttpMethod;
};

export const pathKey = (
  path: string,
  method: HttpMethod,
  contentType: ContentType
): string => {
  return [
    encodeURIComponent(path),
    encodeURIComponent(method),
    encodeURIComponent(contentType),
  ].join("/");
};

export const scanSchema = (
  props: {
    [name: string]: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject;
  },
  prefix: string[] = [],
  visit: (
    path: string[],
    prop: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject
  ) => void
) => {
  for (const name in props) {
    const prop = props[name];
    if ("type" in prop && prop.type === "object" && prop.properties) {
      scanSchema(prop.properties, prefix.concat(name), visit);
      continue;
    }

    visit(prefix.concat(name), prop);
  }
};
