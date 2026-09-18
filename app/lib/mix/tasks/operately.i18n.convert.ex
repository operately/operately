defmodule Mix.Tasks.Operately.I18n.Convert do
  use Mix.Task

  @shortdoc "Generate i18next JSON from Gettext catalogs"

  @moduledoc """
  Converts `priv/gettext/messages.pot` into English JSON and each
  `priv/gettext/<locale>/LC_MESSAGES/messages.po` file into locale JSON.

  Output: `assets/js/generated/locales/<locale>.json`

  Generated files are never edited by hand.

  See `docs/internationalization.md`.
  """

  def run(_args) do
    Operately.I18n.Catalog.convert()
    Mix.shell().info("Generated i18next JSON in #{Operately.I18n.Catalog.json_dir()}")
  end
end
