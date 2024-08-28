#!/bin/bash

function on_error() {
  echo -e ""
  echo -e "\033[0;31mFAILED\033[0m"
  echo -e ""
  echo -e "Please run the following command to fix the formatting issues:"
  echo -e ""
  echo -e "  make js.fmt.fix"
  echo -e ""
  echo -e "To avoid doing this manually, set up a format on save feature in your editor."
  echo -e ""
  echo -e "  - Neovim: https://github.com/pmizio/typescript-tools.nvim"
  echo -e "  - VSCode: https://www.digitalocean.com/community/tutorials/how-to-format-code-with-prettier-in-visual-studio-code#step-2-formatting-code-on-save"
  echo -e ""
  echo -e "If you are using a different editor, search for 'format on save' with the"
  echo -e "name of your editor, and consider adding a link to this script."
  echo -e ""
  exit 1
}

echo "Checking if JS and TS files are properly formatted"
cd assets
npx prettier --list-different js | cat # if prettier is piped to a command, it will be less verbose

if [ ${PIPESTATUS[0]} -ne 0 ]; then on_error; fi
