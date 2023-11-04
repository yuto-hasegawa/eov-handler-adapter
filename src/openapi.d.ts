import "express-openapi-validator/dist/framework/types.js";

declare module "express-openapi-validator/dist/framework/types.js" {
  namespace OpenAPIV3 {
    interface MediaTypeObject {
      originalRef?: string;
    }
  }
}
