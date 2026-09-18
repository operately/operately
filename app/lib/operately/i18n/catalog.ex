defmodule Operately.I18n.Catalog do
  @moduledoc """
  Shared translation catalog for Elixir, React, and TurboUI.

  English source text is extracted into `priv/gettext/messages.pot`. Reviewed
  translations live in `priv/gettext/<locale>/LC_MESSAGES/messages.po`. i18next
  JSON under `assets/js/generated/locales/` is generated from those files and
  must not be edited by hand.
  """

  alias Operately.I18n.{Converter, ElixirExtractor, FrontendExtractor, Locale, Message, Po}

  @pot_path "priv/gettext/messages.pot"
  @po_root "priv/gettext"
  @json_dir "assets/js/generated/locales"
  @elixir_roots ["lib", "ee/lib"]
  @frontend_roots ["assets/js", "ee/assets/js", "../turboui/src"]
  @elixir_extensions ~w(ex exs heex)
  @frontend_extensions ~w(js jsx ts tsx)

  def pot_path, do: Path.expand(@pot_path)
  def po_root, do: Path.expand(@po_root)
  def json_dir, do: Path.expand(@json_dir)

  def extract(opts \\ []) do
    elixir_files = Keyword.get_lazy(opts, :elixir_files, &default_elixir_files/0)
    frontend_files = Keyword.get_lazy(opts, :frontend_files, &default_frontend_files/0)
    pot_path = Keyword.get(opts, :pot_path, pot_path())
    po_root = Keyword.get(opts, :po_root, po_root())

    messages =
      elixir_files
      |> Enum.flat_map(&ElixirExtractor.extract_file/1)
      |> Kernel.++(FrontendExtractor.extract_files(frontend_files))
      |> merge_messages()

    Po.write!(pot_path, messages)
    merge_po_files(po_root, messages)

    messages
  end

  def convert(opts \\ []) do
    pot_path = Keyword.get(opts, :pot_path, pot_path())
    po_root = Keyword.get(opts, :po_root, po_root())
    json_dir = Keyword.get(opts, :json_dir, json_dir())

    File.mkdir_p!(json_dir)

    en = Converter.from_pot(File.read!(pot_path))
    write_json!(json_dir, "en", en)

    po_root
    |> po_files()
    |> Enum.each(fn {locale, path} ->
      json = Converter.from_po(File.read!(path), locale)
      write_json!(json_dir, locale, json)
    end)

    :ok
  end

  def extract_and_convert(opts \\ []) do
    messages = extract(opts)
    convert(opts)
    messages
  end

  defp default_elixir_files do
    walk(@elixir_roots, @elixir_extensions)
  end

  defp default_frontend_files do
    walk(@frontend_roots, @frontend_extensions)
  end

  defp walk(roots, extensions) do
    glob = "{" <> Enum.join(extensions, ",") <> "}"

    roots
    |> Enum.flat_map(&Path.wildcard(Path.join(&1, "**/*.#{glob}")))
    |> Enum.reject(&ignored_path?/1)
    |> Enum.sort()
  end

  defp ignored_path?(path) do
    basename = Path.basename(path)

    String.contains?(path, "/node_modules/") or
      String.contains?(path, "/generated/") or
      String.contains?(path, "/__tests__/") or
      String.contains?(basename, ".test.") or
      String.ends_with?(basename, "_test.exs")
  end

  defp merge_messages(messages) do
    messages
    |> Enum.reduce(%{}, fn message, acc ->
      Map.update(acc, Message.key(message), message, &Message.merge(&1, message))
    end)
    |> Map.values()
    |> Enum.sort_by(&Message.key/1)
  end

  defp merge_po_files(po_root, pot_messages) do
    po_root
    |> po_files()
    |> Enum.each(fn {_locale, path} ->
      Po.merge_file!(path, pot_messages)
    end)
  end

  defp po_files(po_root) do
    po_root
    |> Path.join("*/LC_MESSAGES/messages.po")
    |> Path.wildcard()
    |> Enum.map(fn path ->
      locale =
        path
        |> Path.split()
        |> Enum.reverse()
        |> Enum.at(2)
        |> Locale.to_bcp47()

      {locale, path}
    end)
    |> Enum.sort_by(&elem(&1, 0))
  end

  defp write_json!(json_dir, locale, translations) do
    File.write!(Path.join(json_dir, "#{locale}.json"), encode_json(translations))
  end

  defp encode_json(translations) do
    body =
      translations
      |> Enum.sort_by(&elem(&1, 0))
      |> Enum.map_join(",\n", fn {key, value} ->
        "  " <> Jason.encode!(key) <> ": " <> Jason.encode!(value)
      end)

    if body == "" do
      "{}\n"
    else
      "{\n" <> body <> "\n}\n"
    end
  end
end
