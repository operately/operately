defmodule OperatelyEmail.Emails.TaskDueDateUpdatingEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo
  alias OperatelyWeb.Paths
  alias Operately.Tasks.Task

  def send(person, activity) do
    %{author: author = %{company: company}} = Repo.preload(activity, author: :company)

    {:ok, task} = Task.get(:system, id: activity.content["task_id"], opts: [
      preload: [:project, :space]
    ])
    previous_date = get_date_value(activity.content["old_due_date"])
    new_date = get_date_value(activity.content["new_due_date"])

    where = get_location(task)

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: where, who: author, action: "changed the due date for \"#{task.name}\"")
    |> assign(:author, author)
    |> assign(:name, task.name)
    |> assign(:previous_date, previous_date)
    |> assign(:new_date, new_date)
    |> assign(:cta_url, Paths.task_path(company, task) |> Paths.to_url())
    |> render("task_due_date_updating")
  end

  defp get_date_value(nil), do: nil
  defp get_date_value(date), do: date.value

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
    parent = OperatelyEmail.DigestParent.for_task(task)

    %{
      parent_id: parent.id,
      parent_type: parent.type,
      parent_name: parent.name,
      headline: "updated the due date of the task \"#{task.name}\"",
      excerpt_html: nil,
      excerpt_text: nil,
      item_url: OperatelyWeb.Paths.task_path(company, task) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
