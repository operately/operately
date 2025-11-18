defmodule Operately.Features.ProjectRetrospectiveTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.ProjectRetrospectiveSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  @tag login_as: :champion
  feature "closing a project and submitting a retrospective", ctx do
    params = %{
      "author" => ctx.champion,
      "notes" => "We built the thing",
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
      "notes" => "We built the thing",
    }
    edited_notes = "We built the thing (edited)"

    ctx
    |> Steps.initiate_project_closing()
    |> Steps.fill_in_retrospective(params)
    |> Steps.submit_retrospective()
    |> Steps.assert_project_retrospective_posted(params)
    |> Steps.edit_project_retrospective(edited_notes)
    |> Steps.submit_retrospective()
    |> Steps.assert_project_retrospective_edited(edited_notes)
  end

  @tag login_as: :champion
  feature "comment on project retrospective", ctx do
    params = %{
      "author" => ctx.champion,
      "notes" => "We built the thing",
    }

    ctx
    |> Steps.initiate_project_closing()
    |> Steps.fill_in_retrospective(params)
    |> Steps.submit_retrospective()
    |> Steps.visit_retrospective_page()
    |> Steps.leave_comment("This is a comment.")
    |> Steps.assert_comment_present()
  end

  @tag login_as: :champion
  feature "delete comment from retrospective", ctx do
    params = %{
      "author" => ctx.champion,
      "notes" => "We built the thing",
    }

    ctx
    |> Steps.initiate_project_closing()
    |> Steps.fill_in_retrospective(params)
    |> Steps.submit_retrospective()
    |> Steps.visit_retrospective_page()
    |> Steps.leave_comment("This is a comment.")
    |> Steps.delete_comment()
    |> Steps.assert_comment_deleted()
    |> Steps.assert_retrospective_comment_visible_on_feed_after_deletion()
  end
end
