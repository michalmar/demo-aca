@description('Deployment location for the backend container app.')
param location string

@description('Name of the container app.')
param name string

@description('Resource ID of the Container Apps managed environment.')
param managedEnvironmentId string

@description('Container image to deploy.')
param image string

@description('Target port exposed by the container.')
param targetPort int

@description('Minimum number of replicas.')
param minReplicas int = 1

@description('Maximum number of replicas.')
param maxReplicas int = 2

@description('CPU allocation for the container (e.g. "0.5").')
param cpu string = '0.5'

@description('Memory allocation for the container (e.g. "1Gi").')
param memory string = '1Gi'

@description('Extra environment variables to merge into the container spec.')
param environmentVariables array = []

@description('User-assigned identity resource ID.')
param identityId string

@description('Client ID of the user-assigned identity.')
param identityClientId string

@description('Cosmos DB endpoint exposed to the app.')
param cosmosEndpoint string

@description('Cosmos DB database name.')
param cosmosDatabaseName string

@description('Cosmos DB container name that stores questionnaire answers.')
param cosmosAnswersContainerName string

@description('Cosmos DB container name that stores questionnaire metadata.')
param cosmosQuestionnaireContainerName string

@description('Login server of the Azure Container Registry used for the image.')
param acrLoginServer string

@description('Tags to apply to the container app.')
param tags object = {}

var mergedEnv = concat(
  environmentVariables,
  [
    {
      name: 'AZURE_CLIENT_ID'
      value: identityClientId
    }
    {
      name: 'COSMOS_ENDPOINT'
      value: cosmosEndpoint
    }
    {
      name: 'COSMOS_DATABASE_NAME'
      value: cosmosDatabaseName
    }
    {
      name: 'COSMOS_ANSWERS_CONTAINER_NAME'
      value: cosmosAnswersContainerName
    }
    {
      name: 'COSMOS_QUESTIONNAIRE_CONTAINER_NAME'
      value: cosmosQuestionnaireContainerName
    }
  ]
)

resource containerApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: name
  location: location
  tags: tags
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${identityId}': {}
    }
  }
  properties: {
    managedEnvironmentId: managedEnvironmentId
    configuration: {
      ingress: {
        external: true
        targetPort: targetPort
        transport: 'auto'
        allowInsecure: false
      }
      registries: [
        {
          server: acrLoginServer
          identity: identityId
        }
      ]
    }
    template: {
      containers: [
        {
          name: name
          image: image
          resources: {
            cpu: json(cpu)
            memory: memory
          }
          env: mergedEnv
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
        rules: [
          {
            name: 'http-requests'
            http: {
              metadata: {
                concurrentRequests: '10'
              }
            }
          }
        ]
      }
    }
  }
}

output id string = containerApp.id
output name string = containerApp.name
output fqdn string = containerApp.properties.configuration.ingress.fqdn
output identityClientId string = identityClientId
