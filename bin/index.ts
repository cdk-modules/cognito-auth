import { Auth } from '../lib';
import { CfnOutput as Output, Stack, App, StackProps, Aws, CfnParameter as Parameter } from '@aws-cdk/cdk';

export class AuthStack extends Stack {

  /** @returns the Auth construct instance */
  public readonly auth: Auth;

  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    const parameters = this.generateParameters()

    this.auth = new Auth(this, 'AuthConstruct', {
      userPoolName: parameters.userPool.value.toString(),
      minPasswordLength: parameters.minPasswordLength.value,
      requireLowercase: true,
      requireNumbers: true,
      requireSymbols: true,
      requireUppercase: true      
    });

    this.generateOutputs()
  }

  generateParameters () {
    let userPool = new Parameter(this, 'UserPoolName', {
      description: 'Name of your pools. This will apply to both your User Pool and Identity Pool\'s names',
      default: 'MyUsers',
      type: "String",
      allowedPattern: "[a-zA-Z0-9]+",
      constraintDescription: 'The user pool name can only include characters and digits'
    });

    let minPasswordLength = new Parameter(this, 'MinPasswordLength', {
      description: 'Minimum password length to enforce your users to set.',
      default: 8,
      type: "Number",
      minValue: 6,
      maxValue: 64,
      constraintDescription: 'Value must be higher than 6 and lower than 64'
    });

    return {
      userPool, 
      minPasswordLength
    }
  }

  generateOutputs () {
    const disableExport = true;

    // Core
    new Output(this, 'AwsAccountId', { value: Aws.accountId, disableExport });
    new Output(this, 'AwsRegion', { value: Aws.region, disableExport });

    new Output(this, 'UserPoolId', { value: this.auth.userPool.userPoolId, disableExport });
    new Output(this, 'UserPoolClientId', { value: this.auth.userPoolClient.userPoolClientId, disableExport });
    new Output(this, 'IdentityPoolId', { value: this.auth.identityPool.identityPoolId, disableExport });
  }
}
