import "reflect-metadata";
import { AxiosError } from "axios";
import { ErrorInteractProcessor } from "../error";
import { Constructable } from "../../typings/construct";

export type OperatorCallback = (value: unknown, ...args: unknown[]) => unknown;

// The operator function allows u to defined ur own operator on result of request
// and u can pass some args that exist in http-client context as parameters
export type PipeFunction<T> = (
  operatorCallback: OperatorCallback,
  ...args: unknown[]
) => T;

export const PIPE_OPERATOR_METADATA_KEY = Symbol("PIPE_OPERATOR_METADATA_KEY");
export const TERMINAL_OPERATOR_METADATA_KEY = Symbol(
  "TERMINAL_OPERATOR_METADATA_KEY"
);

export interface PipeOperatorContext {
  value: unknown;
  err?: AxiosError;
}

export interface TerminalOperatorContext extends PipeOperatorContext {
  catcher: ErrorInteractProcessor;
}

export interface Operator<C, R = unknown> {
  exec(context: C, cb: OperatorCallback, ...args: unknown[]): R;
}

export enum OperatorType {
  TERMINAL_OPERATOR,
  PIPE_OPERATOR,
}

export interface OperatorMetadata<C> {
  configure: C;
  type: OperatorType;
}

export type RawOperator =
  | Constructable<TerminalOperatorExec>
  | Constructable<PipeOperatorExec>;

export type PipeOperatorExec = Operator<PipeOperatorContext>;
export type TerminalOperatorExec = Operator<TerminalOperatorContext>;

export interface OperatorConfigure {
  name: string;
}

export interface TerminalOperatorConfigure extends OperatorConfigure {}
export interface PipeOperatorConfigure extends OperatorConfigure {}

export const isOperator = <C = any>(target: any): target is Operator<C> =>
  !!target.exec;

export const getOperatorMetadata = (
  target: any,
  key: Symbol
):
  | OperatorMetadata<TerminalOperatorConfigure | PipeOperatorConfigure>
  | undefined => Reflect.getMetadata(key, target);

export const getTerminalOperatorMetadata = (
  target: any
): OperatorMetadata<TerminalOperatorConfigure> =>
  getOperatorMetadata(target, TERMINAL_OPERATOR_METADATA_KEY);

export const getPipeOperatorMetadata = (
  target: any
): OperatorMetadata<PipeOperatorConfigure> =>
  getOperatorMetadata(target, PIPE_OPERATOR_METADATA_KEY);

export const PipeOperator = (configure: OperatorConfigure) => (target: any) => {
  Reflect.defineMetadata(
    PIPE_OPERATOR_METADATA_KEY,
    {
      configure,
      type: OperatorType.PIPE_OPERATOR,
    },
    target
  );
};

export const TerminalOperator =
  (configure: OperatorConfigure) => (target: any) => {
    Reflect.defineMetadata(
      TERMINAL_OPERATOR_METADATA_KEY,
      {
        configure,
        type: OperatorType.TERMINAL_OPERATOR,
      },
      target
    );
  };
