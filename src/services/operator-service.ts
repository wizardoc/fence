import { AxiosError } from "axios";
import {
  ErrorInteractProcessor,
  getPipeOperatorMetadata,
  getTerminalOperatorMetadata,
  Operator,
  OperatorType,
  PipeFunction,
  PipeOperatorExec,
  RawOperator,
  TerminalOperatorExec,
} from "../core";
import { Pipe, Expect, Unwrap, Match } from "../core/operation/operators";
import { RequestHook } from "../module";

export interface OperatorResponse {
  pipe: (cb: (value: unknown) => unknown) => OperatorResponse;
  expect: (cb: (value: unknown) => string) => Promise<unknown>;
  unwrap: () => Promise<unknown>;
  match: (
    successfulCallback: (data: unknown) => unknown,
    errorCallback: (err: AxiosError) => unknown
  ) => Promise<unknown>;
  [operatorName: string]: PipeFunction<unknown>;
}

const BUILD_IN_OPERATORS: RawOperator[] = [Pipe, Expect, Unwrap, Match];

const NOT_A_OPERATOR_ERROR_MESSAGE =
  "Receive a invalid operator, please make sure u has been decorated by @PipeOperator or @TerminalOperator.";
const CANNOT_MATCH_OPERATOR_TYPE = "Cannot match the type of the operator";

export type ParsedOperator<T> = {
  name: string;
  type: OperatorType;
  operator: T;
};

export type WaitForExecOperator<C> = {
  name: string;
  exec: () => ReturnType<Operator<C>["exec"]>;
};

export class OperatorService {
  private operators: ParsedOperator<TerminalOperatorExec | PipeOperatorExec>[] =
    [];

  constructor(operators: RawOperator[]) {
    this.operators = operators
      .concat(BUILD_IN_OPERATORS)
      .map<ParsedOperator<TerminalOperatorExec | PipeOperatorExec>>(
        (operator) => {
          const { configure, type } =
            getTerminalOperatorMetadata(operator) ??
            getPipeOperatorMetadata(operator);

          if (!configure) {
            throw new Error(NOT_A_OPERATOR_ERROR_MESSAGE);
          }

          return {
            name: configure.name,
            type,
            operator: new operator(),
          };
        }
      );
  }

  get terminalOperators(): ParsedOperator<TerminalOperatorExec>[] {
    return this.operators.filter(
      (operator) => !!getTerminalOperatorMetadata(operator)
    );
  }

  get pipeOperators(): ParsedOperator<TerminalOperatorExec>[] {
    return this.operators.filter(
      (operator) => !!getPipeOperatorMetadata(operator)
    );
  }

  // Parse these operators to the operators that can be executed directly
  parseOperators<R>(
    catcher: ErrorInteractProcessor,
    request: () => R
  ): OperatorSet {
    return new OperatorSet(this.operators, catcher, request as any);
  }
}

export class OperatorSet {
  private data?: unknown;
  private err?: AxiosError;

  constructor(
    operators: ParsedOperator<TerminalOperatorExec | PipeOperatorExec>[],
    catcher: ErrorInteractProcessor,
    request: () => Promise<unknown>
  ) {
    for (const { operator, type, name } of operators) {
      // Match the type of operator and return corresponding function
      switch (type) {
        case OperatorType.TERMINAL_OPERATOR:
          this[name] = this.processTerminalOperator(operator, catcher, request);
          break;
        case OperatorType.PIPE_OPERATOR:
          this[name] = this.processPipeOperator(operator);
          break;
        default:
          throw new Error(CANNOT_MATCH_OPERATOR_TYPE);
      }
    }
  }

  private processTerminalOperator<T>(
    operator: TerminalOperatorExec,
    catcher: ErrorInteractProcessor,
    request: () => Promise<T>
  ): PipeFunction<unknown> {
    return async (cb, ...args) => {
      // Only a terminal operator can exist in a request
      try {
        this.data = await request();
      } catch (e) {
        this.err = e;
      }

      // The exec can throw an error to this context
      const data = await operator.exec(
        { value: this.data, err: this.err, catcher },
        cb,
        ...args
      );

      // The terminal operator can return a value as a initial value of the data
      if (!!data) {
        this.data = data;
      }

      return this.data as T;
    };
  }

  private processPipeOperator(
    operator: PipeOperatorExec
  ): PipeFunction<OperatorSet> {
    return (cb, ...args) => {
      this.data = operator.exec(
        { value: this.data, err: this.err },
        cb,
        ...args
      );

      // The pipe operator can called like cascade
      return this;
    };
  }
}
