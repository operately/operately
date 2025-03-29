defmodule Operately.Features.ProjectRetrospectivesTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.ProjectRetrospectiveSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  @tag login_as: :champion
  feature "closing a project and submitting a retrospective", ctx do
    params = %{
      "author" => ctx.champion,
      "what-went-well" => "We built the thing",
      "what-could-ve-gone-better" => "We built the thing",
      "what-did-you-learn" => "We learned the thing"
    }

    ctx
    |> Steps.initiate_project_closing()
    |> Steps.fill_in_retrospective(params)
    |> Steps.submit_retrospective()
    |> Steps.assert_project_retrospective_posted(params)
    |> Steps.assert_email_sent()
    |> Steps.assert_notification_sent()
  end

  @tag login_as: :champion
  feature "project can't be closed without filling in the retrospective", ctx do
    ctx
    |> Steps.initiate_project_closing()
    |> Steps.submit_retrospective()
    |> Steps.assert_retrospective_error()
  end

  @tag login_as: :champion
  feature "edit project retrospective", ctx do
    params = %{
      "author" => ctx.champion,
      "what-went-well" => "We built the thing",
      "what-could-ve-gone-better" => "We built the thing",
      "what-did-you-learn" => "We learned the thing"
    }
    edited_params = %{
      "what-went-well" => "We built the thing (edited)",
      "what-could-ve-gone-better" => "We built the thing (edited)",
      "what-did-you-learn" => "We learned the thing (edited)"
    }

    ctx
    |> Steps.initiate_project_closing()
    |> Steps.fill_in_retrospective(params)
    |> Steps.submit_retrospective()
    |> Steps.assert_project_retrospective_posted(params)
    |> Steps.edit_project_retrospective(edited_params)
    |> Steps.submit_retrospective()
    |> Steps.assert_project_retrospective_edited(edited_params)
  end
end
