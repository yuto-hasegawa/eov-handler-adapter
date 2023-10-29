import { ContentType } from "../types";
import { RequestBodyWrapper } from "./RequestBodyWrapper";
import { OpenApiRequestMetadata } from "express-openapi-validator/dist/framework/types";

export class RequestBodyCoordinator {
  private map: Map<ContentType, RequestBodyWrapper>;

  constructor(initial: Map<ContentType, RequestBodyWrapper> = new Map()) {
    this.map = new Map(initial);
  }

  set(contentType: ContentType, wrapper: RequestBodyWrapper) {
    this.map.set(contentType, wrapper);
    return new RequestBodyCoordinator(this.map);
  }

  wrap(
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
