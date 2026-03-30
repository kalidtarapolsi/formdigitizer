#!/bin/bash
# Push redigitized schemas to GitHub

cd "$(dirname "$0")"

# Remove stale lock file if it exists
rm -f .git/index.lock 2>/dev/null

echo "=================================="
echo "  Adding all files to git..."
echo "=================================="
# Add all tracked and untracked files (except node_modules)
echo "node_modules/" >> .gitignore 2>/dev/null
git add -A

echo ""
echo "=================================="
echo "  Amending commit with all files..."
echo "=================================="
git commit --amend --no-edit

echo ""
echo "=================================="
echo "  Merging remote changes..."
echo "=================================="
git merge origin/main --allow-unrelated-histories --no-edit -X ours

echo ""
echo "=================================="
echo "  Pushing to GitHub..."
echo "=================================="
git push -u origin main

echo ""
echo "Done! Press any key to close."
read -n 1
