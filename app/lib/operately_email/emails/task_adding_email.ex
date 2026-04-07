defmodule OperatelyEmail.Emails.TaskAddingEmail do
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.Repo
  alias OperatelyWeb.Paths
  alias Operately.Tasks.Task

  def send(person, activity) do
    %{author: author = %{company: company}} = Repo.preload(activity, author: :company)

    {:ok, task} =
      Task.get(:system,
        id: activity.content["task_id"],
        opts: [preload: [:project, :space]]
      )

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: find_where_name(task), who: author, action: "added the task \"#{task.name}\"")
    |> assign(:author, author)
    |> assign(:task_name, task.name)
    |> assign(:cta_url, Paths.task_path(company, task) |> Paths.to_url())
    |> render("task_adding")
  end

  defp find_where_name(task) do
    case task do
        %{project: %{name: name}} -> name
        %{space: %{name: name}} -> name
        _ -> "Unknown"
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
      headline: "created the task \"#{task.name}\"",
      excerpt_html: nil,
      excerpt_text: nil,
      item_url: OperatelyWeb.Paths.task_path(company, task) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
