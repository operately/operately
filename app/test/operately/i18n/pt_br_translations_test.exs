defmodule Operately.I18n.PtBrTranslationsTest do
  use ExUnit.Case, async: false

  @backend OperatelyWeb.Gettext

  setup do
    previous = Gettext.get_locale(@backend)
    Gettext.put_locale(@backend, "en")
    on_exit(fn -> Gettext.put_locale(@backend, previous) end)
    :ok
  end

  test "returns reviewed Portuguese translations for the pilot workflow" do
    Gettext.with_locale(@backend, "pt_BR", fn ->
      assert dgettext("Home") == "Início"
      assert dgettext("View Task") == "Ver tarefa"
      assert dgettext("Comments & Activity") == "Comentários & Atividade"
      assert dgettext("Docs & Files") == "Docs & Arquivos"
      assert dgettext("Due date") == "Data de conclusão"
      assert dgettext("Relative due date") == "Data de conclusão relativa"
      assert dgettext("Set due date") == "Definir data de conclusão"
      assert dgettext("Set relative date") == "Definir data de conclusão relativa"
      assert dgettext("Template") == "Template"
      assert dgettext("Project Templates") == "Templates de projeto"

      assert dgettext("A new task named %{task_name} was created in this project.", %{task_name: "Call leads"}) == "Uma nova tarefa chamada Call leads foi criada neste projeto."

      assert dngettext("You have 1 new update", "You have %{count} new updates", 1) == "Você tem 1 nova atualização"
      assert dngettext("You have 1 new update", "You have %{count} new updates", 2) == "Você tem 2 novas atualizações"
      assert dpgettext("navigation", "Company") == "Empresa"
    end)
  end

  test "falls back to English for missing translations" do
    Gettext.with_locale(@backend, "pt_BR", fn ->
      assert dgettext("Not a cataloged message") == "Not a cataloged message"
    end)
  end

  defp dgettext(msgid, bindings \\ %{}) do
    Gettext.dgettext(@backend, "messages", msgid, bindings)
  end

  defp dngettext(msgid, msgid_plural, count) do
    Gettext.dngettext(@backend, "messages", msgid, msgid_plural, count)
  end

  defp dpgettext(msgctxt, msgid) do
    Gettext.dpgettext(@backend, "messages", msgctxt, msgid)
  end
end
