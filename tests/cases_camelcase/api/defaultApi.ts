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
  cases: [{ camelPath: string, pascalPath: string, snakePath: string, camelQuery: string, pascalQuery: string, snakeQuery: string, kebabQuery: string, xCamelHeader: string, xPascalHeader: string, xSnakeHeader: string, xKebabHeader: string, camelCookie: string, pascalCookie: string, snakeCookie: string, kebabCookie: string, casesRequest: CasesRequest,  }, void ], 
  casesComponentCamelCase: [{ camelComponent: CamelComponent,  }, void ], 
  casesComponentPascalCase: [{ pascalComponent: PascalComponent,  }, void ], 
  casesComponentSnakeCase: [{ snakeComponent: SnakeComponent,  }, void ], 
  casesFileCamelCase: [{ camelExternal: CamelExternal,  }, void ], 
  casesFilePascalCase: [{ pascalExternal: PascalExternal,  }, void ], 
  casesFileSnakeCase: [{ snakeExternal: SnakeExternal,  }, void ], 
}

