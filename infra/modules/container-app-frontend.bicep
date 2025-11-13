@description('Deployment location for the frontend container app.')
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

@description('Backend URL exposed as VITE_BACKEND_URL environment variable.')
param backendUrl string


@description('User-assigned identity resource ID.')
param identityId string

@description('Login server of the Azure Container Registry used for the image.')
param acrLoginServer string

@description('Tags to apply to the container app.')
param tags object = {}


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
          env: [
            {
              name: 'VITE_BACKEND_URL'
              value: backendUrl
            }
          ]
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
      }
    }
  }
}

output id string = containerApp.id
output name string = containerApp.name
output fqdn string = containerApp.properties.configuration.ingress.fqdn
