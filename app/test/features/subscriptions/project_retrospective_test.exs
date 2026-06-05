defmodule Operately.Features.Subscriptions.ProjectRetrospectiveTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.SubscriptionsSteps, as: Steps

  alias Operately.Support.Features.ProjectRetrospectiveSteps

  setup ctx, do: Steps.setup(ctx)

  describe "Project Retrospective" do
    setup ctx do
      params = %{
        "author" => ctx.creator,
        "notes" => "We built the thing"
      }

      ctx = Map.put(ctx, :params, params)

      ctx
      |> Factory.add_company_member(:bob)
      |> Factory.add_project(:project, :space, reviewer: :bob)
      |> Factory.add_project_contributor(:fred, :project, :as_person)
      |> Factory.add_project_contributor(:jane, :project, :as_person)
      |> Factory.add_project_contributor(:john, :project, :as_person)
      |> UI.login_as(ctx.creator)
    end

    feature "All contributors", ctx do
      ctx
      |> ProjectRetrospectiveSteps.initiate_project_closing()
      |> ProjectRetrospectiveSteps.fill_in_retrospective(ctx.params)
      |> Steps.select_all_people()
      |> ProjectRetrospectiveSteps.submit_retrospective()
      |> Steps.go_to_project_retrospective_page()
      |> Steps.assert_current_subscribers(%{count: 5, resource: "project retrospective"})
    end

    feature "Select specific contributors", ctx do
      ctx
      |> ProjectRetrospectiveSteps.initiate_project_closing()
      |> ProjectRetrospectiveSteps.fill_in_retrospective(ctx.params)
      |> Steps.select_specific_people()
      |> Steps.toggle_person_checkbox(ctx.john)
      |> Steps.toggle_person_checkbox(ctx.jane)
      |> Steps.save_people_selection()
      |> ProjectRetrospectiveSteps.submit_retrospective()
      |> Steps.go_to_project_retrospective_page()
      |> Steps.assert_current_subscribers(%{count: 4, resource: "project retrospective"})
    end

    feature "No one", ctx do
      ctx
      |> ProjectRetrospectiveSteps.initiate_project_closing()
      |> ProjectRetrospectiveSteps.fill_in_retrospective(ctx.params)
      |> Steps.select_no_one()
      |> ProjectRetrospectiveSteps.submit_retrospective()
      |> Steps.go_to_project_retrospective_page()
      |> Steps.assert_current_subscribers(%{count: 2, resource: "project retrospective"})
    end

    feature "Subscribe and unsubribe", ctx do
      ctx
      |> ProjectRetrospectiveSteps.initiate_project_closing()
      |> ProjectRetrospectiveSteps.fill_in_retrospective(ctx.params)
      |> Steps.select_all_people()
      |> ProjectRetrospectiveSteps.submit_retrospective()
      |> Steps.go_to_project_retrospective_page()
      |> Steps.exercise_current_subscriptions_widget("project retrospective")
    end
  end
end
