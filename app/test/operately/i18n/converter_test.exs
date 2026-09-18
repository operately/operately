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
             "1 task_many" => "{{count}} tarefas",
             "1 task_other" => "{{count}} tarefas"
           }
  end

  test "uses the Portuguese plural translation for whole millions in i18next" do
    po = """
    msgid "1 task"
    msgid_plural "%{count} tasks"
    msgstr[0] "1 tarefa"
    msgstr[1] "%{count} tarefas"
    """

    translations = Converter.from_po(po, "pt_BR")

    script = """
    const i18next = require('i18next').createInstance();
    i18next.init({lng: 'pt-BR', fallbackLng: 'en', resources: {
      'pt-BR': {translation: JSON.parse(process.argv[1])},
      en: {translation: {'1 task_other': '{{count}} tasks'}}
    }});
    process.stdout.write(JSON.stringify([1, 2, 1000000, 2000000].map(count => i18next.t('1 task', {count}))));
    """

    {output, 0} = System.cmd("node", ["-e", script, Jason.encode!(translations)], cd: Path.expand("../../..", __DIR__))

    assert Jason.decode!(output) == ["1 tarefa", "2 tarefas", "1000000 tarefas", "2000000 tarefas"]
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
