import { OperatorRunEnv, OperatorType } from "../../core";
import { OperatorExecData } from "./operator-exec-data";

export type WaitForExecOperator<E = () => void> = {
  exec: E;
  env?: OperatorRunEnv;
  type: OperatorType;
};

export type PreWaitForExecOperator = WaitForExecOperator<
  (request: () => Promise<any>) => () => void
>;

interface WaitForExecContainer {
  request?: () => Promise<any>;
  operators: WaitForExecOperator[];
}

const BEGIN_OPERATOR_NOT_FOUND_ERROR_MESSAGE =
  "Please make sure the begin operator has been invoked before.";
const DUPLICATE_TERMINAL_OPERATOR_ERROR_MESSAGE =
  "Only one terminal operator is allowed for a request flow.";
const UNKNOWN_OPERATOR_ERROR_MESSAGE = "Unknown operator.";

export class ExecStack {
  private tasks: WaitForExecContainer[] = [];

  private container: WaitForExecContainer = { operators: [] };

  private terminalOperator?: PreWaitForExecOperator;

  constructor(private operatorExecData: OperatorExecData) {}

  addOperatorToContainer(
    operator: PreWaitForExecOperator | WaitForExecOperator
  ) {
    const { env, exec, type } = operator;

    // Check the begin operator whether is exist or not
    if (type !== OperatorType.BEGIN_OPERATOR && !this.container.request) {
      throw new Error(BEGIN_OPERATOR_NOT_FOUND_ERROR_MESSAGE);
    }

    // Make the operators as a task when get an terminal operator
    if (type === OperatorType.TERMINAL_OPERATOR) {
      // Duplicate terminal operator
      if (!!this.terminalOperator) {
        throw new Error(DUPLICATE_TERMINAL_OPERATOR_ERROR_MESSAGE);
      }

      this.terminalOperator = operator as PreWaitForExecOperator;
      this.makeContainerAsTask();
      return;
    }

    if (type === OperatorType.BEGIN_OPERATOR) {
      // If the begin operator is not a first operator of this container, the means that
      // the request flow contain multiple begin operator
      if (!!this.container.request) {
        this.makeContainerAsTask();
      }

      // New request flow
      this.container.request = operator.exec as () => Promise<unknown>;
      return;
    }

    if (type === OperatorType.PIPE_OPERATOR) {
      this.container.operators.push(operator as WaitForExecOperator);

      return;
    }

    throw new Error(UNKNOWN_OPERATOR_ERROR_MESSAGE);
  }

  // Clear operators and move it to tasks
  private makeContainerAsTask() {
    // The request flow has not been initialized
    if (!this.container.request) {
      return;
    }

    this.tasks.push({ ...this.container });
    this.container = { operators: [] };
  }

  private async execOperators(operators: WaitForExecOperator[]) {
    for (const { env, exec } of operators) {
      if (
        !this.operatorExecData.err ||
        (!!this.operatorExecData.err && env === OperatorRunEnv.ERROR_OCCUR)
      ) {
        await exec();
      }
    }
  }

  // Execute all tasks
  async exec() {
    for (const { operators, request } of this.tasks) {
      // If an error occurred on the previous task, the request flow is terminated
      if (this.operatorExecData.err) {
        break;
      }

      await this.terminalOperator.exec(request)();
      await this.execOperators(operators);
    }
  }
}
