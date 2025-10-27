defmodule OperatelyWeb.EmailPreview do
  @moduledoc """
  Development email preview plug for viewing rendered emails in the browser.
  Only available in development environment.
  """

  defmodule Preview do
    @moduledoc """
    Wrapper struct that carries the prepared email and the template name.
    """

    @enforce_keys [:email, :template]
    defstruct [:email, :template]
  end

  use Plug.Router
  alias OperatelyWeb.EmailPreview

  plug :match
  plug :dispatch

  @preview_registry [
    %{
      category: "Assignments",
      previews: [
        %{path: "/assignments/single", label: "Single Item", module: EmailPreview.AssignmentsV2, function: :single},
        %{path: "/assignments/simple", label: "Simple", module: EmailPreview.AssignmentsV2, function: :simple},
        %{path: "/assignments/complete", label: "Complete", module: EmailPreview.AssignmentsV2, function: :complete}
      ]
    }
  ]

  get "/assignments/single" do
    conn
    |> render_preview(EmailPreview.AssignmentsV2.single())
  end

  get "/assignments/simple" do
    conn
    |> render_preview(EmailPreview.AssignmentsV2.simple())
  end

  get "/assignments/complete" do
    conn
    |> render_preview(EmailPreview.AssignmentsV2.complete())
  end

  match _ do
    send_resp(conn, 404, "Not Found")
  end

  defp render_preview(conn, %Preview{email: email, template: template}) do
    unless email.subject, do: raise("You must set a subject before rendering an email")
    unless email.from, do: raise("You must set a from before rendering an email")
    unless email.to, do: raise("You must set a to before rendering an email")

    full_assigns = Map.put(email.assigns, :subject, email.subject)

    email_body = OperatelyEmail.Mailers.NotificationMailer.html(template, full_assigns)
    full_page = EmailPreview.Sidebar.render(email_body, conn.request_path, @preview_registry)

    conn
    |> put_resp_header("content-type", "text/html")
    |> send_resp(200, full_page)
  end
end
