@description('Deployment location for the networking resources.')
param location string

@description('Name of the virtual network to create.')
param virtualNetworkName string

@description('Address space for the virtual network (CIDR).')
param addressPrefix string

@description('Name of the infrastructure subnet for Container Apps control plane.')
param infrastructureSubnetName string

@description('Address prefix of the infrastructure subnet (CIDR).')
param infrastructureSubnetPrefix string

@description('Name of the runtime subnet for Container Apps workloads.')
param runtimeSubnetName string

@description('Address prefix of the runtime subnet (CIDR).')
param runtimeSubnetPrefix string

@description('Name of the private endpoint subnet for data services.')
param privateEndpointSubnetName string

@description('Address prefix of the private endpoint subnet (CIDR).')
param privateEndpointSubnetPrefix string

@description('Tags applied to all created resources.')
param tags object = {}

@description('Name of the private DNS zone used for Cosmos DB.')
param privateDnsZoneName string = 'privatelink.documents.azure.com'

resource virtualNetwork 'Microsoft.Network/virtualNetworks@2023-02-01' = {
  name: virtualNetworkName
  location: location
  tags: tags
  properties: {
    addressSpace: {
      addressPrefixes: [
        addressPrefix
      ]
    }
    subnets: [
      {
        name: infrastructureSubnetName
        properties: {
          addressPrefix: infrastructureSubnetPrefix
        }
      }
      {
        name: runtimeSubnetName
        properties: {
          addressPrefix: runtimeSubnetPrefix
        }
      }
      {
        name: privateEndpointSubnetName
        properties: {
          addressPrefix: privateEndpointSubnetPrefix
          privateEndpointNetworkPolicies: 'Disabled'
          privateLinkServiceNetworkPolicies: 'Enabled'
        }
      }
    ]
  }
}

resource privateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: privateDnsZoneName
  location: 'global'
  tags: tags
}

resource dnsZoneLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  name: '${privateDnsZone.name}/${virtualNetwork.name}-link'
  location: 'global'
  properties: {
    virtualNetwork: {
      id: virtualNetwork.id
    }
    registrationEnabled: false
  }
}

output virtualNetworkId string = virtualNetwork.id
output infrastructureSubnetId string = resourceId('Microsoft.Network/virtualNetworks/subnets', virtualNetwork.name, infrastructureSubnetName)
output runtimeSubnetId string = resourceId('Microsoft.Network/virtualNetworks/subnets', virtualNetwork.name, runtimeSubnetName)
output privateEndpointSubnetId string = resourceId('Microsoft.Network/virtualNetworks/subnets', virtualNetwork.name, privateEndpointSubnetName)
output privateDnsZoneId string = privateDnsZone.id
