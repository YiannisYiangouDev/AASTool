// Azure Bicep — SERG-ASSTool Enterprise Infrastructure
// Deploy: az deployment sub create --location westeurope --template-file main.bicep

targetScope = 'subscription'

param location string = 'westeurope'
param environment string = 'production'
@secure()
param dbPassword string
@secure()
param dbAdminPassword string

// Resource Group
resource rg 'Microsoft.Resources/resourceGroups@2022-09-01' = {
  name: 'rg-aas-${environment}'
  location: location
}

// Deploy all resource-group-scoped resources via module
module rgDeployment 'resources.bicep' = {
  scope: rg
  params: {
    location: location
    environment: environment
    dbPassword: dbPassword
    dbAdminPassword: dbAdminPassword
  }
}

// Propagate outputs from the resource group deployment
output backendUrl string = rgDeployment.outputs.backendUrl
output frontendUrl string = rgDeployment.outputs.frontendUrl
output mariadbFqdn string = rgDeployment.outputs.mariadbFqdn
