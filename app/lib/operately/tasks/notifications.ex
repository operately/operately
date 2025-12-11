defmodule Operately.Tasks.Notifications do
  alias Operately.Notifications.SubscribersLoader

  def get_subscribers(task, opts \\ []) do
    ignore = Keyword.get(opts, :ignore, [])

    # Load access context based on whether it's a project or space task
    task = cond do
      task.project_id != nil ->
        task = Operately.Repo.preload(task, :project)
        access_context = Operately.Access.get_context!(project_id: task.project_id)
        Map.put(task, :access_context, access_context)

      task.space_id != nil ->
        task = Operately.Repo.preload(task, :space)
        access_context = Operately.Access.get_context!(group_id: task.space_id)
        Map.put(task, :access_context, access_context)

      true ->
        task
    end

    SubscribersLoader.load_for_notifications(task, [], ignore)
  end
end
