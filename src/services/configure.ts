export interface ServerConfigInfo {
  baseUrl: string;
  protocol: string;
  port?: number;
  prefix?: string;
}

export class ServerConfig {
  constructor(private config: ServerConfigInfo) {}

  getBaseURL(): string {
    const { baseUrl, port, prefix = "" } = this.config!;
    const parsedPort = port ? `:${port}` : "";

    return `${baseUrl}${parsedPort}${prefix}/`;
  }

  getAbsPath(): string {
    return `${this.config!.protocol}://${this.getBaseURL()}`;
  }
}
