defmodule Operately.Tasks.Notifications do
  alias Operately.Notifications.SubscribersLoader

  def get_subscribers(task, opts \\ []) do
    ignore = Keyword.get(opts, :ignore, [])
    task = Operately.Repo.preload(task, :access_context)

    SubscribersLoader.load_for_notifications(task, [], ignore)
  end
end
