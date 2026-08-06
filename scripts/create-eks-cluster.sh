#!/usr/bin/env bash
set -euo pipefail

# Create an EKS cluster in ap-southeast-2 for the project.
# Usage: ./scripts/create-eks-cluster.sh <cluster-name>

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <cluster-name>"
  exit 1
fi

CLUSTER_NAME="$1"
REGION="ap-southeast-2"
NODEGROUP_NAME="standard-workers"
NODE_TYPE="t3.medium"
NODES=2
MIN_NODES=1
MAX_NODES=3

if ! command -v eksctl >/dev/null 2>&1; then
  echo "eksctl not found. Installing eksctl..."
  TMP_DIR="$(mktemp -d)"
  curl -sSL "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C "$TMP_DIR"
  sudo mv "$TMP_DIR/eksctl" /usr/local/bin/eksctl
  rm -rf "$TMP_DIR"
fi

echo "Creating EKS cluster '$CLUSTER_NAME' in region $REGION..."
eksctl create cluster \
  --name "$CLUSTER_NAME" \
  --region "$REGION" \
  --nodegroup-name "$NODEGROUP_NAME" \
  --node-type "$NODE_TYPE" \
  --nodes "$NODES" \
  --nodes-min "$MIN_NODES" \
  --nodes-max "$MAX_NODES" \
  --managed \
  --with-oidc

echo "EKS cluster created successfully."
echo "Next step: update ansible/group_vars/k8s_deploy.yml with eks_cluster_name: '$CLUSTER_NAME' and rerun the pipeline with DEPLOY_TARGET=kubernetes."
