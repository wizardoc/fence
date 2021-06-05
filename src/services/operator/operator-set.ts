import Axios, { AxiosError } from "axios";
import {
  BeginOperatorExec,
  BeginPipeFunction,
  ErrorInteractProcessor,
  OperatorCallback,
  OperatorRunEnv,
  OperatorType,
  PipeFunction,
  PipeOperatorExec,
  TerminalOperatorExec,
} from "../../core";
import { HTTPService } from "../../factory";
import { ExecStack } from "./exec-stack";
import { OperatorExecData } from "./operator-exec-data";

const CANNOT_MATCH_OPERATOR_TYPE = "Cannot match the type of the operator";

export type ParsedOperator<T> = {
  name: string;
  type: OperatorType;
  env: OperatorRunEnv | undefined;
  operator: T;
};

export class OperatorSet {
  private operatorExecData = new OperatorExecData();
  private execStack = new ExecStack(this.operatorExecData);

  constructor(
    operators: ParsedOperator<
      TerminalOperatorExec | PipeOperatorExec | BeginOperatorExec
    >[],
    catcher: ErrorInteractProcessor,
    httpService: HTTPService
  ) {
    for (const { operator, type, name, env } of operators) {
      // Match the type of operator and return corresponding function
      switch (type) {
        case OperatorType.TERMINAL_OPERATOR:
          this[name] = this.processTerminalOperator(
            operator as TerminalOperatorExec,
            catcher
          );
          break;
        case OperatorType.PIPE_OPERATOR:
          this[name] = this.processPipeOperator(
            operator as PipeOperatorExec,
            env
          );
          break;
        case OperatorType.BEGIN_OPERATOR:
          this[name] = this.processBeginOperator(
            operator as BeginOperatorExec,
            env,
            httpService
          );
          break;
        default:
          throw new Error(CANNOT_MATCH_OPERATOR_TYPE);
      }
    }
  }

  private processTerminalOperator<T>(
    operator: TerminalOperatorExec,
    catcher: ErrorInteractProcessor
  ): PipeFunction<unknown> {
    return async (cb, ...args) => {
      this.execStack.addOperatorToContainer({
        type: OperatorType.TERMINAL_OPERATOR,
        exec: (request: () => Promise<T>) => async () => {
          // Only a terminal operator can exist in a request
          try {
            this.operatorExecData.data = await request();
          } catch (e) {
            this.operatorExecData.err = e;
          }

          // The exec can throw an error to this context
          const data = await operator.exec(
            {
              value: this.operatorExecData.data,
              err: this.operatorExecData.err,
              catcher,
            },
            cb,
            ...args
          );

          // The terminal operator can return a value as a initial value of the data
          if (data !== undefined) {
            this.operatorExecData.data = data;
          }

          return this.operatorExecData.data as T;
        },
      });

      await this.execStack.exec();

      return this.operatorExecData.data;
    };
  }

  private processBeginOperator(
    operator: BeginOperatorExec,
    env: OperatorRunEnv,
    httpService: HTTPService
  ): BeginPipeFunction<unknown> {
    return (...args: any[]) => {
      this.execStack.addOperatorToContainer({
        env,
        type: OperatorType.BEGIN_OPERATOR,
        exec: () =>
          operator.exec(
            {
              value: this.operatorExecData.data,
              err: this.operatorExecData.err,
              httpService,
            },
            ...args
          ),
      });

      return this;
    };
  }

  private processPipeOperator(
    operator: PipeOperatorExec,
    env: OperatorRunEnv
  ): PipeFunction<OperatorSet> {
    return (cb, ...args) => {
      // These operators will invoke later
      this.execStack.addOperatorToContainer({
        env,
        type: OperatorType.PIPE_OPERATOR,
        exec: () => {
          const data = operator.exec(
            {
              value: this.operatorExecData.data,
              err: this.operatorExecData.err,
            },
            cb,
            ...args
          );

          if (data !== undefined) {
            this.operatorExecData.data = data;
          }
        },
      });

      // The pipe operator can called like cascade
      return this;
    };
  }
}
