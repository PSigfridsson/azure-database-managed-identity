# Run the setup script to set the environment variables and other necessary configurations
source setup.sh

# Login to the Azure Container Registry
echo "Logging in to the Azure Container Registry"
echo $CONTAINER_REGISTRY_PASSWORD | docker login $CONTAINER_REGISTRY_URL -u $CONTAINER_REGISTRY_NAME --password-stdin

# Build and push the container image, using the Dockerfile in the current directory
# The service that pulls the image will automatically pull the image for the platform it is running on (amd64 or arm64)
echo "Building and pushing the container image"
docker buildx build --platform linux/amd64,linux/arm64 -t $CONTAINER_REGISTRY_URL/$APPLICATION_NAME:$IMAGE_TAG . --push --build-arg IMAGE_TAG=$IMAGE_TAG

# Deploy the container image to an azure web app
echo "Deploying the container image to the Azure Web App"
az webapp config container set --name $WEB_APP_NAME --resource-group $RESOURCE_GROUP_NAME --docker-custom-image-name $CONTAINER_REGISTRY_URL/$APPLICATION_NAME:$IMAGE_TAG
# az webapp config container set --name petter-managed-identity-app63fdea6e --resource-group petter-managed-identity-rg1ce029ef --docker-custom-image-name blikkpettercr.azurecr.io/identity-test:main-8830506045f0aaebddca68f4c49a2bc0d696dae7-20240408-110327

# Restart the Azure Web App
echo "Restarting the Azure Web App"
az webapp restart --name $WEB_APP_NAME --resource-group $RESOURCE_GROUP_NAME