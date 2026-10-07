defmodule Mix.Tasks.Operately.I18n.Check do
  @moduledoc """
  Checks for missing translations with `make test.i18n` in development and CI.

  1. Compile the application if needed.
  2. Check every source message in every supported non-English language.
  3. Report success or fail with the languages, messages, and plural forms missing translations.

  No catalogs or generated resources are changed.
  """

  use Mix.Task

  @shortdoc "Find missing translations in supported languages"

  alias Operately.I18n.{Check, Languages}

  @impl Mix.Task
  def run(_) do
    Mix.Task.run("compile")

    case Check.run() do
      [] -> Mix.shell().info("Translation checks passed for #{Enum.join(Languages.supported(), ", ")}.")
      errors -> Mix.raise("Translation checks failed:\n\n" <> Enum.join(errors, "\n"))
    end
  end
end
