import { AuthStack } from './';
import { App } from '@aws-cdk/cdk';

const app = new App();
new AuthStack(app, 'CdkModulesAuthStandalone')

app.run();
