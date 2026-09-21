defmodule Operately.I18n.PoTest do
  use ExUnit.Case, async: true

  alias Operately.I18n.{Converter, Message, Po}

  setup do
    path = Path.join(System.tmp_dir!(), "operately-po-#{System.unique_integer([:positive])}.po")
    on_exit(fn -> File.rm(path) end)
    {:ok, path: path}
  end

  test "plural messages become singular when their source changes", %{path: path} do
    Po.write!(path, [
      %Message{msgid: "Task", msgctxt: "label", msgid_plural: "Tasks", msgstr_plural: %{0 => "Tarefa", 1 => "Tarefas"}}
    ])

    Po.merge_file!(path, [%Message{msgid: "Task", msgctxt: "label"}])

    assert [%Expo.Message.Singular{msgstr: [""]}] = Expo.PO.parse_string!(File.read!(path)).messages
    assert Converter.from_po(File.read!(path), "pt_BR") == %{"Task|label" => "Task"}
  end

  test "singular translations are not reused for newly plural messages", %{path: path} do
    Po.write!(path, [%Message{msgid: "Task", msgstr: "Tarefa"}])

    Po.merge_file!(path, [%Message{msgid: "Task", msgid_plural: "Tasks"}])

    assert [%Expo.Message.Plural{msgstr: %{0 => [""], 1 => [""]}}] = Expo.PO.parse_string!(File.read!(path)).messages
    assert Converter.from_po(File.read!(path), "pt_BR") == %{}
  end

  test "changed plural text does not reuse translations of the previous plural", %{path: path} do
    Po.write!(path, [
      %Message{msgid: "Task", msgid_plural: "Tasks", msgstr_plural: %{0 => "Tarefa", 1 => "Tarefas"}}
    ])

    Po.merge_file!(path, [%Message{msgid: "Task", msgid_plural: "%{count} tasks remaining"}])

    assert Converter.from_po(File.read!(path), "pt_BR") == %{}
  end

  test "unchanged plural messages retain all reviewed translations", %{path: path} do
    translations = %{0 => "%{count} яблоко", 1 => "%{count} яблока", 2 => "%{count} яблок"}
    source = %Message{msgid: "1 apple", msgid_plural: "%{count} apples"}
    Po.write!(path, [%{source | msgstr_plural: translations}])

    Po.merge_file!(path, [source])

    assert [message] = Po.parse_file!(path)
    assert message.msgstr_plural == translations
  end

  test "merging preserves translator metadata through removal and restoration", %{path: path} do

    File.write!(path, """
    # Translator guidance
    #, fuzzy
    msgctxt "button"
    msgid "Close"
    msgstr "Fechar"
    """)

    Po.merge_file!(path, [])
    [obsolete] = Expo.PO.parse_string!(File.read!(path)).messages
    assert obsolete.obsolete
    assert obsolete.comments == [" Translator guidance"]
    assert Expo.Message.has_flag?(obsolete, "fuzzy")
    assert Po.parse_file!(path) == []

    first = File.read!(path)
    Po.merge_file!(path, [])
    assert File.read!(path) == first

    Po.merge_file!(path, [%Message{msgid: "Close", msgctxt: "button", references: [{"new.ex", 5}]}])
    [restored] = Expo.PO.parse_string!(File.read!(path)).messages
    refute restored.obsolete
    assert restored.msgstr == ["Fechar"]
    assert restored.comments == obsolete.comments
    assert restored.flags == obsolete.flags
    assert List.flatten(restored.references) == [{"new.ex", 5}]
  end
end
