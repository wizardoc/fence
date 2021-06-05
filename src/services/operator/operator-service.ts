import { AxiosError } from "axios";
import {
  ErrorInteractProcessor,
  getBeginOperatorMetadata,
  getPipeOperatorMetadata,
  getTerminalOperatorMetadata,
  Operator,
  PipeFunction,
  PipeOperatorConfigure,
  PipeOperatorExec,
  RawOperator,
  TerminalOperatorExec,
} from "../../core";
import {
  Pipe,
  Expect,
  Unwrap,
  Match,
  Get,
  Post,
  Put,
  Delete,
} from "../../core/operation/operators";
import { HTTPService } from "../../factory";
import { OperatorSet, ParsedOperator } from "./operator-set";

export interface OperatorResponse {
  pipe: (cb: (value: unknown) => unknown) => OperatorResponse;
  expect: (cb: (value: unknown) => string) => Promise<unknown>;
  unwrap: () => Promise<unknown>;
  match: (
    successfulCallback: (data: unknown) => unknown,
    errorCallback: (err: AxiosError) => unknown
  ) => Promise<unknown>;
  [operatorName: string]: PipeFunction<any>;
}

const BUILD_IN_OPERATORS: RawOperator[] = [
  Pipe,
  Expect,
  Unwrap,
  Match,
  Get,
  Post,
  Put,
  Delete,
];

const NOT_A_OPERATOR_ERROR_MESSAGE =
  "Receive a invalid operator, please make sure u has been decorated by @PipeOperator or @TerminalOperator.";

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
            getPipeOperatorMetadata(operator) ??
            getBeginOperatorMetadata(operator);

          if (!configure) {
            throw new Error(NOT_A_OPERATOR_ERROR_MESSAGE);
          }

          return {
            name: configure.name,
            type,
            env: (configure as PipeOperatorConfigure).env,
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
  parseOperators(
    catcher: ErrorInteractProcessor,
    httpService: HTTPService
  ): OperatorSet {
    return new OperatorSet(this.operators, catcher, httpService);
  }
}
