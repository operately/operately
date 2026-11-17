defmodule OperatelyEmail.Emails.ProjectTaskCommentedEmail do
  use Gettext, backend: OperatelyWeb.Gettext
  import OperatelyEmail.Mailers.ActivityMailer

  alias OperatelyWeb.Paths
  alias Operately.Repo
  alias Operately.Tasks.Task
  alias Operately.Updates.Comment

  def send(person, activity) do
    case Repo.get(Comment, activity.content["comment_id"]) do
      nil -> :skip
      comment -> send_email(person, activity, comment)
    end
  end

  defp send_email(person, activity, comment) do
    %{author: author = %{company: company}} = Repo.preload(activity, author: :company)

    {:ok, task} = Task.get(:system, id: activity.content["task_id"], opts: [
      preload: [:project]
    ])

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(gettext("(%{location}) %{author} commented on: %{task_name}", location: task.project.name, author: Operately.People.Person.short_name(author), task_name: task.name))
    |> assign(:author, author)
    |> assign(:comment, comment)
    |> assign(:name, task.name)
    |> assign(:cta_url, Paths.task_path(company, task, comment) |> Paths.to_url())
    |> render("project_task_commented")
  end

  def buffered_item(_person, activity) do
    with {:ok, task} <- Task.get(:system, id: activity.content["task_id"], opts: [preload: [:project, :space]]),
         %Comment{} = comment <- Repo.get(Comment, activity.content["comment_id"]) do
      build_buffered_item(activity, task, comment)
    else
      {:error, :not_found} -> :skip
      nil -> :skip
    end
  end

  defp build_buffered_item(activity, task, comment) do
    content = comment.content
    author = Operately.Repo.preload(activity, :author).author
    company = Operately.Repo.preload(author, :company).company
    parent = OperatelyEmail.DigestParent.for_task(task)
    %{html: excerpt_html, text: excerpt_text} = OperatelyEmail.RichTextExcerpt.excerpt(content)

    %{
      parent_id: parent.id,
      parent_type: parent.type,
      parent_name: parent.name,
      headline: gettext("commented on the task \"%{task_name}\"", task_name: task.name),
      excerpt_html: excerpt_html,
      excerpt_text: excerpt_text,
      item_url: Paths.task_path(company, task, comment) |> Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end
end
