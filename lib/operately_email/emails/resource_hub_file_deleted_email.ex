defmodule OperatelyEmail.Emails.ResourceHubFileDeletedEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo
  alias Operately.ResourceHubs.File

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company

    {:ok, file} = File.get(:system, id: activity.content["file_id"], opts: [
      preload: [:node, :resource_hub],
      with_deleted: true,
    ])

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: file.resource_hub.name, who: author, action: "deleted a file: #{file.node.name}")
    |> assign(:author, author)
    |> assign(:file, file)
    |> assign(:cta_url, OperatelyWeb.Paths.resource_hub_path(company, file.resource_hub) |> OperatelyWeb.Paths.to_url())
    |> render("resource_hub_file_deleted")
  end
end
