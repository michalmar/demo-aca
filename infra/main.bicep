targetScope = 'resourceGroup'

@description('Primary deployment location for all resources.')
param location string = resourceGroup().location

@description('Tags applied to all resources created by this template.')
param resourceTags object = {}

@description('Name of the Azure Container Apps environment that hosts the frontend and backend apps.')
param containerAppsEnvironmentName string

@description('Log Analytics workspace name used for Azure Container Apps diagnostics.')
param logAnalyticsWorkspaceName string

@description('Number of days to retain logs in Log Analytics.')
param logAnalyticsRetentionDays int = 30

@description('Name of the Azure Container Registry (must be globally unique).')
param acrName string

@description('SKU of the Azure Container Registry.')
param acrSku string = 'Basic'

@description('Enable admin user for simplified authentication (dev/test only).')
param adminUserEnabled bool = true

@description('Cosmos DB account name (must be globally unique).')
param cosmosAccountName string

@description('Name of the Cosmos DB SQL database.')
param cosmosDatabaseName string = 'questionnaire_db'

@description('Name of the Cosmos DB SQL container that stores questionnaire answers.')
param cosmosAnswersContainerName string = 'answers'

@description('Partition key path for the answers container.')
param cosmosAnswersPartitionKey string = '/userId'

@description('Name of the Cosmos DB SQL container that stores questionnaire metadata.')
param cosmosQuestionnaireContainerName string = 'questionnaire'

@description('Partition key path for the questionnaire container.')
param cosmosQuestionnairePartitionKey string = '/id'

@description('Name of the backend Azure Container App.')
param backendAppName string = 'backend-api'

@description('Container image for the backend Azure Container App.')
param backendContainerImage string = 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'

@description('Target port exposed by the backend container.')
param backendTargetPort int = 8080

@description('Minimum number of backend replicas.')
param backendMinReplicas int = 1

@description('Maximum number of backend replicas.')
param backendMaxReplicas int = 2

@description('CPU cores allocated to the backend container (e.g. "0.5").')
param backendCpu string = '0.5'

@description('Memory allocated to the backend container (e.g. "1Gi").')
param backendMemory string = '1Gi'

@description('Optional backend environment variables.')
param backendEnvironmentVariables array = []

@description('Name of the backend user-assigned managed identity.')
param backendIdentityName string = '${backendAppName}-id'

@description('Name of the virtual network for Container Apps and data services.')
param virtualNetworkName string

@description('Address prefix for the virtual network (CIDR).')
param virtualNetworkAddressPrefix string = '10.20.0.0/16'

@description('Name of the subnet delegated to Container Apps infrastructure components.')
param containerAppsInfrastructureSubnetName string = 'aca-infrastructure-snet'

@description('Address prefix for the infrastructure subnet (CIDR).')
param containerAppsInfrastructureSubnetPrefix string = '10.20.0.0/23'

@description('Name of the subnet delegated to Container Apps runtime workloads.')
param containerAppsRuntimeSubnetName string = 'aca-runtime-snet'

@description('Address prefix for the runtime subnet (CIDR).')
param containerAppsRuntimeSubnetPrefix string = '10.20.2.0/24'

@description('Name of the subnet reserved for private endpoints.')
param privateEndpointSubnetName string = 'data-private-endpoints'

@description('Address prefix for the private endpoint subnet (CIDR).')
param privateEndpointSubnetPrefix string = '10.20.3.0/24'

@description('Name of the private endpoint created for Cosmos DB.')
param cosmosPrivateEndpointName string = 'cosmos-db-pe'

@description('Name of the frontend Azure Container App.')
param frontendAppName string = 'frontend-web'

@description('Container image for the frontend Azure Container App.')
param frontendContainerImage string = 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'

@description('Target port exposed by the frontend container.')
param frontendTargetPort int = 3000

@description('Minimum number of frontend replicas.')
param frontendMinReplicas int = 1

@description('Maximum number of frontend replicas.')
param frontendMaxReplicas int = 2

@description('CPU cores allocated to the frontend container (e.g. "0.5").')
param frontendCpu string = '0.5'

