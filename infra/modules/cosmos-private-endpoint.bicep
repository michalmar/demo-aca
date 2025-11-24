@description('Deployment location for the private endpoint.')
param location string

@description('Name of the private endpoint resource.')
param privateEndpointName string

@description('Resource ID of the Cosmos DB account to connect to.')
param cosmosAccountId string

@description('Subnet ID where the private endpoint will be placed.')
param subnetId string

@description('ID of the private DNS zone to associate with the endpoint.')
param privateDnsZoneId string

@description('Tags applied to the private endpoint.')
param tags object = {}

resource privateEndpoint 'Microsoft.Network/privateEndpoints@2023-05-01' = {
  name: privateEndpointName
  location: location
  tags: tags
  properties: {
    subnet: {
      id: subnetId
    }
    privateLinkServiceConnections: [
      {
        name: 'cosmos-sql'
        properties: {
          privateLinkServiceId: cosmosAccountId
          groupIds: [
            'Sql'
          ]
        }
      }
    ]
  }
}

resource dnsZoneGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2020-11-01' = {
  name: '${privateEndpoint.name}/cosmos-sql-zone'
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'cosmos-sql'
        properties: {
          privateDnsZoneId: privateDnsZoneId
        }
      }
    ]
  }
}

output privateEndpointId string = privateEndpoint.id
