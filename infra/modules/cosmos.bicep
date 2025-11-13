@description('Azure region for Cosmos DB resources.')
param location string

@description('Cosmos DB account name (globally unique).')
param accountName string

@description('SQL database name.')
param databaseName string

@description('SQL container name.')
param containerName string

@description('Partition key path for the SQL container.')
param partitionKeyPath string

@description('Principal ID of the user executing the deployment')
param userPrincipalId string

@description('Principal ID of the backend Azure Container App managed identity.')
param backendPrincipalId string

@description('The default consistency level of the Cosmos DB account')
@allowed([
  'Eventual'
  'ConsistentPrefix'
  'Session'
  'BoundedStaleness'
  'Strong'
])
param defaultConsistencyLevel string = 'Session'

resource account 'Microsoft.DocumentDB/databaseAccounts@2025-04-15' = {
  name: accountName
  location: location
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    consistencyPolicy: {
      defaultConsistencyLevel: defaultConsistencyLevel
    }
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    capabilities: [
      {
        name: 'EnableServerless'
      }
    ]
    enableFreeTier: false
    enableAutomaticFailover: false
    enableMultipleWriteLocations: false
    publicNetworkAccess: 'Enabled'
    disableKeyBasedMetadataWriteAccess: false
  }
}

resource database 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2023-04-15' = {
  name: databaseName
  parent: account
  properties: {
    resource: {
      id: databaseName
    }
  }
}

resource container 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  name: containerName
  parent: database
  properties: {
    resource: {
      id: containerName
      partitionKey: {
        kind: 'Hash'
        paths: [
          partitionKeyPath
        ]
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
        includedPaths: [
          {
            path: '/*'
          }
        ]
        excludedPaths: [
          {
            path: '/"_etag"/?'
          }
        ]
      }
    }
    options: {}
  }
}

var keys = listKeys(account.id, '2021-04-15')
var connectionString = 'AccountEndpoint=${account.properties.documentEndpoint};AccountKey=${keys.primaryMasterKey};'
var dataContributorRoleId = '${account.id}/sqlRoleDefinitions/00000000-0000-0000-0000-000000000002'

resource userDataContributorRole 'Microsoft.DocumentDB/databaseAccounts/sqlRoleAssignments@2023-04-15' = {
  name: guid(account.id, userPrincipalId, 'cosmos-data-contributor-user')
  parent: account
  properties: {
    roleDefinitionId: dataContributorRoleId
    principalId: userPrincipalId
    scope: account.id
  }
}

resource backendDataContributorRole 'Microsoft.DocumentDB/databaseAccounts/sqlRoleAssignments@2023-04-15' = {
  name: guid(account.id, backendPrincipalId, 'cosmos-data-contributor-backend')
  parent: account
  properties: {
    roleDefinitionId: dataContributorRoleId
    principalId: backendPrincipalId
    scope: account.id
  }
}

output accountId string = account.id
output accountName string = account.name
output endpoint string = account.properties.documentEndpoint
@secure()
output primaryKey string = keys.primaryMasterKey
@secure()
output connectionString string = connectionString
output dataContributorRoleId string = dataContributorRoleId
output databaseName string = databaseName
output containerName string = containerName
