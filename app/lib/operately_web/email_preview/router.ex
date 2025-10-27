defmodule OperatelyWeb.EmailPreview.Router do
  @moduledoc """
  Handles routing and rendering for email preview requests.
  """

  import Plug.Conn

  alias OperatelyWeb.EmailPreview.Preview

  def call(conn, registry_module) do
    path_str = "/" <> Enum.join(conn.path_info, "/")

    case find_preview(path_str, registry_module) do
      {module, function} ->
        preview_result = apply(module, function, [])
        render(conn, preview_result, registry_module.__preview_registry__())

      nil when path_str in ["", "/"] ->
        render_empty(conn, registry_module.__preview_registry__())

      nil ->
        send_resp(conn, 404, "Not Found")
    end
  end

  defp find_preview(path, registry_module) do
    for group <- registry_module.__preview_registry__(),
        preview <- group.previews,
        preview.path == path do
      {preview.module, preview.function}
    end
    |> List.first()
  end

  defp render(conn, %Preview{email: email, template: template}, registry) do
    validate_email!(email)

    full_assigns = Map.put(email.assigns, :subject, email.subject)
    email_body = OperatelyEmail.Mailers.NotificationMailer.html(template, full_assigns)
    full_page = OperatelyWeb.EmailPreview.Sidebar.render(email_body, conn.request_path, registry)

    conn
    |> put_resp_header("content-type", "text/html")
    |> send_resp(200, full_page)
  end

  defp render_empty(conn, registry) do
    full_page = OperatelyWeb.EmailPreview.Sidebar.render("", conn.request_path, registry)

    conn
    |> put_resp_header("content-type", "text/html")
    |> send_resp(200, full_page)
  end

  defp validate_email!(email) do
    unless email.subject, do: raise("You must set a subject before rendering an email")
    unless email.from, do: raise("You must set a from before rendering an email")
    unless email.to, do: raise("You must set a to before rendering an email")
  end
end
