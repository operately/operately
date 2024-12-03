defmodule OperatelyEmail.Emails.ResourceHubFileCreatedEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo
  alias Operately.ResourceHubs.File

  def send(person, activity) do
    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company

    {:ok, file} = File.get(:system, id: activity.content["file_id"], opts: [
      preload: [resource_hub: :space],
    ])

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: file.resource_hub.name, who: author, action: "added a file: #{file.node.name}")
    |> assign(:author, author)
    |> assign(:file, file)
    |> assign(:cta_url, OperatelyWeb.Paths.file_path(company, file) |> OperatelyWeb.Paths.to_url())
    |> render("resource_hub_file_created")
  end
end
