import camelcase from "camelcase";
import { RequestBodyCoordinator } from "./RequestBodyCoordinator";
import {
  BundleRequestBodyWrapper,
  SpreadingRequestBodyWrapper,
} from "./RequestBodyWrapper";

// requires eovSupplement middleware to use $ref based parameter name
export const typeScriptNodeGenCoordinator: RequestBodyCoordinator =
  new RequestBodyCoordinator()
    .set("multipart/form-data", new SpreadingRequestBodyWrapper())
    .set("text/plain", new BundleRequestBodyWrapper(() => "body"))
    .set(
      "application/json",
      new BundleRequestBodyWrapper((openapi) => {
        const requestBodySchema = openapi.schema.requestBody;
        if (!requestBodySchema) {
          throw new Error("requestBody is not defined");
        }
        if ("$ref" in requestBodySchema) {
          throw new Error("$ref is not supposed to be in metadata");
        }

        const originalRef =
          requestBodySchema.content["application/json"].originalRef;
        if (originalRef) {
          const tail = originalRef.slice(originalRef.lastIndexOf("/") + 1);
          const body = tail.replace(/\..*$/, "");
          return camelcase(body);
        }

        if (openapi.schema.operationId) {
          return camelcase(openapi.schema.operationId + "Request");
        }

        return "body";
      })
    )
    .set("application/octet-stream", new BundleRequestBodyWrapper(() => "body"))
    .set(
      "application/x-www-form-urlencoded",
      new SpreadingRequestBodyWrapper()
    );
