defmodule Operately.Data.Change118EnableKpisForAllSpacesTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]

  alias Operately.Data.Change118EnableKpisForAllSpaces, as: Change
  alias Operately.Support.Factory

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
  end

  test "enables KPIs while preserving other tool settings", ctx do
    tools = %{
      "tasks_enabled" => true,
      "discussions_enabled" => false,
      "resource_hub_enabled" => false,
      "kpis_enabled" => false,
      "templates_enabled" => false
    }

    set_tools(ctx.space.id, tools)
    set_tools(ctx.company.company_space_id, %{"kpis_enabled" => false})

    Change.run()
    Change.run()

    assert tools_for(ctx.space.id) == Map.put(tools, "kpis_enabled", true)
    assert tools_for(ctx.company.company_space_id)["kpis_enabled"] == true
  end

  test "adds KPIs to legacy tool settings", ctx do
    tools = %{"tasks_enabled" => false, "discussions_enabled" => true, "resource_hub_enabled" => true}
    set_tools(ctx.space.id, tools)

    Change.run()

    assert tools_for(ctx.space.id) == Map.put(tools, "kpis_enabled", true)
  end

  test "enables KPIs for empty tool settings", ctx do
    set_tools(ctx.space.id, %{})

    Change.run()

    assert tools_for(ctx.space.id) == %{"kpis_enabled" => true}
  end

  test "includes soft-deleted spaces", ctx do
    set_tools(ctx.space.id, %{"kpis_enabled" => false})

    from(s in Operately.Groups.Group, where: s.id == ^ctx.space.id)
    |> Repo.update_all(set: [deleted_at: DateTime.utc_now()])

    Change.run()

    assert tools_for(ctx.space.id)["kpis_enabled"] == true
  end

  test "preserves enabled KPIs and is idempotent", ctx do
    tools = %{"kpis_enabled" => true, "tasks_enabled" => false}
    set_tools(ctx.space.id, tools)

    Change.run()
    Change.run()

    assert tools_for(ctx.space.id) == tools
  end

  defp set_tools(space_id, tools) do
    from(s in "groups", where: s.id == ^Ecto.UUID.dump!(space_id))
    |> Repo.update_all(set: [tools: tools])
  end

  defp tools_for(space_id) do
    from(s in "groups", where: s.id == ^Ecto.UUID.dump!(space_id), select: s.tools)
    |> Repo.one!()
  end
end
