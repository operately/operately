defmodule Mix.Tasks.Operately.I18n.Extract do
  use Mix.Task

  @shortdoc "Extract translatable messages from Elixir and frontend code"

  @moduledoc """
  Extracts English source messages from Elixir and frontend code into one Gettext catalog.

  Writes `priv/gettext/messages.pot` and merges new message IDs into existing PO files
  without overwriting reviewed translations.

  See `docs/internationalization.md`.
  """

  def run(_args) do
    messages = Operately.I18n.Catalog.extract()
    Mix.shell().info("Extracted #{length(messages)} messages to #{Operately.I18n.Catalog.pot_path()}")
  end
end
