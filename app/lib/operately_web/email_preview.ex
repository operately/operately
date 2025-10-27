defmodule OperatelyWeb.EmailPreview do
  @moduledoc """
  Development email preview plug for viewing rendered emails in the browser.
  Only available in development environment.
  """

  defmodule Preview do
    @enforce_keys [:email, :template]
    defstruct [:email, :template]
  end

  use Plug.Router
  use OperatelyWeb.EmailPreview.Registry

  plug :match
  plug :dispatch

  group "assignments", module: AssignmentsV2 do
    preview :single, label: "Single Item"
    preview :simple
    preview :complete
  end

  # Single dynamic route handler that looks up previews from the registry
  get "/*path" do
    path_str = "/" <> Enum.join(path, "/")

    case find_preview(path_str) do
      {module, function} ->
        conn
        |> render_preview(apply(module, function, []))

      nil ->
        send_resp(conn, 404, "Not Found")
    end
  end

  match _ do
    send_resp(conn, 404, "Not Found")
  end

  defp find_preview(path) do
    Enum.find_value(@preview_registry, fn email ->
      Enum.find_value(email.previews, fn preview ->
        if preview.path == path do
          {preview.module, preview.function}
        end
      end)
    end)
  end

  defp render_preview(conn, %__MODULE__.Preview{email: email, template: template}) do
    unless email.subject, do: raise("You must set a subject before rendering an email")
    unless email.from, do: raise("You must set a from before rendering an email")
    unless email.to, do: raise("You must set a to before rendering an email")

    full_assigns = Map.put(email.assigns, :subject, email.subject)

    email_body = OperatelyEmail.Mailers.NotificationMailer.html(template, full_assigns)
    full_page = OperatelyWeb.EmailPreview.Sidebar.render(email_body, conn.request_path, @preview_registry)

    conn
    |> put_resp_header("content-type", "text/html")
    |> send_resp(200, full_page)
  end
end
