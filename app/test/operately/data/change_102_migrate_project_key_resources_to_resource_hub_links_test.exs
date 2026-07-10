defmodule Operately.Data.Change102MigrateProjectKeyResourcesToResourceHubLinksTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]
  import Operately.ResourceHubsFixtures

  alias Operately.Data.Change102MigrateProjectKeyResourcesToResourceHubLinks, as: Change
  alias Operately.Projects.KeyResource
  alias Operately.ResourceHubs.{Link, Node, ResourceHub}
  alias Operately.Support.Factory

  setup ctx do
    ctx =
      Factory.setup(ctx)
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project(:other_project, :space)

    {:ok, ctx}
  end

  test "migrates key resources into the project's resource hub", ctx do
    key_resource =
      create_key_resource(ctx.project, %{
        title: "Design doc",
        link: "https://example.com/design",
        resource_type: "generic"
      })

    Change.run()

    [link] = links_for_project(ctx.project.id)

    assert link.url == key_resource.link
    assert link.type == :other
    assert link.author_id == ctx.project.creator_id
    assert link.description == %{"type" => "doc", "content" => [%{"type" => "paragraph"}]}

    node = Repo.get!(Node, link.node_id)
    assert node.name == key_resource.title
    assert node.type == :link
    assert node.resource_hub_id == resource_hub_for(ctx.project.id).id

    subscription_list = Repo.preload(link, :subscription_list).subscription_list
    assert subscription_list.parent_id == link.id
    assert subscription_list.parent_type == :resource_hub_link
    assert subscription_list.send_to_everyone == false
  end

  test "migrates key resources for multiple projects independently", ctx do
    first =
      create_key_resource(ctx.project, %{
        title: "First resource",
        link: "https://example.com/first"
      })

    second =
      create_key_resource(ctx.other_project, %{
        title: "Second resource",
        link: "https://example.com/second"
      })

    Change.run()

    [first_link] = links_for_project(ctx.project.id)
    [second_link] = links_for_project(ctx.other_project.id)

    assert first_link.url == first.link
    assert second_link.url == second.link
  end

  test "preserves key resource ordering by inserted_at", ctx do
    older =
      create_key_resource(ctx.project, %{
        title: "Older",
        link: "https://example.com/older",
        inserted_at: ~U[2024-01-01 10:00:00Z],
        updated_at: ~U[2024-01-01 10:00:00Z]
      })

    newer =
      create_key_resource(ctx.project, %{
        title: "Newer",
        link: "https://example.com/newer",
        inserted_at: ~U[2024-02-01 10:00:00Z],
        updated_at: ~U[2024-02-01 10:00:00Z]
      })

    Change.run()

    links =
      from(l in Link,
        join: n in Node,
        on: l.node_id == n.id,
        where: n.resource_hub_id == ^resource_hub_for(ctx.project.id).id,
        order_by: [asc: l.inserted_at],
        select: l
      )
      |> Repo.all()

    assert Enum.map(links, & &1.url) == [older.link, newer.link]
    assert Enum.map(links, & &1.inserted_at) == [older.inserted_at, newer.inserted_at]
  end

  test "infers link type from URL", ctx do
    create_key_resource(ctx.project, %{
      title: "Google Doc",
      link: "https://docs.google.com/document/d/abc123/edit"
    })

    Change.run()

    [link] = links_for_project(ctx.project.id)
    assert link.type == :google_doc
  end

  test "is idempotent and does not create duplicate links", ctx do
    create_key_resource(ctx.project, %{
      title: "Shared doc",
      link: "https://example.com/shared"
    })

    Change.run()
    Change.run()

    assert length(links_for_project(ctx.project.id)) == 1
  end

  test "skips key resources that already exist as hub links", ctx do
    hub = resource_hub_for(ctx.project.id)

    create_key_resource(ctx.project, %{
      title: "Existing link",
      link: "https://example.com/existing"
    })

    link_fixture(hub, ctx.creator, %{
      name: "Existing link",
      url: "https://example.com/existing"
    })

    Change.run()

    assert length(links_for_project(ctx.project.id)) == 1
  end

  test "skips key resources when the project has no resource hub", ctx do
    create_key_resource(ctx.project, %{
      title: "Orphaned resource",
      link: "https://example.com/orphaned"
    })

    remove_project_resource_hub(ctx.project)

    Change.run()

    assert count_links_for_project(ctx.project.id) == 0
    assert Repo.aggregate(KeyResource, :count) == 1
  end

  test "keeps source key resources after migration", ctx do
    key_resource =
      create_key_resource(ctx.project, %{
        title: "Keep me",
        link: "https://example.com/keep"
      })

    Change.run()

    assert Repo.get!(KeyResource, key_resource.id)
    assert length(links_for_project(ctx.project.id)) == 1
  end

  describe "infer_link_type/1" do
    test "maps known providers" do
      assert Change.infer_link_type("https://docs.google.com/document/d/abc") == :google_doc
      assert Change.infer_link_type("https://docs.google.com/spreadsheets/d/abc") == :google_sheet
      assert Change.infer_link_type("https://docs.google.com/presentation/d/abc") == :google_slides
      assert Change.infer_link_type("https://drive.google.com/file/d/abc") == :google
      assert Change.infer_link_type("https://www.figma.com/file/abc") == :figma
      assert Change.infer_link_type("https://www.notion.so/page") == :notion
      assert Change.infer_link_type("https://company.notion.site/page") == :notion
      assert Change.infer_link_type("https://airtable.com/app/abc") == :airtable
      assert Change.infer_link_type("https://www.dropbox.com/s/abc") == :dropbox
    end

    test "defaults to other for unknown URLs" do
      assert Change.infer_link_type("https://slack.com/archives/abc") == :other
      assert Change.infer_link_type("https://example.com/resource") == :other
    end
  end

  defp create_key_resource(project, attrs) do
    base = %{
      project_id: project.id,
      title: "some title",
      link: "https://example.com/resource",
      resource_type: "link"
    }

    attrs = Map.merge(base, attrs)

    %KeyResource{
      project_id: project.id,
      title: attrs.title,
      link: attrs.link,
      resource_type: attrs.resource_type
    }
    |> put_timestamp_attrs(attrs)
    |> Repo.insert!()
  end

  defp put_timestamp_attrs(key_resource, attrs) do
    Enum.reduce([:inserted_at, :updated_at], key_resource, fn field, resource ->
      case Map.fetch(attrs, field) do
        {:ok, value} -> Map.put(resource, field, to_naive_datetime(value))
        :error -> resource
      end
    end)
  end

  defp to_naive_datetime(%DateTime{} = dt), do: DateTime.to_naive(dt)
  defp to_naive_datetime(%NaiveDateTime{} = dt), do: dt

  defp links_for_project(project_id) do
    hub_id = resource_hub_for(project_id).id

    from(l in Link,
      join: n in Node,
      on: l.node_id == n.id,
      where: n.resource_hub_id == ^hub_id,
      order_by: [asc: l.inserted_at],
      select: l
    )
    |> Repo.all()
  end

  defp count_links_for_project(project_id) do
    case Repo.one(from(h in ResourceHub, where: h.project_id == ^project_id, select: h.id)) do
      nil -> 0
      hub_id ->
        from(l in Link,
          join: n in Node,
          on: l.node_id == n.id,
          where: n.resource_hub_id == ^hub_id,
          select: count(l.id)
        )
        |> Repo.one()
    end
  end

  defp resource_hub_for(project_id) do
    Repo.one!(from(h in ResourceHub, where: h.project_id == ^project_id))
  end

  defp remove_project_resource_hub(project) do
    project
    |> Repo.preload(:resource_hub)
    |> Map.fetch!(:resource_hub)
    |> Repo.delete!()
  end
end
