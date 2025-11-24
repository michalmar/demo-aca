@description('Location for the resources.')
param location string

@description('Name of the Container Apps managed environment.')
param environmentName string

@description('Name of the Log Analytics workspace that backs diagnostics.')
param logAnalyticsWorkspaceName string

@description('Days to retain logs in Log Analytics.')
param logAnalyticsRetentionDays int = 30

@description('Tags applied to all resources created by this module.')
param tags object = {}

@description('Resource ID of the subnet delegated for Container Apps infrastructure components.')
param infrastructureSubnetId string

@description('Set to true to restrict the environment to internal traffic only.')
param internalOnly bool = false

@description('Optional CIDR range reserved for the Container Apps platform.')
@minLength(0)
param platformReservedCidr string = ''

@description('Optional DNS IP drawn from the reserved CIDR range.')
@minLength(0)
param platformReservedDnsIp string = ''

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logAnalyticsWorkspaceName
  location: location
  tags: tags
  properties: {
    retentionInDays: logAnalyticsRetentionDays
    features: {
      searchVersion: 2
    }
  }
  sku: {
    name: 'PerGB2018'
  }
}

var logAnalyticsKeys = listKeys(logAnalytics.id, '2020-08-01')

var optionalPlatformSettings = union(
  empty(platformReservedCidr) ? {} : {
    platformReservedCidr: platformReservedCidr
  },
  empty(platformReservedDnsIp) ? {} : {
    platformReservedDnsIP: platformReservedDnsIp
  }
)

var vnetConfiguration = union({
  infrastructureSubnetId: infrastructureSubnetId
  internal: internalOnly
}, optionalPlatformSettings)

resource managedEnvironment 'Microsoft.App/managedEnvironments@2025-07-01' = {
  name: environmentName
  location: location
  tags: tags
  properties: {
    vnetConfiguration: vnetConfiguration
    publicNetworkAccess: internalOnly ? 'Disabled' : 'Enabled'
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalyticsKeys.primarySharedKey
      }
    }
  }
}

output environmentId string = managedEnvironment.id
output logAnalyticsWorkspaceId string = logAnalytics.id
output logAnalyticsCustomerId string = logAnalytics.properties.customerId
@secure()
output logAnalyticsSharedKey string = logAnalyticsKeys.primarySharedKey
