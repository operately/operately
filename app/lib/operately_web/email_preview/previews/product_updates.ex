defmodule OperatelyWeb.EmailPreview.Previews.ProductUpdates do
  @moduledoc "Mock data for the product updates email preview."

  alias OperatelyEmail.Mailers.NotificationMailer, as: Mailer
  alias OperatelyWeb.EmailPreview.Preview

  @settings_url "#"

  def full_text_search do
    build_preview(%{
      title: "New: Full-text search",
      description: "Search across projects, tasks, documents, and discussions in one place.",
      cta_label: "Try full-text search",
      url: "#"
    })
  end

  def document_versioning do
    build_preview(%{
      title: "New: Document versioning",
      description: "See previous versions of a document and restore one when you need it.",
      cta_label: "View document versions",
      url: "#"
    })
  end

  def project_templates do
    build_preview(%{
      title: "New: Project templates",
      description: "Turn a proven project into a reusable template for your team.",
      cta_label: "Browse project templates",
      url: "#"
    })
  end

  defp build_preview(product_update) do
    %{name: "Acme Corporation"}
    |> Mailer.new()
    |> Mailer.from("Operately")
    |> Mailer.to(%{full_name: "Jordan Smith", email: "jordan@localhost.com"})
    |> Mailer.subject(product_update.title)
    |> Mailer.assign(:product_update, product_update)
    |> Mailer.assign(:settings_url, @settings_url)
    |> Preview.build("product_updates")
  end
end
