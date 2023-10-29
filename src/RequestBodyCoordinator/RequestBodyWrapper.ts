import { OpenApiRequestMetadata } from "express-openapi-validator/dist/framework/types";

export type RequestBodyNamer = (openapi: OpenApiRequestMetadata) => string;

export interface RequestBodyWrapper {
  wrap(
    value: unknown,
    openapi: OpenApiRequestMetadata
  ): Record<string, unknown>;
}

export class SpreadingRequestBodyWrapper implements RequestBodyWrapper {
  wrap(value: unknown): Record<string, unknown> {
    if (typeof value !== "object") {
      throw new Error("req.body cannot be spread");
    }
    return value as Record<string, unknown>;
  }
}

export class BundleRequestBodyWrapper implements RequestBodyWrapper {
  constructor(private requestBodyNamer: RequestBodyNamer) {}

  wrap(
    value: unknown,
    openapi: OpenApiRequestMetadata
  ): Record<string, unknown> {
    const key = this.requestBodyNamer(openapi);
    return { [key]: value };
  }
}
