defmodule OperatelyEmail.Emails.TaskAddingEmail do
  use Gettext, backend: OperatelyWeb.Gettext
  import OperatelyEmail.Mailers.ActivityMailer

  alias Operately.People.Person
  alias Operately.Repo
  alias Operately.Tasks.Task
  alias OperatelyWeb.Paths

  def send(person, activity) do
    %{author: author = %{company: company}} = Repo.preload(activity, author: :company)

    {:ok, task} =
      Task.get(:system,
        id: content_value(activity.content, :task_id),
        opts: [preload: [:project, :space]]
      )

    who = Person.short_name(author)
    where = find_where_name(task)
    mentioned = mentioned?(person, activity)
    {subject, title, body} = copy(mentioned, where, who, task.name)
    cta_url = Paths.task_path(company, task) |> Paths.to_url()

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(subject)
    |> assign(:title, title)
    |> assign(:body, body)
    |> assign(:cta, gettext("View Task"))
    |> assign(:cta_url, cta_url)
    |> assign(:text_link, gettext("Link: %{url}", url: cta_url))
    |> render("task_adding")
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
      headline: gettext("created the task \"%{task_name}\"", task_name: task.name),
      excerpt_html: nil,
      excerpt_text: nil,
      item_url: OperatelyWeb.Paths.task_path(company, task) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end

  defp copy(true, where, who, task_name) do
    {
      gettext("(%{where}) %{who} mentioned you in the description for \"%{task_name}\"", where: where, who: who, task_name: task_name),
      gettext("%{who} mentioned you in the description for \"%{task_name}\"", who: who, task_name: task_name),
      gettext("You were mentioned in the description for %{task_name}.", task_name: task_name)
    }
  end

  defp copy(false, where, who, task_name) do
    {
      gettext("(%{where}) %{who} added the task \"%{task_name}\"", where: where, who: who, task_name: task_name),
      gettext("%{who} added the task \"%{task_name}\"", who: who, task_name: task_name),
      gettext("A new task named %{task_name} was created in this project.", task_name: task_name)
    }
  end

  defp mentioned?(person, activity) do
    mentioned_ids =
      activity.content
      |> content_value(:description)
      |> Operately.RichContent.find_mentioned_ids(:decode_ids)

    person.id in mentioned_ids
  rescue
    _ -> false
  end

  defp content_value(content, key) when is_map(content) do
    Map.get(content, Atom.to_string(key)) || Map.get(content, key)
  end

  defp content_value(_content, _key), do: nil

  defp find_where_name(task) do
    case task do
      %{project: %{name: name}} -> name
      %{space: %{name: name}} -> name
      _ -> gettext("Unknown")
    end
  end
end
