defmodule OperatelyEmail.Emails.TaskAssigneeUpdatingEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo
  alias OperatelyWeb.Paths
  alias Operately.Tasks.Task
  alias Operately.People.Person

  def send(person, activity) do
    %{author: author = %{company: company}} = Repo.preload(activity, author: :company)

    {:ok, task} = Task.get(:system, id: activity.content["task_id"], opts: [
      preload: [:project, :space]
    ])
    old_assignee = get_person(activity.content["old_assignee_id"])
    new_assignee = get_person(activity.content["new_assignee_id"])

    where = get_location(task)

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: where, who: author, action: "changed the assignee for #{task.name}")
    |> assign(:author, author)
    |> assign(:name, task.name)
    |> assign(:old_assignee, old_assignee)
    |> assign(:new_assignee, new_assignee)
    |> assign(:cta_url, Paths.task_path(company, task) |> Paths.to_url())
    |> render("task_assignee_updating")
  end

  defp get_person(nil), do: nil
  defp get_person(id) do
    case Person.get(:system, id: id) do
      {:ok, person} -> person
      {:error, _} -> nil
    end
  end

  defp get_location(task) do
    cond do
      task.project != nil -> task.project.name
      task.space != nil -> task.space.name
      true -> ""
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
      headline: "updated this task assignee",
      excerpt_html: nil,
      excerpt_text: nil,
      item_url: OperatelyWeb.Paths.task_path(company, task) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
