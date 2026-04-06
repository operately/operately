defmodule OperatelyEmail.Emails.TaskMovingEmail do
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
    |> subject(where: destination_name(task), who: author, action: "moved the task \"#{task.name}\"")
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
    task = Operately.Tasks.get_task!(activity.content["task_id"]) |> Operately.Repo.preload(:space)
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company

    %{
      parent_id: task.id,
      parent_type: :task,
      parent_name: task.name,
      headline: "moved this task",
      excerpt_html: nil,
      excerpt_text: nil,
      item_url: OperatelyWeb.Paths.task_path(company, task) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
