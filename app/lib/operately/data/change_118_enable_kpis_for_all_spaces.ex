defmodule Operately.Data.Change118EnableKpisForAllSpaces do
  @moduledoc """
  Enables KPIs for all existing spaces while preserving their other tool settings.
  """

  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias __MODULE__.Space

  def run do
    from(s in Space,
      where: fragment("?->'kpis_enabled' IS DISTINCT FROM 'true'::jsonb", s.tools),
      update: [set: [tools: fragment("jsonb_set(?, '{kpis_enabled}', 'true'::jsonb)", s.tools)]]
    )
    |> Repo.update_all([])
  end

  defmodule Space do
    use Operately.Schema

    schema "groups" do
      field :tools, :map
    end
  end
end
