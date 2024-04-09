# Get the current Git commit SHA
CURRENT_COMMIT=$(git rev-parse HEAD)
# Get the current branch name
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
# Get the current timestamp in the format YYYY-MM-DD_HH:MM:SS
CURRENT_TIMESTAMP=$(date '+%Y%m%d-%H%M%S')
############################################
# EXPORTED ENVIRONMENT VARIABLES
############################################
export CONTAINER_REGISTRY_NAME=blikkpettercr
export CONTAINER_REGISTRY_URL=blikkpettercr.azurecr.io
export CONTAINER_REGISTRY_PASSWORD=<REPLACE-VALUE>
export APPLICATION_NAME=identity-test
export IMAGE_TAG="${CURRENT_BRANCH}-${CURRENT_COMMIT}-${CURRENT_TIMESTAMP}"
export RESOURCE_GROUP_NAME=petter-managed-identity-rg1ce029ef
export WEB_APP_NAME=petter-managed-identity-app63fdea6e
export SLOT_NAME=staging
############################################
# Configure docker to use buildx to build multi-arch images
BUILDER_NAME=mybuilder
if [ -z "$(docker buildx ls | grep $BUILDER_NAME)" ]; then
    echo "Creating a new builder instance for docker buildx"
    docker buildx create --name $BUILDER_NAME
fi

echo "Using builder instance for docker buildx"
docker buildx use $BUILDER_NAME