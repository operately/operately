defmodule Operately.I18n.Check do
  @moduledoc """
  Finds missing translations in every supported non-English language.

  1. Extract wrapped messages from current backend and frontend source code.
  2. Read the original PO catalog for each registered language.
  3. Report missing messages, blank translations, and missing plural forms.

  This does not write files or rely on generated catalogs, which may be stale or
  contain English fallback. Unwrapped copy and translation quality require review.
  """

  alias Operately.I18n.{Catalog, Languages, Locale, TranslationCheck}

  def run(opts \\ []) do
    messages = Catalog.extract_messages(opts)
    supported = Keyword.get(opts, :supported, Languages.supported())
    po_root = Keyword.get(opts, :po_root, Catalog.po_root())

    supported
    |> Enum.reject(&(&1 == Languages.default()))
    |> Enum.flat_map(&check_language(messages, &1, po_root))
  rescue
    error -> ["Translation check failed: #{Exception.message(error)}"]
  end

  defp check_language(messages, language, po_root) do
    path = Path.join([po_root, Locale.to_gettext(language), "LC_MESSAGES/messages.po"])

    case File.read(path) do
      {:ok, content} -> validate_catalog(messages, content, language, path)
      {:error, :enoent} -> ["#{language}: missing catalog #{path}; create it and translate all source messages"]
      {:error, reason} -> ["#{language}: cannot read #{path}: #{:file.format_error(reason)}"]
    end
  end

  defp validate_catalog(messages, content, language, path) do
    TranslationCheck.validate(messages, content, language)
  rescue
    error -> ["#{language}: cannot check #{path}: #{Exception.message(error)}"]
  end
end
