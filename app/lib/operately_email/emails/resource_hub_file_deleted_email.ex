defmodule OperatelyEmail.Emails.ResourceHubFileDeletedEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias OperatelyEmail.Emails.ResourceHubEmail
  alias Operately.Repo

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company

    file = ResourceHubEmail.load_file(activity.content["file_id"], with_deleted: true)
    parent = ResourceHubEmail.parent(file)

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: parent.name, who: author, action: "deleted a file: #{file.node.name}")
    |> assign(:author, author)
    |> assign(:file, file)
    |> assign(:cta_url, OperatelyWeb.Paths.resource_hub_path(company, file.resource_hub) |> OperatelyWeb.Paths.to_url())
    |> render("resource_hub_file_deleted")
  end

  def buffered_item(_person, activity) do
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company

    file = ResourceHubEmail.load_file(activity.content["file_id"], with_deleted: true)
    parent = ResourceHubEmail.parent(file)

    %{
      parent_id: parent.id,
      parent_type: parent.type,
      parent_name: parent.name,
      headline: "deleted the file \"#{file.node.name}\"",
      excerpt_html: nil,
      excerpt_text: nil,
      item_url: OperatelyWeb.Paths.resource_hub_path(company, file.resource_hub) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
