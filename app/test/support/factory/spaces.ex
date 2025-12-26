defmodule Operately.Support.Factory.Spaces do
  alias Operately.Support.Factory.Utils

  def add_space(ctx, testid, opts \\ []) do
    attrs = Enum.into(opts, %{name: "Product Space"})
    space = Operately.GroupsFixtures.group_fixture(ctx.creator, attrs)

    Map.put(ctx, testid, space)
  end

  def set_tools(space, opts \\ []) do
    tools_attrs =
      opts
      |> Enum.into(%{})
      |> Map.take([:tasks_enabled, :discussions_enabled, :resource_hub_enabled])

    {:ok, space} = Operately.Groups.update_group(space, %{tools: tools_attrs})

    space
  end

  def enable_tool(space, :tasks), do: set_tools(space, tasks_enabled: true)
  def enable_tool(space, :discussions), do: set_tools(space, discussions_enabled: true)
  def enable_tool(space, :resource_hub), do: set_tools(space, resource_hub_enabled: true)

  def disable_tool(space, :tasks), do: set_tools(space, tasks_enabled: false)
  def disable_tool(space, :discussions), do: set_tools(space, discussions_enabled: false)
  def disable_tool(space, :resource_hub), do: set_tools(space, resource_hub_enabled: false)

  def set_space_tools(ctx, space_name, opts \\ []) do
    space = Map.fetch!(ctx, space_name)

    space = set_tools(space, opts)

    Map.put(ctx, space_name, space)
  end

  def enable_space_tool(ctx, space_name, :tasks), do: set_space_tools(ctx, space_name, tasks_enabled: true)
  def enable_space_tool(ctx, space_name, :discussions), do: set_space_tools(ctx, space_name, discussions_enabled: true)
  def enable_space_tool(ctx, space_name, :resource_hub), do: set_space_tools(ctx, space_name, resource_hub_enabled: true)

  def disable_space_tool(ctx, space_name, :tasks), do: set_space_tools(ctx, space_name, tasks_enabled: false)
  def disable_space_tool(ctx, space_name, :discussions), do: set_space_tools(ctx, space_name, discussions_enabled: false)
  def disable_space_tool(ctx, space_name, :resource_hub), do: set_space_tools(ctx, space_name, resource_hub_enabled: false)

  def add_space_member(ctx, testid, space_name, opts \\ []) do
    space = Map.fetch!(ctx, space_name)

    name = Keyword.get(opts, :name, Utils.testid_to_name(testid))
    level = Keyword.get(opts, :permissions, :edit_access)

    person  = Operately.PeopleFixtures.person_fixture_with_account(%{company_id: ctx.company.id, full_name: name})

    {:ok, _} = Operately.Groups.add_members(person, space.id, [%{
      id: person.id,
      access_level: Operately.Access.Binding.from_atom(level)
    }])

    Map.put(ctx, testid, person)
  end

  def create_space_task(ctx, testid, space_name, opts \\ []) do
    space = Map.fetch!(ctx, space_name)

    attrs = Enum.into(opts, %{
      creator_id: ctx.creator.id,
      space_id: space.id,
      name: Keyword.get(opts, :name, "Task #{testid}")
    })

    task = Operately.TasksFixtures.task_fixture(attrs)

    Map.put(ctx, testid, task)
  end

end
