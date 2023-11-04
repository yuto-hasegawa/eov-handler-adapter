import type { NextFunction, Request, Response } from "express";

export type Interface<Input, Output> = [Input, Output];

export type Controller = (
  request: Request,
  response: Response,
  next: NextFunction
) => Promise<void>;

export interface HandlerSuccessResponse<R> {
  type: "success";
  payload: R;
  httpCode: number;
}
export interface HandlerErrorResponse<E> {
  type: "error";
  error: E;
  httpCode: number;
}
export type HandlerResponseType<R = unknown, E = unknown> =
  | HandlerSuccessResponse<R>
  | HandlerErrorResponse<E>;

export class HandlerResponse {
  static resolve<R>(payload: R, httpCode = 200): HandlerSuccessResponse<R> {
    return { type: "success", payload, httpCode };
  }

  static reject<E>(error: E, httpCode = 500): HandlerErrorResponse<E> {
    return { type: "error", error, httpCode };
  }
}

export type Handler<I extends Interface<unknown, unknown>, E = unknown> = (
  args: I[0]
) => Promise<HandlerSuccessResponse<I[1]> | HandlerErrorResponse<E>>;

export type Handlers<T, E = unknown> = {
  [K in keyof T]: Handler<
    T[K] extends Interface<infer I, infer O> ? Interface<I, O> : never,
    E
  >;
};
