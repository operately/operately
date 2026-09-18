defmodule Operately.I18n.Fixtures.Elixir.Sample do
  use Gettext, backend: OperatelyWeb.Gettext

  def save, do: gettext("Save")

  def greeting(name), do: gettext("Hello %{name}", name: name)

  def tasks(count), do: ngettext("1 task", "%{count} tasks", count)

  def close, do: pgettext("button", "Close")

  def files(count), do: npgettext("inbox", "1 file", "%{count} files", count)
end
