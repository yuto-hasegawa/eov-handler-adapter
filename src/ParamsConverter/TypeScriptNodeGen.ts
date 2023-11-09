import camelcase from "camelcase";
import {
  ConvParamKey,
  ParamsConverter as ParamsConverter,
} from "./ParamsConverter.js";
import {
  BundleRequestBodyWrapper,
  SpreadingRequestBodyWrapper,
} from "./RequestBodyWrapper.js";

// requires eovSupplement middleware to use $ref based parameter name
export const typeScriptNodeGenCoordinator = (
  options: { paramNaming: "camelCase" | "original" } = {
    paramNaming: "camelCase",
  }
) => {
  const convParamKey: ConvParamKey =
    options.paramNaming === "camelCase"
      ? (key) => camelcase(key, { preserveConsecutiveUppercase: true })
      : (key) => key.replaceAll("-", "_");

  return new ParamsConverter(convParamKey, {
    "multipart/form-data": new SpreadingRequestBodyWrapper(),
    "text/plain": new BundleRequestBodyWrapper(() => "body"),
    "application/json": new BundleRequestBodyWrapper((openapi) => {
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
        return camelcase(body, {
          pascalCase: options.paramNaming === "original",
        });
      }

      if (openapi.schema.operationId) {
        return camelcase(openapi.schema.operationId + "Request", {
          pascalCase: options.paramNaming === "original",
        });
      }

      return "body";
    }),
    "application/octet-stream": new BundleRequestBodyWrapper(() => "body"),
    "application/x-www-form-urlencoded": new SpreadingRequestBodyWrapper(),
  });
};
