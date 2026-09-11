defmodule Operately.Data.Change116RemoveSpaceKpisExperimentalFeature do
  @moduledoc """
  Removes the retired `space_kpis` experimental feature from companies.

  KPIs are generally available, so the flag no longer gates the product.
  Safe and idempotent: re-running updates nothing when the flag is gone.
  """

  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias __MODULE__.Company

  def run do
    from(c in Company, where: fragment("? @> ARRAY['space_kpis']::varchar[]", c.enabled_experimental_features))
    |> Repo.all()
    |> Enum.each(&strip_feature/1)
  end

  defp strip_feature(company) do
    features = Enum.reject(company.enabled_experimental_features || [], &(&1 == "space_kpis"))

    from(c in Company, where: c.id == ^company.id)
    |> Repo.update_all(set: [enabled_experimental_features: features])
  end

  defmodule Company do
    use Operately.Schema

    schema "companies" do
      field :enabled_experimental_features, {:array, :string}

      timestamps()
    end
  end
end
