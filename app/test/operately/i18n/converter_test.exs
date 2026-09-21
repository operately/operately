defmodule Operately.I18n.ConverterTest do
  use ExUnit.Case, async: true

  alias Operately.I18n.Converter

  @untranslated_tasks """
  msgctxt "inbox"
  msgid "1 task"
  msgid_plural "%{count} tasks"
  msgstr[0] ""
  msgstr[1] ""
  """

  test "untranslated Portuguese plurals fall back using English plural rules" do
    assert render_task_counts(@untranslated_tasks, "pt-BR", [0, 0.5, 1, 1.5, 2, 1_000_000]) ==
             ["0 tasks", "0.5 tasks", "1 task", "1.5 tasks", "2 tasks", "1000000 tasks"]
  end

  test "missing Portuguese singular translations fall back while translated plurals remain available" do
    po = """
    msgctxt "inbox"
    msgid "1 task"
    msgid_plural "%{count} tasks"
    msgstr[0] ""
    msgstr[1] "%{count} tarefas"
    """

    assert render_task_counts(po, "pt-BR", [0, 0.5, 1, 2, 1_000_000]) ==
             ["0 tasks", "0.5 tasks", "1 task", "2 tarefas", "1000000 tarefas"]
  end

  test "missing Russian plural translations use English rules for counts ending in one" do
    po = """
    msgctxt "inbox"
    msgid "1 task"
    msgid_plural "%{count} tasks"
    msgstr[0] ""
    msgstr[1] "%{count} задачи"
    msgstr[2] "%{count} задач"
    """

    assert render_task_counts(po, "ru", [1, 2, 5, 21]) ==
             ["1 task", "2 задачи", "5 задач", "21 tasks"]
  end

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
             "1 apple_many" => "{{count}} яблок",
             "1 apple_other" => "{{count}} яблок"
           }
  end

  test "uses the Russian plural translation for fractional counts in i18next" do
    po = """
    msgid "1 apple"
    msgid_plural "%{count} apples"
    msgstr[0] "%{count} яблоко"
    msgstr[1] "%{count} яблока"
    msgstr[2] "%{count} яблок"
    """

    translations = Converter.from_po(po, "ru")

    script = """
    const i18next = require('i18next').createInstance();
    i18next.init({lng: 'ru', fallbackLng: 'en', resources: {
      ru: {translation: JSON.parse(process.argv[1])},
      en: {translation: {'1 apple_other': '{{count}} apples'}}
    }});
    process.stdout.write(JSON.stringify([1, 2, 5, 1.5].map(count => i18next.t('1 apple', {count}))));
    """

    {output, 0} = System.cmd("node", ["-e", script, Jason.encode!(translations)], cd: Path.expand("../../..", __DIR__))

    assert Jason.decode!(output) == ["1 яблоко", "2 яблока", "5 яблок", "1.5 яблок"]
  end

  defp render_task_counts(po, locale, counts) do
    resources = %{
      locale => %{translation: Converter.from_po(po, locale)},
      "en" => %{translation: Converter.from_pot(@untranslated_tasks)}
    }

    script = """
    const i18next = require('i18next').createInstance();
    const {locale, counts, resources} = JSON.parse(process.argv[1]);
    i18next.init({lng: locale, fallbackLng: 'en', contextSeparator: '|', resources});
    process.stdout.write(JSON.stringify(counts.map(count => i18next.t('1 task', {count, context: 'inbox'}))));
    """

    input = Jason.encode!(%{locale: locale, counts: counts, resources: resources})
    {output, 0} = System.cmd("node", ["-e", script, input], cd: Path.expand("../../..", __DIR__))

    Jason.decode!(output)
  end
end
