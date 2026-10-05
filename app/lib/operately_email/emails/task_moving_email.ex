defmodule OperatelyEmail.Emails.TaskMovingEmail do
  use Gettext, backend: OperatelyWeb.Gettext
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo
  alias Operately.Tasks.Task
  alias OperatelyWeb.Paths

  def send(person, activity) do
    %{author: author = %{company: company}} = Repo.preload(activity, author: :company)

    {:ok, task} =
      Task.get(:system, id: activity.content["task_id"], opts: [preload: [:project, :space]])

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(
      gettext(
        "(%{destination_name_task}) %{author} moved the task \"%{task_name}\"",
        destination_name_task: destination_name(task),
        author: Operately.People.Person.short_name(author),
        task_name: task.name
      )
    )
    |> assign(:author, author)
    |> assign(:task_name, task.name)
    |> assign(:destination_name, destination_name(task))
    |> assign(:cta_url, Paths.task_path(company, task) |> Paths.to_url())
    |> render("task_moving")
  end

  defp destination_name(task) do
    case Task.task_type(task) do
      "space" -> task.space.name
      "project" -> task.project.name
    end
  end

  def buffered_item(_person, activity) do
    case Task.get(:system, id: activity.content["task_id"], opts: [preload: [:project, :space]]) do
      {:ok, task} -> build_buffered_item(activity, task)
      {:error, :not_found} -> :skip
    end
  end

  defp build_buffered_item(activity, task) do
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company
    parent = OperatelyEmail.DigestParent.for_task(task)

    %{
      parent_id: parent.id,
      parent_type: parent.type,
      parent_name: parent.name,
      headline: gettext("moved the task \"%{task_name}\"", task_name: task.name),
      excerpt_html: nil,
      excerpt_text: nil,
      item_url: OperatelyWeb.Paths.task_path(company, task) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
