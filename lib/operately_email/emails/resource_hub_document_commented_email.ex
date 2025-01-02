defmodule OperatelyEmail.Emails.ResourceHubDocumentCommentedEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias OperatelyWeb.Paths
  alias Operately.{Repo, Updates}
  alias Operately.ResourceHubs.Document

  def send(person, activity) do
    %{author: author = %{company: company}} = Repo.preload(activity, author: :company)
    {:ok, document} = Document.get(:system, id: activity.content["document_id"], opts: [
      preload: [:node, :space]
    ])
    comment = Updates.get_comment!(activity.content["comment_id"])

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: document.space.name, who: author, action: "commented on: #{document.node.name}")
    |> assign(:author, author)
    |> assign(:comment, comment)
    |> assign(:name, document.node.name)
    |> assign(:cta_url, Paths.document_path(company, document, comment) |> Paths.to_url())
    |> render("resource_hub_document_commented")
  end
end
