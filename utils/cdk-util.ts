import { Construct } from "constructs/lib/construct"
import { ProjectEnvironment } from './project-environment';
import { NamingUtil } from "./naming-util";
import { LookupUtil } from "./lookup-util";
import { DebugOutUtil } from "./debug-out-util";


export class CdkUtil {
  // Composition objects.
  e: ProjectEnvironment;
  naming: NamingUtil;
  lookup: LookupUtil;
  debugOut: DebugOutUtil;

  constructor() {
    this.e = new ProjectEnvironment();
    this.naming = new NamingUtil(this.e);
    this.lookup = new LookupUtil(this.e);
    this.debugOut = new DebugOutUtil(this.e);
  }

  // Make this class Singleton.
  private static instance: CdkUtil;
  public static getInstance(): CdkUtil {
    if (!CdkUtil.instance) {
      CdkUtil.instance = new CdkUtil();
    }
    return CdkUtil.instance;
  }

  // Retrieve a series of object from "cdk.json" for each specific environment.
  public getContext(scope: Construct, contextName: string = "") {
    let context;
    if (contextName == "") {
      context = scope.node.tryGetContext(this.e.envName);
    } else {
      context = scope.node.tryGetContext(this.e.envName)[contextName];
    }

    if (!context) {
      throw new Error(
        '"cdk.json" file or specified "contextName" parameter have gone wrong something.'
      );
    }
    return context;
  }
}

