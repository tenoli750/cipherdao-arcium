#!/usr/bin/env bash
set -euo pipefail

RPC_URL="${RPC_URL:-https://api.devnet.solana.com}"
KEYPAIR="${KEYPAIR:-$HOME/.config/solana/id.json}"
CLUSTER_OFFSET="${ARCIUM_CLUSTER_OFFSET:-456}"
RECOVERY_SET_SIZE="${RECOVERY_SET_SIZE:-4}"

echo "Building Would You DAO..."
arcium build

echo "Deploying to devnet RPC: $RPC_URL"
arcium deploy \
  --cluster-offset "$CLUSTER_OFFSET" \
  --recovery-set-size "$RECOVERY_SET_SIZE" \
  --keypair-path "$KEYPAIR" \
  --rpc-url "$RPC_URL"

echo "Bootstrap after deploy:"
echo "RPC_URL=$RPC_URL ARCIUM_CLUSTER_OFFSET=$CLUSTER_OFFSET npm run dao:bootstrap"
