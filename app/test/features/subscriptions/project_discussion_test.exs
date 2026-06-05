defmodule Operately.Features.Subscriptions.ProjectDiscussionTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.SubscriptionsSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  describe "Project Discussion" do
    setup ctx do
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
      |> Steps.visit_project_discussions_page()
      |> Steps.start_add_project_discussion()
      |> Steps.fill_out_discussion()
      |> Steps.select_all_people()
      |> Steps.save_project_discussion()
      |> Steps.assert_current_subscribers(%{count: 5, resource: "discussion"})
    end

    feature "Select specific contributors", ctx do
      ctx
      |> Steps.visit_project_discussions_page()
      |> Steps.start_add_project_discussion()
      |> Steps.fill_out_discussion()
      |> Steps.select_specific_people()
      |> Steps.toggle_person_checkbox(ctx.john)
      |> Steps.toggle_person_checkbox(ctx.jane)
      |> Steps.save_people_selection()
      |> Steps.save_project_discussion()
      |> Steps.assert_current_subscribers(%{count: 3, resource: "discussion"})
    end

    feature "No one", ctx do
      ctx
      |> Steps.visit_project_discussions_page()
      |> Steps.start_add_project_discussion()
      |> Steps.fill_out_discussion()
      |> Steps.select_no_one()
      |> Steps.save_project_discussion()
      |> Steps.assert_current_subscribers(%{count: 1, resource: "discussion"})
    end

    feature "Subscribe and unsubscribe", ctx do
      ctx
      |> Steps.visit_project_discussions_page()
      |> Steps.start_add_project_discussion()
      |> Steps.fill_out_discussion()
      |> Steps.select_all_people()
      |> Steps.save_project_discussion()
      |> Steps.exercise_current_subscriptions_widget("discussion")
    end
  end
end
