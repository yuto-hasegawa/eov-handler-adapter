// @ts-nocheck

/**
 * Openapi Generated TypeScript Api Interfaces
 */

interface RequestApi { 
  applicationJson: (args: { applicationJsonRequest: ApplicationJsonRequest,  }) => void, 
  applicationJsonWithComponentsRef: (args: { schemaComponent: SchemaComponent,  }) => void, 
  applicationJsonWithFileRef: (args: { fileObject?: FileObject,  }) => void, 
  dates: (args: { createdAt?: Date, holiday?: string,  }) => void, 
  mixed: (args: { name?: string,  }) => void, 
  multipartFormData: (args: { name?: string, authority?: MultipartFormDataRequestAuthority, photo?: RequestFile, attachments?: Array<RequestFile>,  }) => void, 
  octetStream: (args: { body: RequestFile,  }) => void, 
  parameters: (args: { id: string, limit?: number, q?: string, xRequestID?: string, sessionId?: string,  }) => void, 
  textPlain: (args: { body: string,  }) => void, 
  xWwwFormUrlencoded: (args: { type?: string, links?: Array<XWwwFormUrlencodedRequestLinksInner>,  }) => void, 
}

