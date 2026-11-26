#!/usr/bin/env bash
set -e

# ==============================================================================
# VEAYOS Homoeopathy ClinicalOS - Standalone Polyrepo Split Utility
# ==============================================================================
# Automates exporting the separated frontend and backend into two standalone
# git repositories ready to be pushed to separate GitHub repositories.
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_DIR="$ROOT_DIR/backend"

echo "================================================================="
echo "🩺 VEAYOS Homoeopathy ClinicalOS Polyrepo Separation Utility"
echo "================================================================="

# 1. Setup Standalone Frontend Repository
echo ""
echo "📦 1. Initializing standalone Git repository in frontend/..."
if [ -d "$FRONTEND_DIR" ]; then
  cd "$FRONTEND_DIR"
  if [ ! -d ".git" ]; then
    git init -b main
    git add .
    git commit -m "feat: initial commit for VEAYOS Homoeopathy ClinicalOS Frontend PWA"
    echo "   ✓ Frontend standalone git repository initialized with main branch."
  else
    echo "   ℹ Frontend .git repository already exists."
  fi
else
  echo "   ❌ Error: frontend directory not found!"
  exit 1
fi

# 2. Setup Standalone Backend Repository
echo ""
echo "📦 2. Initializing standalone Git repository in backend/..."
if [ -d "$BACKEND_DIR" ]; then
  cd "$BACKEND_DIR"
  if [ ! -d ".git" ]; then
    git init -b main
    git add .
    git commit -m "feat: initial commit for VEAYOS Homoeopathy ClinicalOS Backend API"
    echo "   ✓ Backend standalone git repository initialized with main branch."
  else
    echo "   ℹ Backend .git repository already exists."
  fi
else
  echo "   ❌ Error: backend directory not found!"
  exit 1
fi

echo ""
echo "================================================================="
echo "🎉 Separation Complete!"
echo "================================================================="
echo "To push to your separate GitHub repositories, run:"
echo ""
echo "--- Frontend PWA ---"
echo "  cd $FRONTEND_DIR"
echo "  git remote add origin https://github.com/<YOUR-ORG>/veayos-clinicalos-frontend.git"
echo "  git push -u origin main"
echo ""
echo "--- Backend API ---"
echo "  cd $BACKEND_DIR"
echo "  git remote add origin https://github.com/<YOUR-ORG>/veayos-clinicalos-backend.git"
echo "  git push -u origin main"
echo "================================================================="
