defmodule Operately.I18n.TranslationCheckTest do
  use ExUnit.Case, async: true

  alias Operately.I18n.{Po, TranslationCheck}

  defp check(source, translation) do
    TranslationCheck.validate(Po.parse(source), translation, "pt-BR")
  end

  test "accepts complete, identical, and obsolete translations" do
    source = "msgid \"KPI\"\nmsgstr \"\"\n"
    translation = "msgid \"KPI\"\nmsgstr \"KPI\"\n\n#~ msgid \"Old\"\n#~ msgstr \"\"\n"
    assert check(source, translation) == []
  end

  test "requires every message and context, including whitespace-only translations" do
    source = "msgctxt \"button\"\nmsgid \"Save\"\nmsgstr \"\"\n"
    assert [missing] = check(source, "msgid \"Save\"\nmsgstr \"Salvar\"\n")
    assert missing =~ "missing"
    assert missing =~ "button"
    assert [blank] = check(source, "msgctxt \"button\"\nmsgid \"Save\"\nmsgstr \"  \"\n")
    assert blank =~ "blank"
  end

  test "rejects fuzzy translations even when nonempty" do
    assert [error] = check("msgid \"Save\"\nmsgstr \"\"\n", "#, fuzzy\nmsgid \"Save\"\nmsgstr \"Salvar\"\n")
    assert error =~ "fuzzy"
  end

  test "requires every mapped plural form" do
    source = "msgid \"1 task\"\nmsgid_plural \"%{count} tasks\"\nmsgstr[0] \"\"\nmsgstr[1] \"\"\n"
    translation = "msgid \"1 task\"\nmsgid_plural \"%{count} tasks\"\nmsgstr[0] \"1 tarefa\"\n"
    assert [error] = check(source, translation)
    assert error =~ "msgstr[1]"
    assert check(source, translation <> "msgstr[1] \"%{count} tarefas\"\n") == []
  end

  test "requires a new translation when the plural source or shape changes" do
    source = ~s|msgid "1 task"\nmsgid_plural "%{count} tasks"\nmsgstr[0] ""\nmsgstr[1] ""\n|
    old_plural = ~s|msgid "1 task"\nmsgid_plural "Old tasks"\nmsgstr[0] "1 tarefa"\nmsgstr[1] "tarefas"\n|
    old_singular = ~s|msgid "1 task"\nmsgstr "1 tarefa"\n|

    assert [error] = check(source, old_plural)
    assert error =~ "plural source"
    assert [error] = check(source, old_singular)
    assert error =~ "singular/plural"
  end

  test "requires all plural forms used by the language" do
    source = ~s|msgid "1 task"\nmsgid_plural "%{count} tasks"\nmsgstr[0] ""\nmsgstr[1] ""\n|
    translation = ~s|msgid "1 task"\nmsgid_plural "%{count} tasks"\nmsgstr[0] "задача"\nmsgstr[1] "задачи"\n|

    assert [error] = TranslationCheck.validate(Po.parse(source), translation, "ru")
    assert error =~ "msgstr[2]"
  end

  test "technical exceptions are exact and cannot hide ordinary copy" do
    source = "msgid \"intlRelativeDateTime\"\nmsgstr \"\"\n"
    assert check(source, source) == []
    assert [_] = check("msgid \"Save\"\nmsgstr \"\"\n", "msgid \"Save\"\nmsgstr \"\"\n")
  end
end
