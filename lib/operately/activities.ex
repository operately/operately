defmodule Operately.Activities do
  import Ecto.Query, warn: false

  alias Operately.Repo
  alias Operately.Activities.Activity
  alias Operately.Activities.Recorder

  def get_activity!(id) do
    Repo.get!(Activity, id)
  end

  defdelegate record(context, author, action, callback), to: Recorder
end
