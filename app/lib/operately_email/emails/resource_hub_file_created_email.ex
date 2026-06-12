defmodule OperatelyEmail.Emails.ResourceHubFileCreatedEmail do
  alias Operately.Repo
  alias OperatelyEmail.Emails.ResourceHubEmail
  alias OperatelyWeb.Paths

  def send(person, activity) do
    import OperatelyEmail.Mailers.ActivityMailer

    author = Repo.preload(activity, :author).author
    company = Repo.preload(author, :company).company
    files = get_files(activity)

    first_file = hd(files)
    parent = ResourceHubEmail.parent(first_file)
    action = find_action(files)

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: parent.name, who: author, action: action)
    |> assign(:action, action)
    |> assign(:author, author)
    |> assign(:files, files)
    |> assign(:file_url, OperatelyWeb.Paths.file_path(company, first_file) |> OperatelyWeb.Paths.to_url())
    |> assign(:cta_url, resource_hub_or_folder_path(company, first_file) |> OperatelyWeb.Paths.to_url())
    |> render("resource_hub_file_created")
  end

  defp get_files(activity) do
    file_ids = Enum.map(activity.content["files"], &(&1["file_id"]))
    ResourceHubEmail.load_files(file_ids)
  end

  defp resource_hub_or_folder_path(company, file) do
    if file.node.parent_folder_id do
      Paths.folder_path(company, file.node.parent_folder)
    else
      Paths.resource_hub_path(company, file.resource_hub)
    end
  end

  defp find_action(files) when length(files) == 1 do
    "uploaded the file \"#{hd(files).node.name}\""
  end

  defp find_action(files) do
    "uploaded #{length(files)} files"
  end

  def buffered_item(_person, activity) do
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company
    files = get_files(activity)
    first_file = hd(files)
    parent = ResourceHubEmail.parent(first_file)
    action = find_action(files)

    %{
      parent_id: parent.id,
      parent_type: parent.type,
      parent_name: parent.name,
      headline: action,
      excerpt_html: nil,
      excerpt_text: nil,
      item_url: resource_hub_or_folder_path(company, first_file) |> Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
