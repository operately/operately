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
    added_assignee_ids = changed_assignee_ids(activity, "added_assignee_ids", "new_assignee_id")
    removed_assignee_ids = changed_assignee_ids(activity, "removed_assignee_ids", "old_assignee_id")

    where = get_location(task)
    assigned_to_recipient = person.id in added_assignee_ids
    removed_from_recipient = person.id in removed_assignee_ids

    company
    |> new()
    |> from(author)
    |> to(person)
    |> subject(where: where, who: author, action: subject_action(task, assigned_to_recipient, removed_from_recipient))
    |> assign(:author, author)
    |> assign(:name, task.name)
    |> assign(:old_assignee, old_assignee)
    |> assign(:new_assignee, new_assignee)
    |> assign(:assigned_to_recipient, assigned_to_recipient)
    |> assign(:removed_from_recipient, removed_from_recipient)
    |> assign(:cta_url, Paths.task_path(company, task) |> Paths.to_url())
    |> render("task_assignee_updating")
  end

  defp subject_action(task, true, _), do: "assigned you the task #{task.name}"
  defp subject_action(task, _, true), do: "removed you from the task #{task.name}"
  defp subject_action(task, _, _), do: "changed the assignees for #{task.name}"

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
    parent = OperatelyEmail.DigestParent.for_task(task)
    new_assignee = get_person(activity.content["new_assignee_id"])
    old_assignee = get_person(activity.content["old_assignee_id"])
    added_assignee_ids = changed_assignee_ids(activity, "added_assignee_ids", "new_assignee_id")
    removed_assignee_ids = changed_assignee_ids(activity, "removed_assignee_ids", "old_assignee_id")

    %{
      parent_id: parent.id,
      parent_type: parent.type,
      parent_name: parent.name,
      headline: buffered_headline(task.name, new_assignee, old_assignee, added_assignee_ids, removed_assignee_ids),
      excerpt_html: nil,
      excerpt_text: nil,
      item_url: OperatelyWeb.Paths.task_path(company, task) |> OperatelyWeb.Paths.to_url(),
      actor_name: Operately.People.Person.short_name(author),
      occurred_at: activity.inserted_at,
      coalesce_key: nil
    }
  end

  defp changed_assignee_ids(activity, plural_key, singular_key) do
    case activity.content[plural_key] do
      nil -> List.wrap(activity.content[singular_key]) |> Enum.reject(&is_nil/1)
      ids -> ids
    end
  end

  defp buffered_headline(task_name, assignee, _old_assignee, [_], []), do: "assigned #{assignee.full_name} to the task \"#{task_name}\""
  defp buffered_headline(task_name, _new_assignee, assignee, [], [_]), do: "removed #{assignee.full_name} from the task \"#{task_name}\""
  defp buffered_headline(task_name, _new_assignee, _old_assignee, _added_assignee_ids, _removed_assignee_ids), do: "changed the assignees for the task \"#{task_name}\""
end
