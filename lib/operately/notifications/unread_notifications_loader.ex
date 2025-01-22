defmodule Operately.Notifications.UnreadNotificationsLoader do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Notifications.NotifiableResource

  def load(person = %Operately.People.Person{}) do
    fn resource ->
      load(resource, person)
    end
  end

  def load(resource, person) do
    actions = NotifiableResource.actions(resource)
    id_field = NotifiableResource.field(resource)

    notifications =
      from(n in Operately.Notifications.Notification,
        join: a in assoc(n, :activity),
        where: a.action in ^actions and a.content[^id_field] == ^resource.id,
        where: n.person_id == ^person.id and not n.read,
        select: n
      )
      |> Repo.all()

    Map.put(resource, :notifications, notifications)
  end
end

defprotocol Operately.Notifications.NotifiableResource do
  @doc "Returns list of notification actions for this resource"
  def actions(resource)

  @doc "Returns the ID field used in activity content"
  def field(resource)
end

defimpl Operately.Notifications.NotifiableResource, for: Operately.ResourceHubs.Link do
  def actions(_), do: ["resource_hub_link_created", "resource_hub_link_edited"]
  def field(_), do: "link_id"
end

defimpl Operately.Notifications.NotifiableResource, for: Operately.ResourceHubs.Document do
  def actions(_), do: ["resource_hub_document_created", "resource_hub_document_edited"]
  def field(_), do: "document_id"
end

defimpl Operately.Notifications.NotifiableResource, for: Operately.Goals.Goal do
  def actions(_), do: ["goal_created", "goal_editing", "goal_archived"]
  def field(_), do: "goal_id"
end

defimpl Operately.Notifications.NotifiableResource, for: Operately.Goals.Update do
  def actions(_), do: ["goal_check_in", "goal_check_in_acknowledgement"]
  def field(_), do: "update_id"
end

defimpl Operately.Notifications.NotifiableResource, for: Operately.Projects.Project do
  def actions(_) do
    [
      "project_created",
      "project_closed",
      "project_goal_connection",
      "project_moved",
      "project_pausing",
      "project_resuming",
      "project_timeline_edited"
    ]
  end
  def field(_), do: "project_id"
end

defimpl Operately.Notifications.NotifiableResource, for: Operately.Projects.CheckIn do
  def actions(_), do: ["project_check_in_submitted", "project_check_in_acknowledged"]
  def field(_), do: "check_in_id"
end

defimpl Operately.Notifications.NotifiableResource, for: Operately.Groups.Group do
  def actions(_), do: ["space_members_added"]
  def field(_), do: "space_id"
end

defimpl Operately.Notifications.NotifiableResource, for: Operately.Messages.Message do
  def actions(_), do: ["discussion_posting"]
  def field(_), do: "discussion_id"
end