@description('Memory allocated to the frontend container (e.g. "1Gi").')
param frontendMemory string = '1Gi'

@description('Name of the frontend user-assigned managed identity.')
param frontendIdentityName string = '${frontendAppName}-id'

@description('Name of the GitHub federation managed identity.')
param githubIdentityName string = 'github-federation-mi'

@description('GitHub OIDC subjects granted access (e.g. repo:org/repo:ref).')
param githubFederatedSubjects array = []

@description('Id of the user or app to assign application roles')
param principalId string

module networking 'modules/networking.bicep' = {
  name: 'networking'
  params: {
    location: location
    virtualNetworkName: virtualNetworkName
    addressPrefix: virtualNetworkAddressPrefix
    infrastructureSubnetName: containerAppsInfrastructureSubnetName
    infrastructureSubnetPrefix: containerAppsInfrastructureSubnetPrefix
    runtimeSubnetName: containerAppsRuntimeSubnetName
    runtimeSubnetPrefix: containerAppsRuntimeSubnetPrefix
    privateEndpointSubnetName: privateEndpointSubnetName
    privateEndpointSubnetPrefix: privateEndpointSubnetPrefix
    tags: resourceTags
  }
}

module containerAppEnvironment 'modules/container-app-environment.bicep' = {
  name: 'container-app-environment'
  params: {
    location: location
    environmentName: containerAppsEnvironmentName
    logAnalyticsWorkspaceName: logAnalyticsWorkspaceName
    logAnalyticsRetentionDays: logAnalyticsRetentionDays
    tags: resourceTags
    infrastructureSubnetId: networking.outputs.infrastructureSubnetId
  }
}

module containerRegistry 'modules/container-registry.bicep' = {
  name: 'container-registry'
  params: {
    location: location
    name: acrName
    sku: acrSku
    adminUserEnabled: adminUserEnabled
    tags: resourceTags
  }
}

module cosmos 'modules/cosmos.bicep' = {
  name: 'cosmos-db'
  params: {
    location: location
    accountName: cosmosAccountName
    databaseName: cosmosDatabaseName
    answersContainerName: cosmosAnswersContainerName
    answersPartitionKeyPath: cosmosAnswersPartitionKey 
    questionnaireContainerName: cosmosQuestionnaireContainerName
    questionnairePartitionKeyPath: cosmosQuestionnairePartitionKey
    userPrincipalId: principalId
    backendPrincipalId: backendIdentity.outputs.principalId
  }
}

module cosmosPrivateEndpoint 'modules/cosmos-private-endpoint.bicep' = {
  name: 'cosmos-private-endpoint'
  params: {
    location: location
    privateEndpointName: cosmosPrivateEndpointName
    cosmosAccountId: cosmos.outputs.accountId
    subnetId: networking.outputs.privateEndpointSubnetId
    privateDnsZoneId: networking.outputs.privateDnsZoneId
    tags: resourceTags
  }
  dependsOn: [
    cosmos
  ]
}

module backendIdentity 'modules/managed-identity.bicep' = {
  name: 'backend-identity'
  params: {
    name: backendIdentityName
    location: location
    tags: resourceTags
  }
}

module frontendIdentity 'modules/managed-identity.bicep' = {
  name: 'frontend-identity'
  params: {
    name: frontendIdentityName
    location: location
    tags: resourceTags
  }
}

module githubIdentity 'modules/managed-identity.bicep' = {
  name: 'github-identity'
  params: {
    name: githubIdentityName
    location: location
    tags: resourceTags
  }
}

module backendApp 'modules/container-app-backend.bicep' = {
  name: 'backend-app'
  params: {
    location: location
    name: backendAppName
    managedEnvironmentId: containerAppEnvironment.outputs.environmentId
    image: backendContainerImage
    targetPort: backendTargetPort
    minReplicas: backendMinReplicas
    maxReplicas: backendMaxReplicas
    cpu: backendCpu
    memory: backendMemory
    environmentVariables: backendEnvironmentVariables
    identityId: backendIdentity.outputs.id
    identityClientId: backendIdentity.outputs.clientId
    cosmosEndpoint: cosmos.outputs.endpoint
    cosmosDatabaseName: cosmosDatabaseName
    cosmosAnswersContainerName: cosmosAnswersContainerName
    cosmosQuestionnaireContainerName: cosmosQuestionnaireContainerName
    acrLoginServer: containerRegistry.outputs.loginServer
    tags: resourceTags
  }
}


