defmodule Operately.Data.Change102RenameProjectResourceHubs do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias __MODULE__.ResourceHub

  @old_name "Docs & Files"
  @new_name "Documents & Files"

  def run do
    from(h in ResourceHub, where: not is_nil(h.project_id) and h.name == ^@old_name)
    |> Repo.update_all(set: [name: @new_name])
  end

  defmodule ResourceHub do
    use Operately.Schema

    schema "resource_hubs" do
      field :name, :string
      field :project_id, :binary_id
    end
  end
end
