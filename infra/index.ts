import { web } from "@pulumi/azure-native";
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
	},
});

// Create web app
const app = new web.WebApp("petter-managed-identity-app", {
	resourceGroupName: resourceGroup.name,
	serverFarmId: appServicePlan.id,
	location: LOCATION,
});
