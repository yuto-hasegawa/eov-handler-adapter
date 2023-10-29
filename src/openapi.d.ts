import "express-openapi-validator/dist/framework/types";

declare module "express-openapi-validator/dist/framework/types" {
  namespace OpenAPIV3 {
    interface MediaTypeObject {
      originalRef?: string;
    }
  }
}
