import { CfnUserPool, CfnUserPoolClient, CfnIdentityPool, CfnIdentityPoolRoleAttachment } from '@aws-cdk/aws-cognito';
import { Role, PolicyStatement, FederatedPrincipal } from '@aws-cdk/aws-iam';
import { Construct, Aws, Token } from '@aws-cdk/cdk';

export interface AuthProps {
  userPoolName: string,

  /** @default 8 */
  minPasswordLength: number | Token,

  /** @default true */
  requireLowercase: boolean,

  /** @default true */
  requireUppercase: boolean,

  /** @default true */
  requireNumbers: boolean,

  /** @default true */
  requireSymbols: boolean
}

/**
 * @description 
 *  This module provides an authentication system using Cognito User Pools and Identity Pools.
 *  It can be launched standalone or integrated into your broader resource definition. 
 *  This file is for CDK integration specifically
 *  Take a look at the README.md file for details
 * @author Pelayo Margareto <sanchezmargareto@gmail.com>
 * @license MIT
 * @version 1.0.0
 */
export class Auth extends Construct {  

  /** @returns the cognito user pool */
  public readonly userPool: CfnUserPool;

  /** @returns the cognito user pool client */
  public readonly userPoolClient: CfnUserPoolClient;

  /** @returns the cognito user pool client for mobile apps */
  public readonly userPoolMobileClient: CfnUserPoolClient;

  /** @returns the cognito identity pool */
  public readonly identityPool: CfnIdentityPool;

  /** @returns the identity pool's unauth role */
  public readonly identityPoolUnauthRole: Role;

  /** @returns the identity pool's auth role */
  public readonly identityPoolAuthRole: Role;

  /** @returns the identity pool's role attachments */
  public readonly identityPoolRoleAttachments: CfnIdentityPoolRoleAttachment;

  constructor(parent: Construct, name: string, props: AuthProps) {
    super(parent, name);

    const awsRegion = Aws.region;
    const awsAccountId = Aws.accountId;

    this.userPool = new CfnUserPool(this, 'Users', {
      userPoolName: props.userPoolName,
      aliasAttributes: ['email'],
      autoVerifiedAttributes: ['email'],
      policies: {
        passwordPolicy: {
          minimumLength: props.minPasswordLength,
          requireLowercase: props.requireLowercase,
          requireUppercase: props.requireUppercase,
          requireNumbers: props.requireNumbers,
          requireSymbols: props.requireSymbols
        }
      },
      schema: [
        {
          attributeDataType: 'String',
          name: 'email',
          required: true
        },
        {
          attributeDataType: 'String',
          name: 'phone_number',
          required: false
        },
        {
          attributeDataType: 'String',
          name: 'given_name',
          required: true
        },
        {
          attributeDataType: 'String',
          name: 'family_name',
          required: true
        }
      ]
    });

    this.userPoolClient = new CfnUserPoolClient(this, 'DefaultClient', {
      clientName: 'default',
      generateSecret: false,
      refreshTokenValidity: 1,
      writeAttributes: [
        'email', 
        'phone_number', 
        'given_name', 
        'family_name'
      ],
      userPoolId: this.userPool.userPoolId,
    });

    this.userPoolMobileClient = new CfnUserPoolClient(this, 'MobileAppsClient', {
      clientName: 'mobileapps',
      generateSecret: true,
      refreshTokenValidity: 365,
      userPoolId: this.userPool.userPoolId,
      explicitAuthFlows: [
        'USER_PASSWORD_AUTH'
      ]
    });

    this.identityPool = new CfnIdentityPool(this, 'Identities', {
      identityPoolName: props.userPoolName,
      allowUnauthenticatedIdentities: true,
      cognitoIdentityProviders: [
        {
          clientId: this.userPoolClient.userPoolClientId,
          providerName: this.userPool.userPoolProviderName,
        },
        {
          clientId: this.userPoolMobileClient.userPoolClientId,
          providerName: this.userPool.userPoolProviderName,
        }
      ]
    });

    this.identityPoolUnauthRole = new Role(this, 'UnauthIdentitiesRole', {
      assumedBy: new FederatedPrincipal('cognito-identity.amazonaws.com', {}, 'sts:AssumeRoleWithWebIdentity')
    });

    this.identityPoolUnauthRole.addToPolicy(new PolicyStatement()
      .addResource(`arn:aws:cognito-identity:${awsRegion}:${awsAccountId}:identitypool/${this.identityPool.identityPoolId}`)
      .addAction('mobileanalytics:PutEvents')
    );

    this.identityPoolAuthRole = new Role(this, 'AuthIdentitiesRole', {
      assumedBy: new FederatedPrincipal('cognito-identity.amazonaws.com', {
        StringEquals: {
          'cognito-identity.amazonaws.com:aud': this.identityPool.identityPoolId
        },
        'ForAnyValue:StringLike': {
          'cognito-identity.amazonaws.com:amr': 'authenticated'
        }
      }, 'sts:AssumeRoleWithWebIdentity')
    });

    this.identityPoolAuthRole.addToPolicy(new PolicyStatement()
      .addResource(`arn:aws:cognito-identity:${awsRegion}:${awsAccountId}:identitypool/${this.identityPool.identityPoolId}`)
      .addAction('mobileanalytics:PutEvents')
    );

    
    // let labMemberRoleMapping: {[key: string]: CfnIdentityPoolRoleAttachment.RoleMappingProperty} = {};

    // const clientId: string = `cognito-idp-${awsRegion}.amazonaws.com/${this.userPool.userPoolId}:${this.userPoolClient.userPoolClientId}`;

    // labMemberRoleMapping[clientId] = {
    //   ambiguousRoleResolution: 'AuthenticatedRole',
    //   type: 'Token'
    // };
    
    this.identityPoolRoleAttachments = new CfnIdentityPoolRoleAttachment(this, 'IdentitiesRoleAttachments', {
      identityPoolId: this.identityPool.identityPoolId,
      roles: {
        unauthenticated: this.identityPoolUnauthRole.roleArn,
        authenticated: this.identityPoolAuthRole.roleArn,
      },
      // roleMappings: labMemberRoleMapping
    });
  }
}
