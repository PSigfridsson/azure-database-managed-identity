import { web, sql } from "@pulumi/azure-native";
import * as resources from "@pulumi/azure-native/resources";

const LOCATION = "swedencentral";

// Create an Azure Resource Group
const resourceGroup = new resources.ResourceGroup(
	"petter-managed-identity-rg",
	{
		location: LOCATION,
	}
);

// Create app service plan
const appServicePlan = new web.AppServicePlan("petter-managed-identity-asp", {
	resourceGroupName: resourceGroup.name,
	location: LOCATION,
	sku: {
		name: "S1",
		tier: "Standard",
		capacity: 1,
	},
	kind: "Linux", // Does nothing i guess?
	reserved: true, // This makes it a linux ASP
});

// Create web app
const app = new web.WebApp("petter-managed-identity-app", {
	resourceGroupName: resourceGroup.name,
	serverFarmId: appServicePlan.id,
	location: LOCATION,
	identity: {
		type: web.ManagedServiceIdentityType.SystemAssigned,
	},
	kind: "app,linux,container", // Does nothing i guess?
	reserved: true, // This makes it a linux app service
	siteConfig: {
		linuxFxVersion: "DOCKER|mcr.microsoft.com/mcr/hello-world:latest",
	},
});

// Create sql server
const fooServer = new sql.Server("fooServer", {
	administratorLogin: "CloudSAea146cfb",
	administrators: {
		administratorType: "ActiveDirectory",
		azureADOnlyAuthentication: false, // TODO - CHANGE TO TRUE
		login: "petter.sigfridsson@visma.com",
		principalType: "User",
		sid: "e3ae125b-9e15-4b53-adf8-a5f5093d8315",
		tenantId: "e17fe564-356d-4667-8f82-7a4eef473405",
	},
	location: "swedencentral",
	minimalTlsVersion: "1.2",
	publicNetworkAccess: "Enabled",
	resourceGroupName: "petter-managed-identity-rg1ce029ef",
	restrictOutboundNetworkAccess: "Disabled",
	serverName: "foo-server",
	version: "12.0",
});

// Create sql database
const barDatabase = new sql.Database("barDatabase", {
	resourceGroupName: resourceGroup.name,
	serverName: fooServer.name,
	catalogCollation: "SQL_Latin1_General_CP1_CI_AS",
	collation: "SQL_Latin1_General_CP1_CI_AS",
	databaseName: "bar-database",
	isLedgerOn: false,
	location: LOCATION,
	maintenanceConfigurationId:
		"/subscriptions/75c9aee8-add5-4892-a945-6054e1afe823/providers/Microsoft.Maintenance/publicMaintenanceConfigurations/SQL_Default",
	maxSizeBytes: 2147483648,
	readScale: "Disabled",
	requestedBackupStorageRedundancy: "Local",
	sku: {
		capacity: 5,
		name: "Basic",
		tier: "Basic",
	},
	zoneRedundant: false,
});
