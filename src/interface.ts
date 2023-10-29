import type { Request, Response } from "express";

export type Interface<Input, Output> = [Input, Output];

export type Controller = (
  request: Request,
  response: Response
) => Promise<void>;

export interface HandlerSuccessResponse<T> {
  type: "success";
  payload: T;
  httpCode: number;
}
export interface HandlerErrorResponse<E> {
  type: "error";
  error: E;
  httpCode: number;
}
export type HandlerResponseType<T = unknown, E = unknown> =
  | HandlerSuccessResponse<T>
  | HandlerErrorResponse<E>;

export class HandlerResponse {
  static resolve<T>(payload: T, httpCode = 200): HandlerSuccessResponse<T> {
    return { type: "success", payload, httpCode };
  }

  static reject<E>(error: E, httpCode = 500): HandlerErrorResponse<E> {
    return { type: "error", error, httpCode };
  }
}

export type Handler<I extends Interface<unknown, unknown>, E> = (
  args: I[0]
) => Promise<HandlerSuccessResponse<I[1]> | HandlerErrorResponse<E>>;

export type Handlers<I, E> = {
  [K in keyof I]: (
    args: I[K] extends Interface<infer O, unknown> ? O : never
  ) => Promise<
    | HandlerSuccessResponse<
        I[K] extends Interface<unknown, infer O> ? O : never
      >
    | HandlerErrorResponse<E>
  >;
};
