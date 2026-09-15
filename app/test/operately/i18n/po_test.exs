defmodule Operately.I18n.PoTest do
  use ExUnit.Case, async: true

  alias Operately.I18n.{Message, Po}

  test "merging preserves translator metadata through removal and restoration" do
    path = Path.join(System.tmp_dir!(), "operately-po-#{System.unique_integer([:positive])}.po")
    on_exit(fn -> File.rm(path) end)

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
