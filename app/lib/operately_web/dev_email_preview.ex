defmodule OperatelyWeb.DevEmailPreview do
  @moduledoc """
  Development email preview plug for viewing rendered emails in the browser.
  Only available in development environment.
  """

  alias OperatelyEmail.Mailers.NotificationMailer, as: Mailer
  alias OperatelyWeb.EmailPreviews.AssignmentsV2
  alias OperatelyWeb.EmailPreviews.Preview

  use Plug.Router

  plug :match
  plug :dispatch

  get "/assignments/simple" do
    conn
    |> render_preview(AssignmentsV2.simple())
  end

  get "/assignments/complete" do
    conn
    |> render_preview(AssignmentsV2.complete())
  end

  match _ do
    send_resp(conn, 404, "Not Found")
  end

  defp render_preview(conn, %Preview{email: email, template: template}) do
    unless email.subject, do: raise("You must set a subject before rendering an email")
    unless email.from, do: raise("You must set a from before rendering an email")
    unless email.to, do: raise("You must set a to before rendering an email")

    full_assigns = Map.put(email.assigns, :subject, email.subject)

    body = Mailer.html(template, full_assigns)

    conn
    |> put_resp_header("content-type", "text/html")
    |> send_resp(200, body)
  end
end
