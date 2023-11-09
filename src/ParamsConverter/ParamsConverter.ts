import { ContentType } from "../types.js";
import { RequestBodyWrapper } from "./RequestBodyWrapper.js";
import { OpenApiRequestMetadata } from "express-openapi-validator/dist/framework/types.js";

export type ConvParamKey = (name: string) => string;

export class ParamsConverter {
  private map: Map<ContentType, RequestBodyWrapper>;

  constructor(
    private _convParamKey: ConvParamKey,
    requestBodyWrappers: {
      [key in ContentType]?: RequestBodyWrapper;
    }
  ) {
    this.map = new Map<ContentType, RequestBodyWrapper>(
      Object.entries(requestBodyWrappers) as [ContentType, RequestBodyWrapper][]
    );
  }

  convParamKey(name: string) {
    return this._convParamKey(name);
  }

  wrapRequestBody(
    contentType: ContentType,
    value: unknown,
    openapi: OpenApiRequestMetadata
  ) {
    const paramWrapper = this.map.get(contentType);
    if (!paramWrapper) {
      throw new Error(`no wrapper for ${contentType}`);
    }
    return paramWrapper.wrap(value, openapi);
  }
}
