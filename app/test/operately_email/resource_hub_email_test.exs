defmodule OperatelyEmail.ResourceHubEmailTest do
  use Operately.DataCase

  import Operately.ActivitiesFixtures
  import Operately.CommentsFixtures
  import Operately.ResourceHubsFixtures

  alias Operately.ResourceHubs.ProjectHub
  alias Operately.Support.Factory
  alias Operately.Support.RichText
  alias OperatelyEmail.Emails.{
    ResourceHubDocumentCommentedEmail,
    ResourceHubDocumentCreatedEmail,
    ResourceHubDocumentDeletedEmail,
    ResourceHubDocumentEditedEmail,
    ResourceHubFileCommentedEmail,
    ResourceHubFileCreatedEmail,
    ResourceHubFileDeletedEmail,
    ResourceHubLinkCommentedEmail,
    ResourceHubLinkCreatedEmail,
    ResourceHubLinkDeletedEmail,
    ResourceHubLinkEditedEmail
  }

  setup ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)

    {:ok, hub} = ProjectHub.create_for_project(ctx.project)

    document = document_fixture(hub.id, ctx.creator.id, name: "Project document")
    resource_file = file_fixture(hub, ctx.creator, name: "Project file")
    link = link_fixture(hub, ctx.creator, %{name: "Project link"})

    {:ok, Map.merge(ctx, %{hub: hub, document: document, resource_file: resource_file, link: link})}
  end

  test "resource hub emails render for project hub resources", ctx do
    Enum.each(email_activities(ctx), fn {email_module, activity} ->
      assert apply(email_module, :send, [ctx.creator, activity])

      item = email_module.buffered_item(ctx.creator, activity)
      assert item.parent_id == ctx.project.id
      assert item.parent_type == :project
      assert item.parent_name == ctx.project.name
    end)
  end

  defp email_activities(ctx) do
    document_comment = comment(ctx, ctx.document.id, :resource_hub_document)
    file_comment = comment(ctx, ctx.resource_file.id, :resource_hub_file)
    link_comment = comment(ctx, ctx.link.id, :resource_hub_link)

    [
      {ResourceHubDocumentCreatedEmail, activity(ctx, "resource_hub_document_created", %{"document_id" => ctx.document.id})},
      {ResourceHubDocumentCommentedEmail, activity(ctx, "resource_hub_document_commented", %{"document_id" => ctx.document.id, "comment_id" => document_comment.id})},
      {ResourceHubDocumentEditedEmail, activity(ctx, "resource_hub_document_edited", %{"document_id" => ctx.document.id, "content" => RichText.rich_text("Edited document")})},
      {ResourceHubDocumentDeletedEmail, activity(ctx, "resource_hub_document_deleted", %{"document_id" => ctx.document.id})},
      {ResourceHubFileCreatedEmail, activity(ctx, "resource_hub_file_created", %{"files" => [%{"file_id" => ctx.resource_file.id}]})},
      {ResourceHubFileCommentedEmail, activity(ctx, "resource_hub_file_commented", %{"file_id" => ctx.resource_file.id, "comment_id" => file_comment.id})},
      {ResourceHubFileDeletedEmail, activity(ctx, "resource_hub_file_deleted", %{"file_id" => ctx.resource_file.id})},
      {ResourceHubLinkCreatedEmail, activity(ctx, "resource_hub_link_created", %{"link_id" => ctx.link.id})},
      {ResourceHubLinkCommentedEmail, activity(ctx, "resource_hub_link_commented", %{"link_id" => ctx.link.id, "comment_id" => link_comment.id})},
      {ResourceHubLinkEditedEmail, activity(ctx, "resource_hub_link_edited", %{"link_id" => ctx.link.id})},
      {ResourceHubLinkDeletedEmail, activity(ctx, "resource_hub_link_deleted", %{"link_id" => ctx.link.id})}
    ]
  end

  defp activity(ctx, action, content) do
    activity_fixture(%{
      action: action,
      author_id: ctx.creator.id,
      content: Map.merge(%{"company_id" => ctx.company.id, "project_id" => ctx.project.id, "resource_hub_id" => ctx.hub.id}, content)
    })
  end

  defp comment(ctx, entity_id, entity_type) do
    comment_fixture(ctx.creator, %{
      entity_id: entity_id,
      entity_type: entity_type,
      content: RichText.rich_text("Comment")
    })
  end
end
