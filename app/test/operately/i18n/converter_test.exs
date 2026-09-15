defmodule Operately.I18n.ConverterTest do
  use ExUnit.Case, async: true

  alias Operately.I18n.Converter

  test "converts English source catalog placeholders, context, plurals, and rich text" do
    pot = """
    msgid "Hello %{name}"
    msgstr ""

    msgctxt "button"
    msgid "Close"
    msgstr ""

    msgid "1 task"
    msgid_plural "%{count} tasks"
    msgstr[0] ""
    msgstr[1] ""

    msgid "Click <link>here</link> to continue"
    msgstr ""
    """

    assert Converter.from_pot(pot) == %{
             "Hello {{name}}" => "Hello {{name}}",
             "Close|button" => "Close",
             "1 task_one" => "1 task",
             "1 task_other" => "{{count}} tasks",
             "Click <link>here</link> to continue" => "Click <link>here</link> to continue"
           }
  end

  test "converts PO translations, falls back to English, and maps locale plural rules" do
    po = """
    msgid "Hello %{name}"
    msgstr "Olá %{name}"

    msgid "Only in English"
    msgstr ""

    msgid "1 task"
    msgid_plural "%{count} tasks"
    msgstr[0] "1 tarefa"
    msgstr[1] "%{count} tarefas"
    """

    assert Converter.from_po(po, "pt_BR") == %{
             "Hello {{name}}" => "Olá {{name}}",
             "Only in English" => "Only in English",
             "1 task_one" => "1 tarefa",
             "1 task_other" => "{{count}} tarefas"
           }
  end

  test "maps Russian plural forms onto i18next categories" do
    po = """
    msgid "1 apple"
    msgid_plural "%{count} apples"
    msgstr[0] "%{count} яблоко"
    msgstr[1] "%{count} яблока"
    msgstr[2] "%{count} яблок"
    """

    assert Converter.from_po(po, "ru") == %{
             "1 apple_one" => "{{count}} яблоко",
             "1 apple_few" => "{{count}} яблока",
             "1 apple_many" => "{{count}} яблок"
           }
  end
end
