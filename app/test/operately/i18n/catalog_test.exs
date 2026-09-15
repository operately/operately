defmodule Operately.I18n.CatalogTest do
  use ExUnit.Case, async: true

  alias Operately.I18n.{Catalog, Locale}

  @elixir_fixture Path.expand("fixtures/elixir/sample.ex", __DIR__)
  @frontend_fixture Path.expand("fixtures/frontend/sample.tsx", __DIR__)
  @pt_br_fixture Path.expand("fixtures/locales/pt_BR/LC_MESSAGES/messages.po", __DIR__)

  setup do
    tmp = Path.join(System.tmp_dir!(), "operately-i18n-#{System.unique_integer([:positive])}")
    pot_path = Path.join(tmp, "messages.pot")
    json_dir = Path.join(tmp, "locales")
    po_root = Path.join(tmp, "gettext")
    po_path = Path.join(po_root, "pt_BR/LC_MESSAGES/messages.po")

    File.mkdir_p!(Path.dirname(po_path))
    File.cp!(@pt_br_fixture, po_path)

    on_exit(fn -> File.rm_rf(tmp) end)

    {:ok, tmp: tmp, pot_path: pot_path, json_dir: json_dir, po_root: po_root, po_path: po_path}
  end

  test "extracts elixir and frontend messages into one catalog without dropping either runtime", %{pot_path: pot_path, po_root: po_root} do
    opts = extract_opts(pot_path, po_root)
    messages = Catalog.extract(opts)
    msgids = Enum.map(messages, & &1.msgid)

    assert "Save" in msgids
    assert "Hello %{name}" in msgids
    assert "Click <link>here</link> to continue" in msgids
    assert "1 file" in msgids

    save = Enum.find(messages, &(&1.msgid == "Save"))
    assert Enum.any?(save.references, fn {path, _} -> String.ends_with?(path, "sample.ex") end)
    assert Enum.any?(save.references, fn {path, _} -> String.ends_with?(path, "sample.tsx") end)
    assert Enum.sort(save.extracted_comments) == ["elixir", "frontend"]
  end

  test "generation is deterministic", %{pot_path: pot_path, json_dir: json_dir, po_root: po_root} do
    opts = extract_opts(pot_path, po_root) ++ [json_dir: json_dir]

    Catalog.extract_and_convert(opts)
    first_pot = File.read!(pot_path)
    first_en = File.read!(Path.join(json_dir, "en.json"))
    first_pt = File.read!(Path.join(json_dir, "pt-BR.json"))

    Catalog.extract_and_convert(opts)

    assert File.read!(pot_path) == first_pot
    assert File.read!(Path.join(json_dir, "en.json")) == first_en
    assert File.read!(Path.join(json_dir, "pt-BR.json")) == first_pt
  end

  test "convert preserves context, placeholders, rich text, plurals, fallback, and locale mapping", %{
    pot_path: pot_path,
    json_dir: json_dir,
    po_root: po_root
  } do
    Catalog.extract_and_convert(extract_opts(pot_path, po_root) ++ [json_dir: json_dir])

    en = json(json_dir, "en.json")
    pt = json(json_dir, "pt-BR.json")

    assert en["Hello {{name}}"] == "Hello {{name}}"
    assert en["Close|button"] == "Close"
    assert en["1 task_one"] == "1 task"
    assert en["1 task_other"] == "{{count}} tasks"
    assert en["Click <link>here</link> to continue"] == "Click <link>here</link> to continue"

    assert pt["Hello {{name}}"] == "Olá {{name}}"
    assert pt["Close|button"] == "Fechar"
    assert pt["1 task_one"] == "1 tarefa"
    assert pt["1 task_other"] == "{{count}} tarefas"
    assert pt["Click <link>here</link> to continue"] == "Clique <link>aqui</link> para continuar"
    assert pt["Only in English"] == "Only in English"
    refute File.exists?(Path.join(json_dir, "pt_BR.json"))
  end

  test "extracting again does not overwrite reviewed translations", %{pot_path: pot_path, po_root: po_root, po_path: po_path} do
    Catalog.extract(extract_opts(pot_path, po_root))
    original = File.read!(po_path)

    Catalog.extract(extract_opts(pot_path, po_root))

    assert File.read!(po_path) =~ "msgstr \"Salvar\""
    assert File.read!(po_path) =~ "Clique <link>aqui</link> para continuar"
    assert File.read!(po_path) == original
  end

  test "maps gettext directory names to BCP 47 locale codes" do
    assert Locale.to_bcp47("pt_BR") == "pt-BR"
    assert Locale.to_gettext("pt-BR") == "pt_BR"
  end

  defp extract_opts(pot_path, po_root) do
    [
      elixir_files: [@elixir_fixture],
      frontend_files: [@frontend_fixture],
      pot_path: pot_path,
      po_root: po_root
    ]
  end

  defp json(json_dir, name) do
    json_dir
    |> Path.join(name)
    |> File.read!()
    |> Jason.decode!()
  end
end
