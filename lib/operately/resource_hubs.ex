defmodule Operately.ResourceHubs do
  import Ecto.Query, warn: false

  alias Operately.Repo
  alias Operately.ResourceHubs.ResourceHub

  def create_resource_hub(attrs \\ %{}) do
    %ResourceHub{}
    |> ResourceHub.changeset(attrs)
    |> Repo.insert()
  end
end
