defmodule Operately.Operations.ResourceHubDocumentCreatingTest do
  use Operately.DataCase
  use Operately.Support.Notifications

  alias Operately.Access.Binding
  alias Operately.Support.RichText

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_space_member(:mike, :space)
    |> Factory.add_space_member(:bob, :space)
    |> Factory.add_space_member(:jane, :space)
    |> Factory.add_resource_hub(:hub, :space, :creator)
  end

  test "Creating document sends notifications to everyone", ctx do
    {:ok, document} = Oban.Testing.with_testing_mode(:manual, fn ->
      Operately.Operations.ResourceHubDocumentCreating.run(ctx.creator, ctx.hub, %{
        name: "Some name",
        content: RichText.rich_text("Content"),
        send_to_everyone: true,
        subscription_parent_type: :resource_hub_document,
        subscriber_ids: [],
      })
    end)

    action = "resource_hub_document_created"
    activity = get_activity(document, action)

    assert 0 == notifications_count(action: action)

    perform_job(activity.id)
    notifications = fetch_notifications(activity.id, action: action)

    assert 3 == notifications_count(action: action)

    [ctx.mike, ctx.bob, ctx.jane]
    |> Enum.each(fn p ->
      assert Enum.find(notifications, &(&1.person_id == p.id))
    end)
  end

  test "Creating message sends notifications to selected people", ctx do
    {:ok, document} = Oban.Testing.with_testing_mode(:manual, fn ->
      Operately.Operations.ResourceHubDocumentCreating.run(ctx.creator, ctx.hub, %{
        name: "Some name",
        content: RichText.rich_text("Content"),
        send_to_everyone: false,
        subscription_parent_type: :resource_hub_document,
        subscriber_ids: [ctx.mike.id, ctx.jane.id],
      })
    end)

    action = "resource_hub_document_created"
    activity = get_activity(document, action)

    assert 0 == notifications_count(action: action)

    perform_job(activity.id)
    notifications = fetch_notifications(activity.id, action: action)

    assert 2 == notifications_count(action: action)

    [ctx.mike, ctx.jane]
    |> Enum.each(fn p ->
      assert Enum.find(notifications, &(&1.person_id == p.id))
    end)
  end

  test "Person without permissions is not notified", ctx do
    ctx =
      ctx
      |> Factory.add_company_member(:person)
      |> Factory.add_resource_hub(:hub2, :space, :creator, company_access_level: Binding.no_access())

    # Without permissions
    content = RichText.rich_text(mentioned_people: [ctx.person]) |> Jason.decode!()

    {:ok, document} = Operately.Operations.ResourceHubDocumentCreating.run(ctx.creator, ctx.hub2, %{
      name: "Some name",
      content: content,
      send_to_everyone: false,
      subscription_parent_type: :resource_hub_document,
      subscriber_ids: [],
    })

    action = "resource_hub_document_created"
    activity = get_activity(document, action)

    assert notifications_count(action: action) == 0
    assert fetch_notifications(activity.id, action: action) == []

    # With permissions
    {:ok, _} = Operately.Groups.add_members(ctx.creator, ctx.space.id, [
      %{id: ctx.person.id, access_level: Operately.Access.Binding.view_access()}
    ])

    {:ok, document} = Operately.Operations.ResourceHubDocumentCreating.run(ctx.creator, ctx.hub2, %{
      name: "Some name",
      content: content,
      send_to_everyone: false,
      subscription_parent_type: :resource_hub_document,
      subscriber_ids: [],
    })

    activity = get_activity(document, action)
    notifications = fetch_notifications(activity.id, action: action)

    assert notifications_count(action: action) == 1
    assert hd(notifications).person_id == ctx.person.id
  end

  #
  # Helpers
  #

  defp get_activity(document, action) do
    from(a in Operately.Activities.Activity,
      where: a.action == ^action and a.content["document_id"] == ^document.id
    )
    |> Repo.one()
  end
end
