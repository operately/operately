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

  test "Editing document doesn't send notifications to anyone when there are no mentions", ctx do
    document = create_document(ctx, true, [])

    {:ok, _} = Oban.Testing.with_testing_mode(:manual, fn ->
      Operately.Operations.ResourceHubDocumentEditing.run(ctx.creator, document, @attrs)
    end)

    activity = get_activity(document, @action)

    assert notifications_count(action: @action) == 0
    perform_job(activity.id)
    assert notifications_count(action: @action) == 0
  end

  test "Editing document notifies people mentioned in the current content only", ctx do
    document = create_document(ctx, false, [])

    {:ok, _} = Oban.Testing.with_testing_mode(:manual, fn ->
      Operately.Operations.ResourceHubDocumentEditing.run(ctx.creator, document, %{
        name: "new name",
        content: RichText.rich_text(mentioned_people: [ctx.mike]) |> Jason.decode!(),
      })
    end)

    activity = get_activity(document, @action)

    assert notifications_count(action: @action) == 0

    perform_job(activity.id)
    notifications = fetch_notifications(activity.id, action: @action)

    assert notifications_count(action: @action) == 1
    assert hd(notifications).person_id == ctx.mike.id
    first_activity_id = activity.id

    document = Operately.Repo.reload!(document) |> Repo.preload([:resource_hub, :node], force: true)

    {:ok, _} = Oban.Testing.with_testing_mode(:manual, fn ->
      Operately.Operations.ResourceHubDocumentEditing.run(ctx.creator, document, %{
        name: "newer name",
        content: RichText.rich_text("Updated content without mentions"),
      })
    end)

    activity = get_activity(document, @action, except: first_activity_id)

    perform_job(activity.id)

    assert notifications_count(action: @action) == 1
    assert fetch_notifications(activity.id, action: @action) == []
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

  defp get_activity(document, action, opts \\ []) do
    document_activity_query(document, action, Keyword.get(opts, :except))
    |> Repo.one()
  end

  defp document_activity_query(document, action, nil) do
    from(a in Operately.Activities.Activity,
      where: a.action == ^action and a.content["document_id"] == ^document.id
    )
  end

  defp document_activity_query(document, action, except_id) do
    from(a in Operately.Activities.Activity,
      where: a.action == ^action and a.content["document_id"] == ^document.id and a.id != ^except_id
    )
  end
end
