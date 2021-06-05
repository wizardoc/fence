import "reflect-metadata";
import { AxiosError } from "axios";
import { ErrorInteractProcessor } from "../error";
import { Constructable } from "../../typings/construct";
import { HTTPService } from "../../factory";

export type OperatorCallback = (value: unknown, ...args: unknown[]) => unknown;

// The operator function allows u to defined ur own operator on result of request
// and u can pass some args that exist in http-client context as parameters
export type PipeFunction<T> = (...args: unknown[]) => T;

export type BeginPipeFunction<T> = Omit<PipeFunction<T>, "operatorCallback">;

export const PIPE_OPERATOR_METADATA_KEY = Symbol("PIPE_OPERATOR_METADATA_KEY");
export const TERMINAL_OPERATOR_METADATA_KEY = Symbol(
  "TERMINAL_OPERATOR_METADATA_KEY"
);
export const BEGIN_OPERATOR_METADATA_KEY = Symbol(
  "BEGIN_OPERATOR_METADATA_KEY"
);

export interface PipeOperatorContext<T = unknown> {
  value: T;
  err?: AxiosError;
}

export interface TerminalOperatorContext extends PipeOperatorContext {
  catcher: ErrorInteractProcessor;
}

export interface BeginOperatorContext extends PipeOperatorContext {
  httpService: HTTPService;
}

export interface Operator<C, R = unknown> {
  exec(context: C, ...args: unknown[]): R;
}

export enum OperatorType {
  TERMINAL_OPERATOR,
  PIPE_OPERATOR,
  BEGIN_OPERATOR,
}

export enum OperatorRunEnv {
  ERROR_OCCUR,
  NO_ERROR,
}

export interface OperatorMetadata<C> {
  configure: C;
  type: OperatorType;
}

export type RawOperator =
  | Constructable<TerminalOperatorExec>
  | Constructable<PipeOperatorExec>
  | Constructable<BeginOperatorExec>;

export type PipeOperatorExec = Operator<PipeOperatorContext>;

export type TerminalOperatorExec = Operator<TerminalOperatorContext>;

export type BeginOperatorExec = Operator<BeginOperatorContext>;

export interface OperatorConfigure {
  name: string;
}

export interface TerminalOperatorConfigure extends OperatorConfigure {}
export interface PipeOperatorConfigure extends OperatorConfigure {
  env?: OperatorRunEnv;
}

export interface BeginOperatorConfigure extends PipeOperatorConfigure {}

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

export const getBeginOperatorMetadata = (
  target: any
): OperatorMetadata<BeginOperatorConfigure> =>
  getOperatorMetadata(target, BEGIN_OPERATOR_METADATA_KEY);

const parseConfigure = (
  configure: PipeOperatorConfigure
): PipeOperatorConfigure => ({
  env: OperatorRunEnv.NO_ERROR,
  ...configure,
});

export const PipeOperator =
  (configure: PipeOperatorConfigure) => (target: any) => {
    Reflect.defineMetadata(
      PIPE_OPERATOR_METADATA_KEY,
      {
        configure: parseConfigure(configure),
        type: OperatorType.PIPE_OPERATOR,
      },
      target
    );
  };

export const TerminalOperator =
  (configure: TerminalOperatorConfigure) => (target: any) => {
    Reflect.defineMetadata(
      TERMINAL_OPERATOR_METADATA_KEY,
      {
        configure,
        type: OperatorType.TERMINAL_OPERATOR,
      },
      target
    );
  };

export const BeginOperator =
  (configure: BeginOperatorConfigure) => (target: any) => {
    Reflect.defineMetadata(
      BEGIN_OPERATOR_METADATA_KEY,
      {
        configure,
        type: OperatorType.BEGIN_OPERATOR,
      },
      target
    );
  };
