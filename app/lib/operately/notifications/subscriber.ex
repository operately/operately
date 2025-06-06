defmodule Operately.Notifications.Subscriber do
  alias Operately.Projects.Contributor
  alias Operately.Goals.{Update, Goal}
  alias Operately.Notifications.{Subscription, SubscriptionList}
  alias Operately.People.Person
  alias Operately.Messages.Message

  defstruct [
    :person,
    :role,
    :priority,
    :is_subscribed
  ]

  def from_project_contributor(contributors) when is_list(contributors) do
    Enum.map(contributors, &from_project_contributor/1)
  end

  def from_project_contributor(%Contributor{} = contributor) do
    [role: role, priority: priority] = find_role_and_priority(contributor)

    build_struct(contributor.person, role, priority: priority)
  end

  def from_space_members(members) do
    Enum.map(members, fn m ->
      from_person(m)
    end)
  end

  def from_project_child(project_child) do
    subs =
      exclude_canceled_subscriptions(project_child.subscription_list)
      |> Enum.into(%{}, fn s ->
        {s.person.id, from_subscription(s)}
      end)

    potential_subs =
      Enum.into(project_child.project.contributors, %{}, fn c ->
        {c.person.id, from_project_contributor(c)}
      end)

    merge_subs_and_potential_subs(subs, potential_subs)
  end

  def from_goal_update(%Update{} = update) do
    subs =
      exclude_canceled_subscriptions(update.subscription_list)
      |> Enum.into(%{}, fn s ->
        {s.person.id, from_subscription(s)}
      end)

    potential_subs =
      Enum.into(from_goal(update.goal), %{}, fn sub ->
        {sub.person.id, sub}
      end)

    merge_subs_and_potential_subs(subs, potential_subs)
  end

  def from_goal_discussion(comment_thread, goal) do
    subs =
      exclude_canceled_subscriptions(comment_thread.subscription_list)
      |> Enum.into(%{}, fn s ->
        {s.person.id, from_subscription(s)}
      end)

    potential_subs =
      Enum.into(from_goal(goal), %{}, fn sub ->
        {sub.person.id, sub}
      end)

    merge_subs_and_potential_subs(subs, potential_subs)
  end

  def from_message(%Message{} = message) do
    subs =
      exclude_canceled_subscriptions(message.subscription_list)
      |> Enum.into(%{}, fn s ->
        {s.person.id, from_subscription(s)}
      end)

    potential_subs =
      Enum.into(message.space.members, %{}, fn p ->
        {p.id, from_person(p)}
      end)

    merge_subs_and_potential_subs(subs, potential_subs)
  end

  def from_goal(goal = %Goal{}) do
    goal.group.members
    |> Enum.into(%{}, fn p -> {p.id, from_person(p)} end)
    |> then(fn members ->
      if goal.champion_id != nil do
        Map.put(members, goal.champion_id, from_goal_champion(goal.champion))
      else
        members
      end
    end)
    |> then(fn members ->
      if goal.reviewer_id != nil do
        Map.put(members, goal.reviewer_id, from_goal_reviewer(goal.reviewer))
      else
        members
      end
    end)
    |> Map.values()
  end

  def from_resource_hub_child(resource_hub_child) do
    subs =
      exclude_canceled_subscriptions(resource_hub_child.subscription_list)
      |> Enum.into(%{}, fn s ->
        {s.person.id, from_subscription(s)}
      end)

    potential_subs =
      Enum.into(resource_hub_child.resource_hub.space.members, %{}, fn p ->
        {p.id, from_person(p)}
      end)

    merge_subs_and_potential_subs(subs, potential_subs)
  end

  #
  # Helpers
  #

  defp from_subscription(subscription = %Subscription{}) do
    build_struct(subscription.person, subscription.person.title, is_subscribed: true)
  end

  defp from_person(person = %Person{}) do
    build_struct(person, person.title)
  end

  defp from_goal_reviewer(reviewer = %Person{}) do
    build_struct(reviewer, "Reviewer", priority: true)
  end

  defp from_goal_champion(champion = %Person{}) do
    build_struct(champion, "Champion", priority: true)
  end

  defp find_role_and_priority(%Contributor{} = contributor) do
    case contributor.role do
      :champion -> [role: "Champion", priority: true]
      :reviewer -> [role: "Reviewer", priority: true]
      _ -> [role: contributor.responsibility, priority: false]
    end
  end

  defp exclude_canceled_subscriptions(nil), do: []

  defp exclude_canceled_subscriptions(subscription_list = %SubscriptionList{}) do
    Enum.filter(subscription_list.subscriptions, &(not &1.canceled))
  end

  defp merge_subs_and_potential_subs(subs, potential_subs) do
    Map.merge(subs, potential_subs, fn _id, _sub, potential_sub ->
      Map.put(potential_sub, :is_subscribed, true)
    end)
    |> Map.values()
  end

  defp build_struct(person, role, opts \\ []) do
    priority = Keyword.get(opts, :priority, false)
    is_subscribed = Keyword.get(opts, :is_subscribed, false)

    %__MODULE__{
      person: person,
      role: role,
      priority: priority,
      is_subscribed: is_subscribed
    }
  end
end
