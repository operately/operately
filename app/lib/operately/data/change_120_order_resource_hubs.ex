defmodule Operately.Data.Change120OrderResourceHubs do
  import Ecto.Query
  alias Operately.Repo

  defmodule Hub do
    use Operately.Schema

    schema "resource_hubs" do
      field :space_id, :binary_id
      field :position, :integer
      timestamps()
    end
  end

  def run do
    from(h in Hub, order_by: [asc: h.inserted_at, asc: h.id])
    |> Repo.all()
    |> Enum.group_by(& &1.space_id)
    |> Enum.each(fn {space_id, hubs} ->
      hubs
      |> Enum.with_index()
      |> Enum.each(fn {hub, index} ->
        if is_nil(hub.position), do: Repo.update!(Ecto.Changeset.change(hub, position: if(space_id, do: index, else: 0)))
      end)
    end)
  end
end
