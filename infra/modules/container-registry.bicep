@description('Azure region for ACR.')
param location string

@description('Globally unique registry name.')
param name string

@description('SKU tier for the registry.')
param sku string = 'Basic'

@description('Should the admin user be enabled (dev/test only).')
param adminUserEnabled bool = false

@description('Tags to apply to the registry.')
param tags object = {}

resource registry 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: name
  location: location
  tags: tags
  sku: {
    name: sku
  }
  properties: {
    adminUserEnabled: adminUserEnabled
    publicNetworkAccess: 'Enabled'
    networkRuleBypassOptions: 'AzureServices'
    policies: {
      quarantinePolicy: {
        status: 'disabled'
      }
      trustPolicy: {
        type: 'Notary'
        status: 'disabled'
      }
      retentionPolicy: {
        days: 7
        status: 'disabled'
      }
    }
  }
}

output id string = registry.id
output name string = registry.name
output loginServer string = registry.properties.loginServer
