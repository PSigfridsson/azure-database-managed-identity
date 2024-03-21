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
echo "Deploying the container image to the Azure Web App $SLOT_NAME slot"
az webapp config container set --name $WEB_APP_NAME --resource-group $RESOURCE_GROUP_NAME --slot $SLOT_NAME --docker-custom-image-name $CONTAINER_REGISTRY_URL/$APPLICATION_NAME:$IMAGE_TAG

# Restart the "staging" slot to force it to pull the new image
echo "Restarting the Azure Web App $SLOT_NAME slot"
az webapp restart --name $WEB_APP_NAME --resource-group $RESOURCE_GROUP_NAME --slot $SLOT_NAME