import { Request } from "express";
import { OpenApiRequestMetadata } from "express-openapi-validator/dist/framework/types.js";

export type OpenApiRequest = Request & { openapi: OpenApiRequestMetadata };

export const CONTENT_TYPES = [
  "multipart/form-data",
  "text/plain",
  "application/json",
  "application/octet-stream",
  "application/x-www-form-urlencoded",
] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const HTTP_METHODS = [
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];