module frontendApp 'modules/container-app-frontend.bicep' = {
  name: 'frontend-app'
  params: {
    location: location
    name: frontendAppName
    managedEnvironmentId: containerAppEnvironment.outputs.environmentId
    image: frontendContainerImage
    targetPort: frontendTargetPort
    minReplicas: frontendMinReplicas
    maxReplicas: frontendMaxReplicas
    cpu: frontendCpu
    memory: frontendMemory
    backendUrl: backendApp.outputs.fqdn
    identityId: frontendIdentity.outputs.id
    acrLoginServer: containerRegistry.outputs.loginServer
    tags: resourceTags
  }
}

resource containerRegistryExisting 'Microsoft.ContainerRegistry/registries@2023-07-01' existing = {
  name: acrName
}

resource backendIdentityExisting 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' existing = {
  name: backendIdentityName
}

resource frontendIdentityExisting 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' existing = {
  name: frontendIdentityName
}

resource backendAcrPull 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(containerRegistryExisting.id, backendIdentityExisting.id, 'acr-pull')
  scope: containerRegistryExisting
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')
    principalId: backendIdentity.outputs.principalId
    principalType: 'ServicePrincipal'
  }
}

resource frontendAcrPull 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(containerRegistryExisting.id, frontendIdentityExisting.id, 'acr-pull')
  scope: containerRegistryExisting
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')
    principalId: frontendIdentity.outputs.principalId
    principalType: 'ServicePrincipal'
  }
}

resource githubIdentityContributorRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(subscription().subscriptionId, resourceGroup().name, githubIdentityName, 'rg-contributor')
  scope: resourceGroup()
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'b24988ac-6180-42a0-ab88-20f7382dd24c')
    principalId: githubIdentity.outputs.principalId
    principalType: 'ServicePrincipal'
  }
}

resource githubIdentityAcrPushRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(subscription().subscriptionId, acrName, githubIdentityName, 'acr-push')
  scope: containerRegistryExisting
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '8311e382-0749-4cb8-b61a-304f252e45ec')
    principalId: githubIdentity.outputs.principalId
    principalType: 'ServicePrincipal'
  }
}

resource githubIdentityExisting 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' existing = {
  name: githubIdentityName
}

resource githubFederatedCredentials 'Microsoft.ManagedIdentity/userAssignedIdentities/federatedIdentityCredentials@2023-01-31' = [for subject in githubFederatedSubjects: {
  name: guid(githubIdentityExisting.id, subject)
  parent: githubIdentityExisting
  properties: {
    issuer: 'https://token.actions.githubusercontent.com'
    subject: subject
    audiences: [
      'api://AzureADTokenExchange'
    ]
  }
}]

output cosmosEndpoint string = cosmos.outputs.endpoint
output cosmosPrivateEndpointId string = cosmosPrivateEndpoint.outputs.privateEndpointId
output backendFqdn string = backendApp.outputs.fqdn
output frontendFqdn string = frontendApp.outputs.fqdn
output acrLoginServer string = containerRegistry.outputs.loginServer
output backendIdentityClientId string = backendIdentity.outputs.clientId
output frontendIdentityClientId string = frontendIdentity.outputs.clientId
output githubManagedIdentityClientId string = githubIdentity.outputs.clientId
output containerAppsEnvironmentName string = containerAppsEnvironmentName
output backendAppName string = backendAppName
output acrName string = acrName
output cosmosDatabaseName string = cosmos.outputs.databaseName
output cosmosAnswersContainerName string = cosmos.outputs.answersContainerName
output cosmosQuestionnaireContainerName string = cosmos.outputs.questionnaireContainerName
