defmodule OperatelyEmail.Emails.TaskDescriptionChangeEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo
  alias OperatelyWeb.Paths
  alias Operately.Tasks.Task

  def send(person, activity) do
    %{author: author = %{company: company}} = Repo.preload(activity, author: :company)

    {:ok, task} =
      Task.get(:system, id: activity.content["task_id"], opts: [preload: [:project, :space]])

    action = get_action(person, activity, task)

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: find_where_name(task), who: author, action: action)
    |> assign(:author, author)
    |> assign(:task_name, task.name)
    |> assign(:description, decode_description(activity.content["description"]))
    |> assign(:cta_url, Paths.task_path(company, task) |> Paths.to_url())
    |> render("task_description_change")
  end

  defp get_action(person, activity, task) do
    mentioned_ids = Operately.RichContent.find_mentioned_ids(activity.content["description"], :decode_ids)

    if person.id in mentioned_ids do
      "mentioned you in the description for \"#{task.name}\""
    else
      "updated the description for \"#{task.name}\""
    end
  end

  defp decode_description(nil), do: nil

  defp decode_description(description) when is_binary(description) do
    case Jason.decode(description) do
      {:ok, decoded} -> decoded
      _ -> nil
    end
  end

  defp decode_description(description) when is_map(description), do: description
  defp decode_description(_), do: nil

  defp find_where_name(task) do
    case task do
      %{project: %{name: name}} -> name
      %{space: %{name: name}} -> name
      _ -> "Unknown"
    end
  end

  def buffered_item(_person, activity) do
    task = Operately.Tasks.get_task!(activity.content["task_id"]) |> Operately.Repo.preload(:space)
    content = decode_description(activity.content["description"])
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company
    %{html: excerpt_html, text: excerpt_text} = OperatelyEmail.RichTextExcerpt.excerpt(content)

    %{
      parent_id: task.id,
      parent_type: :task,
      parent_name: task.name,
      headline: "updated this task description",
      excerpt_html: excerpt_html,
      excerpt_text: excerpt_text,
      item_url: OperatelyWeb.Paths.task_path(company, task) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
