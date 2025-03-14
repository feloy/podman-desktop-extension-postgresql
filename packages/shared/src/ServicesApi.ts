import type { Service } from './models/Service';

export interface Script {
  name: string;
  content: string;
}

export interface CreateServiceOptions {
  imageWithTag: string;
  localPort: number;
  dbname?: string;
  user?: string;
  password: string;
  scripts: Script[];
  pgadmin: boolean;
  pgadminLocalPort?: number;
}

export abstract class ServicesApi {
  abstract getServices(): Promise<Service[]>;
  abstract getServiceDetails(containerId: string): Promise<Service>;
  abstract getConnectionStrings(
    containerId: string,
  ): Promise<{ uri: { obfuscated: string; clear: string }; kv: { obfuscated: string; clear: string } }>;
  abstract getServiceImages(): Promise<Map<string, string>>;
  abstract getFreePort(port: number): Promise<number>;
  abstract createService(serviceName: string, options: CreateServiceOptions): Promise<string>;
}
