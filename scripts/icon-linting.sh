#!/bin/bash

function on_error() {
  echo -e ""
  echo -e "\033[0;31mFAILED: Direct @tabler/icons-react imports detected\033[0m"
  echo -e ""
  echo -e "You should not directly import @tabler/icons-react in your code."
  echo -e "Instead, you should import icons from 'turboui' or add them to turboui/src/icons/index.tsx"
  echo -e ""
  echo -e "This is much faster because:"
  echo -e "  - Icons are pre-bundled in turboui"
  echo -e "  - No need to load individual icon files at runtime"
  echo -e "  - Better tree-shaking and bundle optimization"
  echo -e ""
  echo -e "The following files have direct @tabler/icons-react imports:"
  echo -e ""
  echo "$problems"
  echo -e ""
  echo -e "To fix this:"
  echo -e "  1. Check if your icon is already exported in turboui/src/icons/index.tsx"
  echo -e "  2. If yes, import it from 'turboui' instead: import { IconName } from 'turboui'"
  echo -e "  3. If no, add the icon to turboui/src/icons/index.tsx first, then import from 'turboui'"
  echo -e ""
  exit 1
}

echo "Checking for direct @tabler/icons-react imports..."

# Search for @tabler/icons-react imports in app/assets and turboui/src
# Exclude the turboui/src/icons/index.tsx file where direct imports are allowed
problems=$(grep -r "@tabler/icons-react" app/assets/js turboui/src --include="*.tsx" --include="*.ts" 2>/dev/null | \
  grep -v "turboui/src/icons/index.tsx" || true)

if [ -n "$problems" ]; then
  on_error
else
  echo "✓ No direct @tabler/icons-react imports found"
  echo "All icons are properly imported from turboui"
fi
