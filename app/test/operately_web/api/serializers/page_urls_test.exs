defmodule OperatelyWeb.Api.PageUrlsTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.ResourceHubs.Node
  alias Operately.Support.Factory
  alias OperatelyWeb.Api.{PageUrls, Serializer}
  alias OperatelyWeb.Paths

  @node_types [:folder, :document, :file, :link]

  setup do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_resource_hub(:resource_hub, :space, :creator)
      |> Factory.add_folder(:folder, :resource_hub)
      |> Factory.add_document(:document, :resource_hub)
      |> Factory.add_file(:resource_file, :resource_hub)
      |> Factory.add_link(:link, :resource_hub)

    nodes =
      from(n in Node, where: n.resource_hub_id == ^ctx.resource_hub.id)
      |> Node.preload_content(ctx.creator)
      |> Repo.all()
      |> Map.new(&{&1.type, &1})

    {:ok, Map.put(ctx, :nodes, nodes)}
  end

  test "leaves serialized values unchanged without a company", ctx do
    nodes = Enum.map(@node_types, &Map.fetch!(ctx.nodes, &1))
    serialized = Serializer.serialize(nodes)

    assert PageUrls.attach(serialized, nodes, nil) == serialized
  end

  test "decorates a directly serialized pageable resource", ctx do
    serialized = %{id: Paths.folder_id(ctx.folder), name: ctx.folder.name}

    decorated = PageUrls.attach(serialized, ctx.folder, ctx.company)

    assert decorated.url == Paths.to_url(Paths.folder_path(ctx.company, ctx.folder))
  end

  test "leaves non-pageable maps and scalar values unchanged", ctx do
    serialized_map = %{value: "unchanged"}

    assert PageUrls.attach(serialized_map, %{}, ctx.company) == serialized_map
    assert PageUrls.attach("unchanged", ctx.folder, ctx.company) == "unchanged"
  end

  test "decorates every pageable resource nested in resource hub nodes", ctx do
    nodes = Enum.map(@node_types, &Map.fetch!(ctx.nodes, &1))

    serialized_by_type =
      @node_types
      |> Enum.zip(Serializer.serialize(nodes, company: ctx.company))
      |> Map.new()

    assert serialized_by_type.folder.folder.url == Paths.to_url(Paths.folder_path(ctx.company, ctx.folder))
    assert serialized_by_type.document.document.url == Paths.to_url(Paths.document_path(ctx.company, ctx.document))
    assert serialized_by_type.file.file.url == Paths.to_url(Paths.file_path(ctx.company, ctx.resource_file))
    assert serialized_by_type.link.link.url == ctx.link.url
    assert serialized_by_type.link.link.page_url == Paths.to_url(Paths.link_path(ctx.company, ctx.link))
  end
end
