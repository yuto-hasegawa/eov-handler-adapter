// @ts-nocheck

/**
 * Openapi Generated TypeScript Api Interfaces
 */
 
import { CamelComponent } from '../model/camelComponent.js';
import { CamelExternal } from '../model/camelExternal.js';
import { CasesRequest } from '../model/casesRequest.js';
import { PascalComponent } from '../model/pascalComponent.js';
import { PascalExternal } from '../model/pascalExternal.js';
import { SnakeComponent } from '../model/snakeComponent.js';
import { SnakeExternal } from '../model/snakeExternal.js';

export interface DefaultApi { 
  cases: [{ camelPath: string, PascalPath: string, snake_path: string, camelQuery: string, PascalQuery: string, snake_query: string, kebab_query: string, xCamelHeader: string, XPascalHeader: string, x_snake_header: string, x_kebab_header: string, camelCookie: string, PascalCookie: string, snake_cookie: string, kebab_cookie: string, CasesRequest: CasesRequest,  }, void ], 
  casesComponentCamelCase: [{ CamelComponent: CamelComponent,  }, void ], 
  casesComponentPascalCase: [{ PascalComponent: PascalComponent,  }, void ], 
  casesComponentSnakeCase: [{ SnakeComponent: SnakeComponent,  }, void ], 
  casesFileCamelCase: [{ CamelExternal: CamelExternal,  }, void ], 
  casesFilePascalCase: [{ PascalExternal: PascalExternal,  }, void ], 
  casesFileSnakeCase: [{ SnakeExternal: SnakeExternal,  }, void ], 
}

