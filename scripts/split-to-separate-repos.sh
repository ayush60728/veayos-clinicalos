#!/usr/bin/env bash
set -e

# ==============================================================================
# VEAYOS Homoeopathy ClinicalOS - Standalone Polyrepo Split & Sync Utility
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_DIR="$ROOT_DIR/backend"

# Determine GitHub username / organization
GH_USER="ayush60728"
if command -v gh >/dev/null 2>&1; then
  DETECTED_USER=$(gh api user -q .login 2>/dev/null || echo "")
  if [ -n "$DETECTED_USER" ]; then
    GH_USER="$DETECTED_USER"
  fi
fi

FRONTEND_REPO="https://github.com/${GH_USER}/veayos-clinicalos-frontend.git"
BACKEND_REPO="https://github.com/${GH_USER}/veayos-clinicalos-backend.git"

echo "================================================================="
echo "🩺 VEAYOS Homoeopathy ClinicalOS Polyrepo Separation Utility"
echo "Target Organization/User: $GH_USER"
echo "================================================================="

# 1. Setup Standalone Frontend Repository
echo ""
echo "📦 1. Synchronizing standalone Git repository in frontend/..."
if [ -d "$FRONTEND_DIR" ]; then
  cd "$FRONTEND_DIR"
  if [ ! -d ".git" ]; then
    git init -b main
  fi
  # Ensure remote origin is configured
  if git remote | grep -q "^origin$"; then
    git remote set-url origin "$FRONTEND_REPO"
  else
    git remote add origin "$FRONTEND_REPO"
  fi
  
  # Fetch remote
  git fetch origin main 2>/dev/null || true
  
  # Stage and commit any changes
  if [ -n "$(git status --porcelain)" ]; then
    git add .
    git commit -m "feat: standalone production-grade VEAYOS Homoeopathy ClinicalOS Frontend PWA"
    echo "   ✓ Frontend changes committed."
  else
    echo "   ℹ Frontend working directory clean."
  fi

  # Set upstream tracking
  git branch -u origin/main main 2>/dev/null || true
  echo "   ✓ Frontend repository configured with origin $FRONTEND_REPO"
else
  echo "   ❌ Error: frontend directory not found!"
  exit 1
fi

# 2. Setup Standalone Backend Repository
echo ""
echo "📦 2. Synchronizing standalone Git repository in backend/..."
if [ -d "$BACKEND_DIR" ]; then
  cd "$BACKEND_DIR"
  if [ ! -d ".git" ]; then
    git init -b main
  fi
  # Ensure remote origin is configured
  if git remote | grep -q "^origin$"; then
    git remote set-url origin "$BACKEND_REPO"
  else
    git remote add origin "$BACKEND_REPO"
  fi

  # Fetch remote
  git fetch origin main 2>/dev/null || true

  # Stage and commit any changes
  if [ -n "$(git status --porcelain)" ]; then
    git add .
    git commit -m "feat: standalone production-grade VEAYOS Homoeopathy ClinicalOS Backend API"
    echo "   ✓ Backend changes committed."
  else
    echo "   ℹ Backend working directory clean."
  fi

  # Set upstream tracking
  git branch -u origin/main main 2>/dev/null || true
  echo "   ✓ Backend repository configured with origin $BACKEND_REPO"
else
  echo "   ❌ Error: backend directory not found!"
  exit 1
fi

# 3. Optional Push
if [ "$1" = "--push" ] || [ "$2" = "--push" ]; then
  echo ""
  echo "🚀 Pushing standalone repositories to GitHub..."
  cd "$FRONTEND_DIR"
  git push origin main
  echo "   ✓ Frontend pushed to $FRONTEND_REPO"

  cd "$BACKEND_DIR"
  git push origin main
  echo "   ✓ Backend pushed to $BACKEND_REPO"
fi

echo ""
echo "================================================================="
echo "🎉 Polyrepo Setup & Sync Complete!"
echo "================================================================="
echo "Standalone GitHub Repositories:"
echo "  • Frontend: $FRONTEND_REPO"
echo "  • Backend:  $BACKEND_REPO"
echo ""
echo "To push updates manually at any time:"
echo "  cd $FRONTEND_DIR && git push origin main"
echo "  cd $BACKEND_DIR  && git push origin main"
echo "================================================================="
