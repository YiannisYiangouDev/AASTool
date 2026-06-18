// Azure Bicep — AAS Resource-Group Resources
// Referenced as a module from main.bicep

param location string
param environment string
@secure()
param dbPassword string
@secure()
param dbAdminPassword string

// App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: 'asp-aas-${environment}'
  location: location
  sku: {
    name: 'B1'
    tier: 'Basic'
  }
  properties: {
    reserved: true
  }
  kind: 'linux'
}

// Backend App Service
resource backendApp 'Microsoft.Web/sites@2022-03-01' = {
  name: 'app-aas-backend-${environment}'
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|20-lts'
      alwaysOn: true
      appSettings: [
        { name: 'PORT', value: '4000' }
        { name: 'WEBSITES_PORT', value: '4000' }
        { name: 'DATABASE_URL', value: 'mysql://myuser:${dbPassword}@${mariadbServer.properties.fullyQualifiedDomainName}:3306/mydb' }
        { name: 'DB_TYPE', value: 'mariadb' }
        { name: 'TYPEORM_SYNCHRONIZE', value: 'false' }
      ]
      healthCheckPath: '/health'
    }
  }
}

// Static Web App (Frontend)
resource frontendApp 'Microsoft.Web/staticSites@2022-03-01' = {
  name: 'stapp-aas-frontend-${environment}'
  location: location
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
  properties: {
    repositoryUrl: 'https://github.com/your-org/accessibility-assessment'
    branch: 'main'
    buildProperties: {
      appLocation: '/frontend'
      apiLocation: ''
      outputLocation: '.next'
    }
  }
}

// MariaDB Server
resource mariadbServer 'Microsoft.DBforMariaDB/servers@2018-06-01' = {
  name: 'mariadb-aas-${environment}'
  location: location
  properties: {
    createMode: 'Default'
    administratorLogin: 'aasadmin'
    administratorLoginPassword: dbAdminPassword
    version: '10.3'
    sslEnforcement: 'Enabled'
    minimalTlsVersion: 'TLS1_2'
    storageProfile: {
      storageMB: 20480
      backupRetentionDays: 7
      geoRedundantBackup: 'Enabled'
    }
  }
}

// MariaDB Database
resource mariadbDb 'Microsoft.DBforMariaDB/servers/databases@2018-06-01' = {
  parent: mariadbServer
  name: 'mydb'
}

// Firewall Rule (Allow Azure services)
resource allowAzure 'Microsoft.DBforMariaDB/servers/firewallRules@2018-06-01' = {
  parent: mariadbServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// Application Insights
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'appi-aas-${environment}'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logWorkspace.id
  }
}

// Log Analytics Workspace
resource logWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: 'law-aas-${environment}'
  location: location
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
  }
}

// Outputs
output backendUrl string = 'https://${backendApp.properties.defaultHostName}'
output frontendUrl string = 'https://${frontendApp.properties.defaultHostname}'
output mariadbFqdn string = mariadbServer.properties.fullyQualifiedDomainName
