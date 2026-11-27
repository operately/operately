defmodule Operately.I18n.RuTranslationsTest do
  use ExUnit.Case, async: true

  alias Operately.I18n.Po

  @backend OperatelyWeb.Gettext

  test "renders glossary terms and Russian plurals through Gettext" do
    Gettext.with_locale(@backend, "ru", fn ->
      for {source, translation} <- [
            {"Space", "Пространство"},
            {"Due date", "Срок выполнения"},
            {"Retrospective", "Итоги"},
            {"Acknowledge", "Подтвердить прочтение"},
            {"Start", "Начальное значение"},
            {"Target", "Целевое значение"},
            {"Champion", "Ответственный"},
            {"Reviewer", "Куратор"}
          ] do
        assert Gettext.dgettext(@backend, "messages", source) == translation
      end

      for {count, ending} <- [
            {0, "обновлений"},
            {1, "обновление"},
            {2, "обновления"},
            {5, "обновлений"},
            {11, "обновлений"},
            {21, "обновление"},
            {22, "обновления"},
            {25, "обновлений"},
            {101, "обновление"},
            {111, "обновлений"},
            {1_000_000, "обновлений"}
          ] do
        assert Gettext.dngettext(@backend, "messages", "%{count} update in %{place}", "%{count} updates in %{place}", count, place: "Launch") == "#{count} #{ending} в «Launch»"
      end

      assert Gettext.dgettext(@backend, "messages", "Not a cataloged message") == "Not a cataloged message"
    end)
  end

  test "description email subjects identify projects and milestones correctly" do
    Gettext.with_locale(@backend, "ru", fn ->
      bindings = [where: "Marketing", author: "Alex", project_name: "Launch", milestone_title: "Launch"]

      for {source, translation} <- [
            {"(%{where}) %{author} mentioned you in the description for \"%{project_name}\"", "(Marketing) Alex: вы упомянуты в описании проекта «Launch»"},
            {"(%{where}) %{author} updated the description for \"%{project_name}\"", "(Marketing) Alex: обновлено описание проекта «Launch»"},
            {"(%{where}) %{author} mentioned you in the description for \"%{milestone_title}\"", "(Marketing) Alex: вы упомянуты в описании вехи «Launch»"},
            {"(%{where}) %{author} updated the description for \"%{milestone_title}\"", "(Marketing) Alex: обновлено описание вехи «Launch»"}
          ] do
        assert Gettext.dgettext(@backend, "messages", source, bindings) == translation
      end
    end)
  end

  test "shared due-date email messages do not assume a task" do
    Gettext.with_locale(@backend, "ru", fn ->
      for {source, translation} <- [
            {"%{author} changed the due date for %{name}", "Alex: изменён срок выполнения «Launch»"},
            {"%{author} changed the due date for %{name}.", "Alex: изменён срок выполнения «Launch»."},
            {"%{author} removed the due date for %{name}", "Alex: удалён срок выполнения «Launch»"}
          ] do
        assert Gettext.dgettext(@backend, "messages", source, author: "Alex", name: "Launch") == translation
      end
    end)
  end

  test "every Russian translation preserves interpolation bindings and rich-text tags" do
    messages = Po.parse_file!(Path.expand("../../../priv/gettext/ru/LC_MESSAGES/messages.po", __DIR__))

    for message <- messages do
      forms =
        if message.msgid_plural do
          # Russian singular also covers 21 and 101, so every form retains the count binding.
          for index <- 0..3, do: {message.msgid_plural, message.msgstr_plural[index]}
        else
          [{message.msgid, message.msgstr}]
        end

      for {source, translation} <- forms do
        assert is_binary(translation) and translation != "", "Missing translation: #{source}"
        assert tokens(source) == tokens(translation), "Changed placeholders or tags: #{source}"
      end
    end
  end

  defp tokens(text) do
    Regex.scan(~r/%\{[^}]+\}|<\/?[A-Za-z][A-Za-z0-9]*\s*\/?>/, text) |> Enum.sort()
  end
end
