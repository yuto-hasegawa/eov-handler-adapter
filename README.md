# eov-handler-adapter

An adapter for [express-openapi-validator](https://github.com/cdimascio/express-openapi-validator) to auto-extract OpenAPI defined parameters, simplifying route handlers to (input) => output.

# Install

```
npm install eov-handler-adapter
```

# Usage

Create a signature for each api.  
This can be generated with openapi-generator. See [/samples/templates/apis.mustache](/samples/templates/apis.mustache)

```typescript
type HelloApi = (args: { name: string; lang: string }) => {
  text: string;
  lang: string;
};
```

Define handlers along the signature.

```typescript
import { Handler, HandlerResponse } from "eov-handler-adapter";

const helloHandler: Handler<HelloApi> = async ({ name, lang }) => {
  return HandlerResponse.resolve({ text: `こんにちは、${name}`, lang }, 200);
};
```

Create routes with `EOVHandlerAdapter`.

```typescript
import {
  EOVHandlerAdapter,
  typeScriptNodeGenCoordinator,
} from "eov-handler-adapter";

// `typeScriptNodeGenCoordinator` matches parameter structure to `typescript-node` generator of openapi-generator
// You can also create custom coordinators.
const adapter = new EOVHandlerAdapter(typeScriptNodeGenCoordinator);

module.exports = {
  hello: EOVHandlerAdapter.createController(helloHandler),
};
```

Put a middleware. This is required by `typeScriptNodeGenCoordinator`

```typescript
import express from "express";
import * as OpenApiValidator from 'express-openapi-validator';
import {eovSupplement} from "eov-handler-adapter"

const app = express();
...
app.use(OpenApiValidator.middleware(...))

// put this if you need $ref based parameter name resolution
// this must be after OpenApiValidator.middleware
app.use(eovSupplement(apiSpec))
```