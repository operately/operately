defmodule Operately.Operations.ResourceHubDocumentEditingTest do
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
    |> Factory.add_resource_hub(:hub, :space, :creator, company_access_level: Binding.no_access())
  end

  @action "resource_hub_document_edited"
  @attrs %{
    name: "new name",
    content: RichText.rich_text("Content"),
  }

  test "Editing document sends notifications to everyone", ctx do
    document = create_document(ctx, true, [])

    {:ok, _} = Oban.Testing.with_testing_mode(:manual, fn ->
      Operately.Operations.ResourceHubDocumentEditing.run(ctx.creator, document, @attrs)
    end)

    activity = get_activity(document, @action)

    assert 0 == notifications_count(action: @action)

    perform_job(activity.id)
    notifications = fetch_notifications(activity.id, action: @action)

    assert 3 == notifications_count(action: @action)

    [ctx.mike, ctx.bob, ctx.jane]
    |> Enum.each(fn p ->
      assert Enum.find(notifications, &(&1.person_id == p.id))
    end)
  end

  test "Editing document sends notifications to selected people", ctx do
    document = create_document(ctx, false, [ctx.mike.id, ctx.jane.id])

    {:ok, _} = Oban.Testing.with_testing_mode(:manual, fn ->
      Operately.Operations.ResourceHubDocumentEditing.run(ctx.creator, document, @attrs)
    end)

    activity = get_activity(document, @action)

    assert 0 == notifications_count(action: @action)

    perform_job(activity.id)
    notifications = fetch_notifications(activity.id, action: @action)

    assert 2 == notifications_count(action: @action)

    [ctx.mike, ctx.jane]
    |> Enum.each(fn p ->
      assert Enum.find(notifications, &(&1.person_id == p.id))
    end)
  end

  test "Person without permissions is not notified", ctx do
    ctx = Factory.add_company_member(ctx, :person)
    document = create_document(ctx, false, [])

    # Without permissions
    content = RichText.rich_text(mentioned_people: [ctx.person]) |> Jason.decode!()

    {:ok, _} = Operately.Operations.ResourceHubDocumentEditing.run(ctx.creator, document, %{
      name: "new name",
      content: content,
    })

    activity = get_activity(document, @action)

    assert notifications_count(action: @action) == 0
    assert fetch_notifications(activity.id, action: @action) == []

    # With permissions
    {:ok, _} = Operately.Groups.add_members(ctx.creator, ctx.space.id, [
      %{id: ctx.person.id, access_level: Operately.Access.Binding.view_access()}
    ])

    {:ok, _} = Operately.Operations.ResourceHubDocumentEditing.run(ctx.creator, document, %{
      name: "new name",
      content: content,
    })

    assert notifications_count(action: @action) == 1
  end

  #
  # Helpers
  #

  defp create_document(ctx, send_to_everyone, people_list) do
    {:ok, document} = Operately.Operations.ResourceHubDocumentCreating.run(ctx.creator, ctx.hub, %{
      name: "Some name",
      content: RichText.rich_text("Content"),
      post_as_draft: false,
      send_to_everyone: send_to_everyone,
      subscription_parent_type: :resource_hub_document,
      subscriber_ids: people_list,
    })
    Repo.preload(document, :resource_hub)
  end

  defp get_activity(document, action) do
    from(a in Operately.Activities.Activity,
      where: a.action == ^action and a.content["document_id"] == ^document.id
    )
    |> Repo.one()
  end
end
