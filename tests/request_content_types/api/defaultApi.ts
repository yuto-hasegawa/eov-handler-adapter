// @ts-nocheck

/**
 * Openapi Generated TypeScript Api Interfaces
 */
 
import { ApplicationJsonRequest } from '../model/applicationJsonRequest.js';
import { MultipartFormDataRequestAuthority } from '../model/multipartFormDataRequestAuthority.js';
import { XWwwFormUrlencodedRequestLinksInner } from '../model/xWwwFormUrlencodedRequestLinksInner.js';

export interface DefaultApi { 
  applicationJson: [{ applicationJsonRequest: ApplicationJsonRequest,  }, void ], 
  mixed: [{ name?: string,  }, void ], 
  multipartFormData: [{ name?: string, authority?: MultipartFormDataRequestAuthority, photo?: RequestFile, attachments?: Array<RequestFile>,  }, void ], 
  octetStream: [{ body: RequestFile,  }, void ], 
  textPlain: [{ body: string,  }, void ], 
  xWwwFormUrlencoded: [{ type?: string, links?: Array<XWwwFormUrlencodedRequestLinksInner>,  }, void ], 
}

