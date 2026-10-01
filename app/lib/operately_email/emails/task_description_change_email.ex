defmodule OperatelyEmail.Emails.TaskDescriptionChangeEmail do
  use Gettext, backend: OperatelyWeb.Gettext
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo
  alias OperatelyWeb.Paths
  alias Operately.Tasks.Task

  def send(person, activity) do
    %{author: author = %{company: company}} = Repo.preload(activity, author: :company)

    {:ok, task} =
      Task.get(:system, id: activity.content["task_id"], opts: [preload: [:project, :space]])

    mentioned = person.id in Operately.RichContent.find_mentioned_ids(activity.content["description"], :decode_ids)
    subject_text = subject_text(find_where_name(task), author, task, mentioned)

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(subject_text)
    |> assign(:author, author)
    |> assign(:mentioned, mentioned)
    |> assign(:task_name, task.name)
    |> assign(:description, decode_description(activity.content["description"]))
    |> assign(:cta_url, Paths.task_path(company, task) |> Paths.to_url())
    |> render("task_description_change")
  end

  defp subject_text(where, author, task, mentioned) do
    if mentioned do
      gettext("(%{where}) %{author} mentioned you in the description for \"%{task_name}\"", where: where, author: Operately.People.Person.short_name(author), task_name: task.name)
    else
      gettext("(%{where}) %{author} updated the description for \"%{task_name}\"", where: where, author: Operately.People.Person.short_name(author), task_name: task.name)
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
      _ -> gettext("Unknown")
    end
  end

  def buffered_item(_person, activity) do
    case Task.get(:system, id: activity.content["task_id"], opts: [preload: [:project, :space]]) do
      {:ok, task} -> build_buffered_item(activity, task)
      {:error, :not_found} -> :skip
    end
  end

  defp build_buffered_item(activity, task) do
    content = decode_description(activity.content["description"])
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company
    parent = OperatelyEmail.DigestParent.for_task(task)
    %{html: excerpt_html, text: excerpt_text} = OperatelyEmail.RichTextExcerpt.excerpt(content)

    %{
      parent_id: parent.id,
      parent_type: parent.type,
      parent_name: parent.name,
      headline: "updated the description of the task \"#{task.name}\"",
      excerpt_html: excerpt_html,
      excerpt_text: excerpt_text,
      item_url: OperatelyWeb.Paths.task_path(company, task) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
