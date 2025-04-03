defmodule OperatelyWeb.Api.Queries.GetComments do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [filter_by_view_access: 3]

  alias Operately.Updates.Comment
  alias Operately.Projects.CheckIn
  alias Operately.Comments.CommentThread
  alias Operately.Activities.Activity

  inputs do
    field :entity_id, :string
    field :entity_type, :string
  end

  outputs do
    field :comments, list_of(:comment)
  end

  def call(conn, inputs) do
    {:ok, id} = decode_id(inputs.entity_id)
    type = String.to_existing_atom(inputs.entity_type)

    comments = load(id, type, me(conn))

    {:ok, %{comments: Serializer.serialize(comments, level: :full)}}
  end

  defp load(id, :project_check_in, person) do
    from(c in Comment,
      join: check_in in CheckIn, on: c.entity_id == check_in.id,
      join: p in assoc(check_in, :project), as: :project,
      where: c.entity_id == ^id and c.entity_type == :project_check_in
    )
    |> preload_resources()
    |> filter_by_view_access(person.id, named_binding: :project)
    |> Repo.all()
    |> load_notifications(person, action: "project_check_in_commented")
  end

  defp load(id, :project_retrospective, person) do
    from(c in Comment,
      join: retro in Operately.Projects.Retrospective, on: c.entity_id == retro.id,
      join: project in assoc(retro, :project), as: :project,
      where: retro.id == ^id and c.entity_type == :project_retrospective
    )
    |> preload_resources()
    |> filter_by_view_access(person.id, named_binding: :project)
    |> Repo.all()
    |> load_notifications(person, action: "project_retrospective_commented")
  end

  defp load(id, :goal_update, person) do
    from(c in Comment,
      join: u in Operately.Goals.Update, on: c.entity_id == u.id, as: :update,
      where: u.id == ^id
    )
    |> preload_resources()
    |> filter_by_view_access(person.id, named_binding: :update)
    |> Repo.all()
    |> load_notifications(person, action: "goal_check_in_commented")
  end

  defp load(id, :message, person) do
    from(c in Comment,
      join: m in Operately.Messages.Message, on: c.entity_id == m.id, as: :message,
      where: m.id == ^id
    )
    |> preload_resources()
    |> filter_by_view_access(person.id, named_binding: :message)
    |> Repo.all()
    |> load_notifications(person, action: "discussion_comment_submitted")
  end

  defp load(id, :comment_thread, person) do
    from(c in Comment,
      join: t in CommentThread, on: c.entity_id == t.id,
      join: a in Activity, on: t.parent_id == a.id, as: :activity,
      where: c.entity_id == ^id and c.entity_type == :comment_thread
    )
    |> preload_resources()
    |> filter_by_view_access(person.id, named_binding: :activity)
    |> Repo.all()
    |> load_notifications(person, action: "comment_added")
  end

  defp load(id, :resource_hub_document, person) do
    from(c in Comment,
      join: d in Operately.ResourceHubs.Document, on: c.entity_id == d.id, as: :document,
      where: d.id == ^id
    )
    |> preload_resources()
    |> filter_by_view_access(person.id, named_binding: :document)
    |> Repo.all()
    |> load_notifications(person, action: "resource_hub_document_commented")
  end

  defp load(id, :resource_hub_file, person) do
    from(c in Comment,
      join: f in Operately.ResourceHubs.File, on: c.entity_id == f.id, as: :file,
      where: f.id == ^id
    )
    |> preload_resources()
    |> filter_by_view_access(person.id, named_binding: :file)
    |> Repo.all()
    |> load_notifications(person, action: "resource_hub_file_commented")
  end

  defp load(id, :resource_hub_link, person) do
    from(c in Comment,
      join: l in Operately.ResourceHubs.Link, on: c.entity_id == l.id, as: :link,
      where: l.id == ^id
    )
    |> preload_resources()
    |> filter_by_view_access(person.id, named_binding: :link)
    |> Repo.all()
    |> load_notifications(person, action: "resource_hub_link_commented")
  end

  defp preload_resources(query) do
    from(c in query,
      preload: [:author, reactions: :person],
      order_by: [asc: c.inserted_at]
    )
  end

  defp load_notifications(comments, person, action: action) do
    comment_ids = Enum.map(comments, &(&1.id))

    notifications =
      from(n in Operately.Notifications.Notification,
        join: a in assoc(n, :activity),
        where: a.action == ^action,
        where: a.content["comment_id"] in ^comment_ids,
        where: n.person_id == ^person.id,
        where: not n.read,
        preload: [activity: a],
        select: n
      )
      |> Repo.all()

    Enum.map(comments, fn comment ->
      case Enum.find(notifications, &(&1.activity.content["comment_id"] == comment.id)) do
        nil -> comment
        notification -> Map.put(comment, :notification, notification)
      end
    end)
  end
end
