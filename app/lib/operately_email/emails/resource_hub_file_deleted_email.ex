defmodule OperatelyEmail.Emails.ResourceHubFileDeletedEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo
  alias Operately.ResourceHubs.File

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company

    {:ok, file} = File.get(:system, id: activity.content["file_id"], opts: [
      preload: [:node, :resource_hub, :space],
      with_deleted: true,
    ])

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: file.space.name, who: author, action: "deleted a file: #{file.node.name}")
    |> assign(:author, author)
    |> assign(:file, file)
    |> assign(:cta_url, OperatelyWeb.Paths.resource_hub_path(company, file.resource_hub) |> OperatelyWeb.Paths.to_url())
    |> render("resource_hub_file_deleted")
  end

  def buffered_item(_person, activity) do
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company

    {:ok, file} =
      File.get(:system, id: activity.content["file_id"], opts: [preload: [:node, :resource_hub, :space], with_deleted: true])

    %{
      parent_id: file.space.id,
      parent_type: :space,
      parent_name: file.space.name,
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
