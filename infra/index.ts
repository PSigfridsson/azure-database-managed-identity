import { web, sql, containerregistry } from "@pulumi/azure-native";
import * as resources from "@pulumi/azure-native/resources";
import * as mssql from "@pulumiverse/mssql";
import * as azad from "@pulumi/azuread";
import { interpolate } from "@pulumi/pulumi";

const LOCATION = "swedencentral";

// Create an Azure Resource Group
const resourceGroup = new resources.ResourceGroup(
	"petter-managed-identity-rg",
	{
		location: LOCATION,
	}
);

// Create container registry
const myRegistry = new containerregistry.Registry(
	"myRegistry",
	{
		adminUserEnabled: true,
		dataEndpointEnabled: false,
		encryption: {
			status: "disabled",
		},
		location: LOCATION,
		networkRuleBypassOptions: "AzureServices",
		policies: {
			exportPolicy: {
				status: "enabled",
			},
			quarantinePolicy: {
				status: "disabled",
			},
			retentionPolicy: {
				days: 7,
				status: "disabled",
			},
			trustPolicy: {
				status: "disabled",
				type: "Notary",
			},
		},
		publicNetworkAccess: "Enabled",
		registryName: "blikkpettercr",
		resourceGroupName: "petter-managed-identity-rg1ce029ef",
		sku: {
			name: "Basic",
		},
		zoneRedundancy: "Disabled",
	},
	{
		protect: true,
	}
);

// Create sql server
const fooServer = new sql.Server("fooServer", {
	administratorLogin: "CloudSAea146cfb",
	administratorLoginPassword: "!abctestBlikk123",
	administrators: {
		administratorType: "ActiveDirectory",
		azureADOnlyAuthentication: false, // TODO - CHANGE TO TRUE
		login: "petter.sigfridsson@visma.com",
		principalType: "User",
		sid: "e3ae125b-9e15-4b53-adf8-a5f5093d8315",
		tenantId: "e17fe564-356d-4667-8f82-7a4eef473405",
	},
	location: LOCATION,
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
const app = new web.WebApp(
	"petter-managed-identity-app",
	{
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
			// Driver={ODBC Driver 18 for SQL Server};Server=tcp:foo-server.database.windows.net,1433;Database=bar-database;Uid=CloudSAea146cfb;Pwd={your_password_here};Encrypt=yes;TrustServerCertificate=no;Connection Timeout=30;
			appSettings: [
				{
					name: "DOCKER_REGISTRY_SERVER_URL",
					value: myRegistry.loginServer,
				},
				{
					name: "DOCKER_REGISTRY_SERVER_USERNAME",
					value: myRegistry.name,
				},
				{
					name: "DOCKER_REGISTRY_SERVER_PASSWORD",
					value: process.env.DOCKER_REGISTRY_SERVER_PASSWORD,
				},
				{
					name: "DB_HOST",
					value: fooServer.fullyQualifiedDomainName,
				},
				{
					name: "DB_USER",
					value: "CloudSAea146cfb",
				},
				{
					name: "DB_PASSWORD",
					value: "!abctestBlikk123", // TODO - CHANGE TO SECRET
				},
				{
					name: "DB_NAME",
					value: barDatabase.name,
				},
			],
		},
	}
	// {
	// 	ignoreChanges: ["siteConfig.linuxFxVersion"],
	// }
);

const containerLogs = new web.WebAppDiagnosticLogsConfiguration(
	`petter-managed-identity-app-logs`,
	{
		applicationLogs: {
			azureBlobStorage: {
				level: web.LogLevel.Off,
			},
			azureTableStorage: {
				level: web.LogLevel.Off,
				sasUrl: "",
			},
			fileSystem: {
				level: web.LogLevel.Off,
			},
		},
		detailedErrorMessages: {
			enabled: false,
		},
		failedRequestsTracing: {
			enabled: false,
		},
		httpLogs: {
			azureBlobStorage: {
				enabled: false,
			},
			fileSystem: {
				enabled: true,
				retentionInMb: 40,
			},
		},
		name: app.name,
		resourceGroupName: resourceGroup.name,
	}
);

const providerMssql = new mssql.Provider("provider-mssql", {
	hostname: "foo-server.database.windows.net",
	port: 1433,
	azureAuth: {
		// tenantId: "e17fe564-356d-4667-8f82-7a4eef473405",
	},
});

const exampleDatabase = mssql.getDatabase(
	{
		name: "bar-database",
	},
	{
		provider: providerMssql,
	}
);

const databaseId = exampleDatabase.then(
	(exampleDatabase) => exampleDatabase.id
);

const clientId123 = app.name
	.apply((name) =>
		azad.getServicePrincipal({
			displayName: name,
		})
	)
	.apply((sp) => sp.clientId);

const exampleAzureadServicePrincipal = new mssql.AzureadServicePrincipal(
	"exampleAzureadServicePrincipal",
	{
		databaseId: databaseId,
		clientId: clientId123,
		name: app.name,
	},
	{
		provider: providerMssql,
	}
);

// Get the data reader role
const dataReaderRoleId = exampleDatabase.then((db) =>
	mssql
		.getDatabaseRole(
			{
				name: "db_datareader",
				databaseId: db.id,
			},
			{
				provider: providerMssql,
			}
		)
		.then((role) => role.id)
);
export const datareaderRoleId = dataReaderRoleId;
// Add user to db_datareader role
const dbDataReaderRoleMember = new mssql.DatabaseRoleMember(
	"dbDataReaderRoleMember",
	{
		roleId: dataReaderRoleId,
		memberId: exampleAzureadServicePrincipal.id, // The ID of the user you want to add to the role
	},
	{
		provider: providerMssql,
	}
);

// Get the data reader role
const dataWriterRoleId = exampleDatabase.then((db) =>
	mssql
		.getDatabaseRole(
			{
				name: "db_datawriter",
				databaseId: db.id,
			},
			{
				provider: providerMssql,
			}
		)
		.then((role) => role.id)
);
export const dataWriterId = dataWriterRoleId;
// Add user to db_datawriter role
const dbDataWriterRoleMember = new mssql.DatabaseRoleMember(
	"dbDataWriterRoleMember",
	{
		roleId: dataWriterRoleId,
		memberId: exampleAzureadServicePrincipal.id, // The ID of the user you want to add to the role
	},
	{
		provider: providerMssql,
	}
);
