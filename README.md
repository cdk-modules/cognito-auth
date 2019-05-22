# Human authentication using Cognito

This module provides authentication and authorisation mechanisms for human stakeholders that use the system. It uses Amazon Cognito to enable you to store your own user base within your deployment, and allows you to define RBAC policies for individual users and/or groups. 

## Module components

This module comprehends all resources needed for an authentication system, including default configuration for being instantly ready to use. These are the resources this module includes:

* **Cognito User Pool:** Stores your users and groups and provides a built-in customizable login experience for web and mobile apps. This user pool is built with a `default` app client, that you can use to leverage authentication capabilities right out of the box. You can add multiple other clients for the different consumers of the module.
* **Cognito Identity Pool:** Enables federated access to AWS resources for users within the User Pool. Configured already for the default User Pool client, this Identity Pool provides AWS credentials for users of the User Pool.
* **Identity Pool default roles:** The IdP is configured with two IAM roles, used by default for both `authenticated` and `unauthenticated` users. 

## Default configuration

The setup configuration by default allows users to login with both a unique username and an email address, and email addresses are required, and autommatically verified - i.e. no code verification is needed. Minimum password length is `8`, and it requires both lower and upper case characters, numbers and symbols. 

## Getting started

### Running in one click

I'm working on preparing automated builds of the modules that could be installed in one click. Stay tuned!

### Installing from code

Install the dependency: `npm i @cdk-modules/cognito-auth` or clone this repository. If you just want to install this module standalone, then just run `npm run build:standalone`. If you want to import it into your existing CDK project, continue reading.

### Integrating it into your app

If you already have a larger CDK app going - or plan to have it - you can use this module to provide your app with the authecation mechanism you'd need. Just install the deependency into your project, and follow this example:

```typescript
import { Auth } from '@cdk-modules/cognito-auth'

...
const auth = new Auth(this, 'MyAuth', {
  userPoolName: 'MyUsers',
  minPasswordLength: 8,
  requireLowercase: true,
  requireUppercase: true,
  requireNumbers: true,
  requireSymbols: true
})
...
```

Once you have integrated the auth module into your project, you could edit any of its entities - i.e. User Pool and Identity Pool, or the associated default roles - and associate them with any other resource allowed by the CDK or CloudFormation.
