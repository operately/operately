defmodule Operately.Notifications.Subscriber do
  alias Operately.Projects.{Contributor, CheckIn}
  alias Operately.Notifications.Subscription

  defstruct [
    :person,
    :role,
    :priority,
    :is_subscribed,
  ]

  def from_project_contributor(contributors) when is_list(contributors) do
    Enum.map(contributors, &from_project_contributor/1)
  end

  def from_project_contributor(%Contributor{} = contributor) do
    [role: role, priority: priority] = find_role_and_priority(contributor)

    %__MODULE__{
      person: contributor.person,
      role: role,
      priority: priority,
      is_subscribed: false,
    }
  end

  def from_project_check_in(%CheckIn{} = check_in) do
    subs = Enum.map(check_in.subscription_list.subscriptions, fn s ->
      {s.person.id, from_subscription(s)}
    end)

    potential_subs = Enum.map(check_in.project.contributors, fn c ->
      {c.person.id, from_project_contributor(c)}
    end)

    Map.merge(Map.new(subs), Map.new(potential_subs), fn _id, _sub, potential_sub ->
      Map.put(potential_sub, :is_subscribed, true)
    end)
    |> Map.values()
  end

  #
  # Helpers
  #

  defp from_subscription(%Subscription{} = subscription) do
    %__MODULE__{
      person: subscription.person,
      role: subscription.person.title,
      priority: false,
      is_subscribed: true,
    }
  end

  defp find_role_and_priority(%Contributor{} = contributor) do
    case contributor.role do
      :champion -> [role: "Champion", priority: true]
      :reviewer -> [role: "Reviewer", priority: true]
      _ -> [role: contributor.responsibility, priority: false]
    end
  end
end
