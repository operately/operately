defmodule Operately.Data.Change105DeleteAiPeople do
  @moduledoc """
  Removes leftover Operately AI / Alfred people.

  Dependent rows (access groups/bindings/memberships, space members,
  contributors, subscriptions, agent defs/runs) cascade from people deletes.
  AI-only tables are dropped by a separate schema migration.

  Safe and idempotent: re-running deletes nothing when no AI people remain.
  """

  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias __MODULE__.{Company, Person}

  def run do
    delete_ai_people()
    strip_ai_experimental_feature()
  end

  defp delete_ai_people do
    from(p in Person, where: p.type == "ai")
    |> Repo.delete_all()
  end

  defp strip_ai_experimental_feature do
    from(c in Company, where: fragment("? @> ARRAY['ai']::varchar[]", c.enabled_experimental_features))
    |> Repo.all()
    |> Enum.each(fn company ->
      features = Enum.reject(company.enabled_experimental_features || [], &(&1 == "ai"))

      from(c in Company, where: c.id == ^company.id)
      |> Repo.update_all(set: [enabled_experimental_features: features])
    end)
  end

  defmodule Person do
    use Operately.Schema

    schema "people" do
      field :type, :string
      field :full_name, :string
      field :company_id, :binary_id

      timestamps()
    end
  end

  defmodule Company do
    use Operately.Schema

    schema "companies" do
      field :enabled_experimental_features, {:array, :string}

      timestamps()
    end
  end
end
