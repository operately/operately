defmodule Operately.Data.Change116RemoveSpaceKpisExperimentalFeatureTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Support.Factory
  alias Operately.Data.Change116RemoveSpaceKpisExperimentalFeature, as: Change
  alias Operately.Data.Change116RemoveSpaceKpisExperimentalFeature.Company

  setup do
    Factory.setup(%{})
  end

  test "removes space_kpis and leaves other experimental features intact", ctx do
    set_features!(ctx.company.id, ["space_kpis", "project_templates"])

    Change.run()
    Change.run()

    company = Repo.get!(Company, ctx.company.id)
    assert company.enabled_experimental_features == ["project_templates"]
  end

  test "does nothing when space_kpis is not enabled", ctx do
    set_features!(ctx.company.id, ["project_templates"])

    Change.run()

    company = Repo.get!(Company, ctx.company.id)
    assert company.enabled_experimental_features == ["project_templates"]
  end

  defp set_features!(company_id, features) do
    from(c in Company, where: c.id == ^company_id)
    |> Repo.update_all(set: [enabled_experimental_features: features])
  end
end
