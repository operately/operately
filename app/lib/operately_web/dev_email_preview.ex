defmodule OperatelyWeb.DevEmailPreview do
  @moduledoc """
  Development email preview plug for viewing rendered emails in the browser.
  Only available in development environment.
  """

  alias OperatelyEmail.Mailers.NotificationMailer, as: Mailer

  use Plug.Router

  plug :match
  plug :dispatch

  get "/assignments/simple" do
    company = %{
      name: "Acme"
    }

    person = %{
      full_name: "John Kipson",
      email: "john@localhost.com"
    }

    email =
      company
      |> Mailer.new()
      |> Mailer.from("Operately")
      |> Mailer.to(person)
      |> Mailer.subject("Ame: Your assignments for today")
      |> Mailer.assign(:company, company)
      |> Mailer.assign(:urgent_groups, [])
      |> render(conn, "assignments_v2")
  end

  match _ do
    send_resp(conn, 404, "Not Found")
  end

  defp render(email, conn, template) do
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
