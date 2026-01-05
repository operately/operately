defmodule Operately.Demo.Spaces do
  alias Operately.Demo.{Resources, Tasks}

  def create_spaces(resources, data) do
    Resources.create(resources, data, fn {resources, data, _index} ->
      create_space(resources, data)
    end)
  end

  def create_space(resources, data) do
    owner = Resources.get(resources, :owner)

    {:ok, space} = Operately.Groups.create_group(owner, %{
      name: data.name,
      mission: data.description,
      company_permissions: company_permissions(data[:privacy] || :company_wide),
      public_permissions: 0
    })

    {:ok, _} = add_members(resources, owner, space, data)

    space = maybe_enable_tasks(space, data[:tasks])
    create_space_tasks(resources, owner, space, data[:tasks])

    space
  end

  defp company_permissions(:company_wide), do: 70
  defp company_permissions(:invite_only), do: 0

  defp maybe_enable_tasks(space, tasks) do
    if tasks_present?(tasks) do
      {:ok, space} = Operately.Groups.update_group(space, %{tools: %{tasks_enabled: true}})
      space
    else
      space
    end
  end

  defp create_space_tasks(_resources, _owner, _space, tasks) when tasks in [nil, []], do: :ok

  defp create_space_tasks(resources, owner, space, tasks) do
    Enum.each(tasks, fn task ->
      status = Tasks.resolve_task_status(space, task[:status])
      assignee = Tasks.resolve_assignee(resources, task[:assignee])
      due_date = task[:due_in_days] && Date.add(Date.utc_today(), task.due_in_days)
      due_date = Tasks.normalize_due_date(due_date, status)

      Tasks.create_task(%{
        name: task.name,
        description: task[:description],
        creator_id: owner.id,
        space_id: space.id,
        due_date: Tasks.build_due_date(due_date),
        task_status: status,
        status: status.value,
        priority: task[:priority],
        size: task[:size]
      }, assignee && assignee.id)
    end)
  end

  defp add_members(resources, owner, space, data) do
    members = Resources.get(resources, data[:members] || [])

    members = Enum.map(members, fn member ->
      %{id: member.id, access_level: Operately.Access.Binding.edit_access()}
    end)

    Operately.Groups.add_members(owner, space.id, members)
  end

  defp tasks_present?(tasks) do
    tasks
    |> List.wrap()
    |> Enum.any?()
  end
end
