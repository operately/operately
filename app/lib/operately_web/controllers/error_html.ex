defmodule OperatelyWeb.ErrorHTML do
  use OperatelyWeb, :html
  use Gettext, backend: OperatelyWeb.Gettext

  def render("400.html", _assigns), do: gettext("Bad Request")
  def render("401.html", _assigns), do: gettext("Unauthorized")
  def render("403.html", _assigns), do: gettext("Forbidden")
  def render("404.html", _assigns), do: gettext("Not Found")
  def render("500.html", _assigns), do: gettext("Internal Server Error")
  def render(template, _assigns), do: Phoenix.Controller.status_message_from_template(template)
end
