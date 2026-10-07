defmodule Operately.I18n.CheckTest do
  use ExUnit.Case, async: false

  alias Operately.I18n.{Catalog, Check}

  setup do
    root = Path.join(System.tmp_dir!(), "catalog-check-test-#{System.unique_integer([:positive])}")
    File.mkdir_p!(root)
    on_exit(fn -> File.rm_rf!(root) end)

    source = Path.join(root, "copy.ex")
    File.write!(source, ~s|gettext("Save")|)
    po_root = Path.join(root, "gettext")
    po = write_catalog(po_root, "pt_BR", ~s|msgid "Save"\nmsgstr "Salvar"\n|)

    opts = [
      elixir_files: [source],
      frontend_files: [],
      pot_path: Path.join(root, "messages.pot"),
      po_root: po_root,
      json_dir: Path.join(root, "json"),
      supported: ["en", "pt-BR"]
    ]

    {:ok, opts: opts, source: source, po: po}
  end

  test "accepts complete catalogs without requiring or writing generated resources", %{opts: opts, po: po} do
    original = File.read!(po)

    assert Check.run(opts) == []
    assert File.read!(po) == original
    refute File.exists?(opts[:pot_path])
    refute File.exists?(opts[:json_dir])
  end

  test "reports new backend copy even when the committed source catalog is stale", %{opts: opts, source: source, po: po} do
    Catalog.extract_and_convert(opts)
    original = File.read!(po)
    original_pot = File.read!(opts[:pot_path])
    File.write!(source, ~s|gettext("New sentence")|)

    assert [error] = Check.run(opts)
    assert error =~ ~s|pt-BR "New sentence"|
    assert error =~ "#{source}:1"
    assert error =~ "missing translation"
    assert File.read!(po) == original
    assert File.read!(opts[:pot_path]) == original_pot
  end

  test "reports new frontend copy without requiring catalog regeneration", %{opts: opts, source: source} do
    frontend = source <> ".tsx"

    File.write!(frontend, """
    import { useTranslation } from "react-i18next";
    export function Page() {
      const { t } = useTranslation();
      return <h1>{t("New heading")}</h1>;
    }
    """)

    assert [error] = Check.run(Keyword.put(opts, :frontend_files, [frontend]))
    assert error =~ ~s|pt-BR "New heading"|
    assert error =~ "#{frontend}:4"
  end

  test "reports a missing catalog for a newly registered language", %{opts: opts} do
    assert [error] = Check.run(Keyword.put(opts, :supported, ["en", "pt-BR", "de"]))
    assert error =~ "de: missing catalog"
    assert error =~ "de/LC_MESSAGES/messages.po"
  end

  test "requires every sentence in a newly registered language", %{opts: opts, source: source, po: po} do
    File.write!(source, ~s|gettext("Save")\ngettext("Cancel")|)
    File.write!(po, ~s|msgid "Cancel"\nmsgstr "Cancelar"\n|, [:append])
    german_po = write_catalog(opts[:po_root], "de", ~s|msgid "Save"\nmsgstr "Speichern"\n|)
    opts = Keyword.put(opts, :supported, ["en", "pt-BR", "de"])

    assert [error] = Check.run(opts)
    assert error =~ ~s|de "Cancel"|
    assert error =~ "#{source}:2"

    File.write!(german_po, ~s|msgid "Cancel"\nmsgstr "Abbrechen"\n|, [:append])
    assert Check.run(opts) == []
  end

  test "reports missing translations in all supported languages", %{opts: opts} do
    write_catalog(opts[:po_root], "de", "")
    write_catalog(opts[:po_root], "fr", "")
    errors = Check.run(Keyword.put(opts, :supported, ["en", "pt-BR", "de", "fr"]))

    assert length(errors) == 2
    assert Enum.any?(errors, &(&1 =~ ~s|de "Save"|))
    assert Enum.any?(errors, &(&1 =~ ~s|fr "Save"|))
  end

  test "generated English fallback cannot disguise an empty original translation", %{opts: opts, po: po} do
    File.write!(po, String.replace(File.read!(po), "Salvar", ""))
    Catalog.extract_and_convert(opts)

    assert File.read!(Path.join(opts[:json_dir], "pt-BR.json")) =~ ~s|"Save": "Save"|
    assert [error] = Check.run(opts)
    assert error =~ ~s|pt-BR "Save"|
    assert error =~ "msgstr is blank"
  end

  test "identifies an unreadable catalog by locale and path", %{opts: opts, po: po} do
    File.write!(po, "invalid PO content")

    assert [error] = Check.run(opts)
    assert error =~ "pt-BR"
    assert error =~ po
  end

  defp write_catalog(po_root, locale, entries) do
    path = Path.join([po_root, locale, "LC_MESSAGES/messages.po"])
    File.mkdir_p!(Path.dirname(path))

    File.write!(path, """
    msgid ""
    msgstr ""
    "Language: #{locale}\\n"
    "Plural-Forms: nplurals=2; plural=(n != 1);\\n"

    #{entries}
    """)

    path
  end
end
