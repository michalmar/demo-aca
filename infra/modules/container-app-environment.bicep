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

resource managedEnvironment 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: environmentName
  location: location
  tags: tags
  properties: {
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
