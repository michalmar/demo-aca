#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: configure-github.sh [path/to/azd-env-file]

Reads the specified azd environment (.env) file, then stores the values in
GitHub repository variables and secrets used by the deployment workflow.

If no file path is provided the script attempts to locate one at:
  .azure/${AZURE_ENV_NAME}/.env (when AZURE_ENV_NAME is set), otherwise the
first .azure/*/.env it finds.
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

for tool in az gh; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "Required CLI '$tool' is not installed or not on PATH." >&2
    exit 1
  fi
done

ENV_FILE=${1:-}

if [[ -z "$ENV_FILE" ]]; then
  if [[ -n "${AZURE_ENV_NAME:-}" && -f ".azure/${AZURE_ENV_NAME}/.env" ]]; then
    ENV_FILE=".azure/${AZURE_ENV_NAME}/.env"
  else
    shopt -s nullglob
    candidates=(.azure/*/.env)
    shopt -u nullglob
    if (( ${#candidates[@]} == 1 )); then
      ENV_FILE="${candidates[0]}"
    else
      usage >&2
      echo "Unable to determine azd environment file automatically. Please pass the path explicitly." >&2
      exit 1
    fi
  fi
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Environment file '$ENV_FILE' not found." >&2
  exit 1
fi

echo "Using environment file: $ENV_FILE"

set -a
source "$ENV_FILE"
set +a

# Resolve tenant ID via Azure CLI when not present in the environment file.
if [[ -z "${AZURE_TENANT_ID:-}" ]]; then
  AZURE_TENANT_ID=$(az account show --query tenantId -o tsv 2>/dev/null || true)
  export AZURE_TENANT_ID
fi

# Ensure derived values exist for downstream mapping.
containerAppsEnvironmentName=${containerAppsEnvironmentName:-${AZURE_CONTAINERAPPS_ENVIRONMENT:-}}
backendAppName=${backendAppName:-${AZURE_BACKEND_APP_NAME:-}}
acrName=${acrName:-${AZURE_CONTAINER_REGISTRY:-}}
backendImageName=${backendImageName:-${AZURE_BACKEND_IMAGE_NAME:-${backendAppName:-}}}

if [[ -z "${acrName:-}" && -n "${acrLoginServer:-}" ]]; then
  acrName=${acrLoginServer%%.azurecr.io}
fi

if [[ -z "${backendImageName:-}" && -n "${backendAppName:-}" ]]; then
  backendImageName=$backendAppName
fi

# Expose commonly consumed uppercase aliases when they are missing.
if [[ -n "${backendIdentityClientId:-}" && -z "${MANAGED_IDENTITY_CLIENT_ID:-}" ]]; then
  export MANAGED_IDENTITY_CLIENT_ID=$backendIdentityClientId
fi

if [[ -n "${cosmosEndpoint:-}" && -z "${COSMOS_ENDPOINT:-}" ]]; then
  export COSMOS_ENDPOINT=$cosmosEndpoint
fi

if [[ -n "${cosmosDatabaseName:-}" && -z "${COSMOS_DATABASE_NAME:-}" ]]; then
  export COSMOS_DATABASE_NAME=$cosmosDatabaseName
fi

if [[ -n "${cosmosAnswersContainerName:-}" && -z "${COSMOS_ANSWERS_CONTAINER_NAME:-}" ]]; then
  export COSMOS_ANSWERS_CONTAINER_NAME=$cosmosAnswersContainerName
fi

if [[ -n "${cosmosQuestionnaireContainerName:-}" && -z "${COSMOS_QUESTIONNAIRE_CONTAINER_NAME:-}" ]]; then
  export COSMOS_QUESTIONNAIRE_CONTAINER_NAME=$cosmosQuestionnaireContainerName
fi

missing=0

require_value() {
  local env_var=$1
  local description=$2
  local value=${!env_var:-}
  if [[ -z "$value" ]]; then
    echo "Missing value for '$env_var' (${description}) in $ENV_FILE." >&2
    missing=1
  fi
}

VARIABLE_MAP=(
  "AZURE_RESOURCE_GROUP:AZURE_RESOURCE_GROUP"
  "AZURE_CONTAINERAPPS_ENVIRONMENT:containerAppsEnvironmentName"
  "AZURE_BACKEND_APP_NAME:backendAppName"
  "AZURE_CONTAINER_REGISTRY:acrName"
  "AZURE_BACKEND_IMAGE_NAME:backendImageName"
  "MANAGED_IDENTITY_CLIENT_ID:backendIdentityClientId"
  "BACKEND_IDENTITY_CLIENT_ID:backendIdentityClientId"
  "FRONTEND_IDENTITY_CLIENT_ID:frontendIdentityClientId"
  "BACKEND_FQDN:backendFqdn"
  "FRONTEND_FQDN:frontendFqdn"
  "AZURE_CONTAINER_REGISTRY_LOGIN:acrLoginServer"
  "COSMOS_ENDPOINT:cosmosEndpoint"
  "COSMOS_DATABASE_NAME:cosmosDatabaseName"
  "COSMOS_ANSWERS_CONTAINER_NAME:cosmosAnswersContainerName"
  "COSMOS_QUESTIONNAIRE_CONTAINER_NAME:cosmosQuestionnaireContainerName"
  "AZURE_OPENAI_ENDPOINT:AZURE_OPENAI_ENDPOINT"
  "AZURE_OPENAI_MODEL:AZURE_OPENAI_MODEL"
)

SECRET_MAP=(
  "AZURE_SUBSCRIPTION_ID:AZURE_SUBSCRIPTION_ID"
  "AZURE_TENANT_ID:AZURE_TENANT_ID"
  "AZURE_CLIENT_ID:githubManagedIdentityClientId"
)

for entry in "${VARIABLE_MAP[@]}"; do
  IFS=':' read -r _ env_var <<<"$entry"
  require_value "$env_var" "GitHub variable"
done

for entry in "${SECRET_MAP[@]}"; do
  IFS=':' read -r _ env_var <<<"$entry"
  require_value "$env_var" "GitHub secret"
done

if (( missing )); then
  echo "One or more required values are missing. Run 'azd provision' to refresh the environment or update infra/main.bicep outputs." >&2
  exit 1
fi

REPO=${GH_REPO:-$(gh repo view --json nameWithOwner --jq '.nameWithOwner')}
echo $REPO

set_github_variable() {
  local name=$1
  local env_var=$2
  local value=${!env_var}
  value=${value//$'\r'/}
  echo "Setting variable $name"
  gh variable set "$name" --repo "$REPO" --body "$value" >/dev/null
}

set_github_secret() {
  local name=$1
  local env_var=$2
  local value=${!env_var}
  value=${value//$'\r'/}
  echo "Setting secret $name"

  gh secret set "$name" --repo "$REPO" --body "$value" >/dev/null
}

for entry in "${VARIABLE_MAP[@]}"; do
  IFS=':' read -r gh_name env_var <<<"$entry"
  set_github_variable "$gh_name" "$env_var"
done

for entry in "${SECRET_MAP[@]}"; do
  IFS=':' read -r gh_name env_var <<<"$entry"
  set_github_secret "$gh_name" "$env_var"
done

echo "GitHub configuration updated successfully for repository $REPO."
