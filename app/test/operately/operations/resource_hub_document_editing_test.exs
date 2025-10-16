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
    content: RichText.rich_text("Content")
  }

  test "Editing document doens't send notifications to anyone", ctx do
    document = create_document(ctx, true, [])

    {:ok, _} =
      Oban.Testing.with_testing_mode(:manual, fn ->
        Operately.Operations.ResourceHubDocumentEditing.run(ctx.creator, document, @attrs)
      end)

    activity = get_activity(document, @action)

    assert notifications_count(action: @action) == 0
    perform_job(activity.id)
    assert notifications_count(action: @action) == 0
  end

  #
  # Helpers
  #

  defp create_document(ctx, send_to_everyone, people_list) do
    {:ok, document} =
      Operately.Operations.ResourceHubDocumentCreating.run(ctx.creator, ctx.hub, %{
        name: "Some name",
        content: RichText.rich_text("Content"),
        post_as_draft: false,
        send_to_everyone: send_to_everyone,
        subscription_parent_type: :resource_hub_document,
        subscriber_ids: people_list
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
