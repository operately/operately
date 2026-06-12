defmodule OperatelyEmail.ResourceHubLinkCreatedEmailTest do
  use Operately.DataCase

  alias Operately.Access.Binding
  alias Operately.Activities.Activity
  alias Operately.Operations.ResourceHubLinkCreating
  alias Operately.Support.RichText
  alias OperatelyEmail.Emails.ResourceHubLinkCreatedEmail
  alias OperatelyWeb.Paths

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space, company_access_level: Binding.no_access(), space_access_level: Binding.no_access())
    |> Factory.add_resource_hub(:hub, :project, :creator)
    |> then(&{:ok, &1})
  end

  test "buffered item groups project-backed hubs under the project", ctx do
    {:ok, link} =
      ResourceHubLinkCreating.run(ctx.creator, ctx.hub, %{
        name: "Project link",
        url: "http://localhost:4000",
        type: :other,
        content: RichText.rich_text("Content"),
        subscription_parent_type: :resource_hub_link,
        send_to_everyone: false,
        subscriber_ids: [],
      })

    activity =
      from(a in Activity,
        where: a.action == "resource_hub_link_created" and a.content["link_id"] == ^link.id
      )
      |> Repo.one()

    item = ResourceHubLinkCreatedEmail.buffered_item(ctx.creator, activity)

    assert item.parent_id == ctx.project.id
    assert item.parent_type == :project
    assert item.parent_name == ctx.project.name
    assert item.item_url == Paths.link_path(ctx.company, link) |> Paths.to_url()
  end
end
