defmodule OperatelyWeb.ErrorHTML do
  use OperatelyWeb, :html
  use Gettext, backend: OperatelyWeb.Gettext

  embed_templates "error_html/*"

  def render("400.html", _assigns), do: gettext("Bad Request")
  def render("401.html", _assigns), do: gettext("Unauthorized")
  def render("403.html", _assigns), do: gettext("Forbidden")
  def render("404.html", _assigns), do: gettext("Not Found")
  def render("500.html", _assigns), do: gettext("Internal Server Error")

  def render("503.html", _assigns) do
    service_unavailable(%{locale: Operately.I18n.Locale.to_bcp47(Gettext.get_locale(OperatelyWeb.Gettext))})
  end

  def render(template, _assigns), do: Phoenix.Controller.status_message_from_template(template)
end
