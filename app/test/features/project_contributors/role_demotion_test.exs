defmodule Operately.Features.ProjectContributors.RoleDemotionTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.ProjectContributorsSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  describe "clearing champion or reviewer" do
    @tag login_as: :champion
    feature "cleared champion appears in contributors without reload", ctx do
      champion_name = ctx.champion.full_name

      ctx
      |> Steps.assert_logged_in_champion_has_full_access()
      |> Steps.visit_project_page()
      |> Steps.remove_champion()
      |> Steps.assert_champion_removed()
      |> Steps.assert_person_listed_as_contributor(name: champion_name)
      |> Steps.assert_person_not_available_to_add_as_contributor(name: champion_name)
    end
  end
end
