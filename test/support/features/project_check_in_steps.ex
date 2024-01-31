defmodule Operately.Support.Features.ProjectCheckInSteps do
  alias Operately.Support.Features.UI
  alias Operately.Support.Features.ProjectSteps

  @labels %{
    status: %{
      "on_track" => "On Track",
      "at_risk" => "At Risk",
      "off_track" => "Off Track",
      "paused" => "Paused",
    },
    schedule: %{
      "on_schedule" => "On Schedule",
      "small_delays" => "Small delays",
      "major_delays" => "Major delays",
    },
    budget: %{
      "within_budget" => "Within Budget",
      "not_within_budget" => "Not within budget",
    },
    team: %{
      "staffed" => "Staffed with suitable roles",
      "missing_roles" => "Missing roles",
      "key_roles_missing" => "Key roles missing",
    },
    risks: %{
      "no_known_risks" => "No known risks",
      "minor_risks" => "Minor Risks",
      "major_risks" => "Major Risks",
    },
  }

  def start_check_in(ctx) do
    ctx
    |> ProjectSteps.visit_project_page()
    |> UI.click(testid: "check-in-now")
  end

  def submit_check_in(ctx, opts \\ %{}) do
    ctx
    |> start_check_in()
    |> UI.fill_rich_text(opts.content)
    |> in_accordion("status", fn el ->
      el 
      |> UI.click(testid: "status-#{opts.status}")
      |> UI.fill_rich_text(opts.status_comments)
    end)
    |> in_accordion("schedule", fn el ->
      el 
      |> UI.click(testid: "schedule-#{opts.schedule}")
      |> UI.fill_rich_text(opts.schedule_comments)
    end)
    |> in_accordion("budget", fn el ->
      el 
      |> UI.click(testid: "budget-#{opts.budget}")
      |> UI.fill_rich_text(opts.budget_comments)
    end)
    |> in_accordion("team", fn el ->
      el 
      |> UI.click(testid: "team-#{opts.team}")
      |> UI.fill_rich_text(opts.team_comments)
    end)
    |> in_accordion("risks", fn el ->
      el 
      |> UI.click(testid: "risks-#{opts.risks}")
      |> UI.fill_rich_text(opts.risks_comments)
    end)
    |> UI.click(testid: "post-status-update")
    |> UI.assert_text("Check-In from")
  end

  def edit_check_in(ctx) do
    ctx
    |> UI.click(testid: "options-button")
    |> UI.click(testid: "edit-check-in")
  end

  defp in_accordion(ctx, accordion_test_id, cb) do
    ctx
    |> UI.find(UI.query(testid: "#{accordion_test_id}-accordion"), fn el ->
      el
      |> UI.click(testid: "open-close-toggle")
      |> cb.()
      |> UI.click(testid: "open-close-toggle")
    end)
  end

  #
  # Assertions
  #

  def assert_check_in_submitted(ctx, opts) do
    ctx
    |> UI.assert_text("Check-In from")
    |> UI.assert_text(@labels.status[opts.status])
    |> UI.assert_text(@labels.schedule[opts.schedule])
    |> UI.assert_text(@labels.budget[opts.budget])
    |> UI.assert_text(@labels.team[opts.team])
    |> UI.assert_text(@labels.risks[opts.risks])
    |> UI.assert_text(opts.schedule_comments)
    |> UI.assert_text(opts.budget_comments)
    |> UI.assert_text(opts.team_comments)
    |> UI.assert_text(opts.risks_comments)
    |> UI.assert_text(opts.status_comments)
  end
  
  def assert_previous_check_in_values(ctx, opts) do
    ctx
    |> UI.assert_text("What's new since the last check-in?")
    |> UI.assert_text(@labels.status[opts.status])
    |> UI.assert_text(@labels.schedule[opts.schedule])
    |> UI.assert_text(@labels.budget[opts.budget])
    |> UI.assert_text(@labels.team[opts.team])
    |> UI.assert_text(@labels.risks[opts.risks])
    |> in_accordion("status", fn el ->
      el |> UI.assert_text(opts.status_comments)
    end)
    |> in_accordion("schedule", fn el ->
      el |> UI.assert_text(opts.schedule_comments)
    end)
    |> in_accordion("budget", fn el ->
      el |> UI.assert_text(opts.budget_comments)
    end)
    |> in_accordion("team", fn el ->
      el |> UI.assert_text(opts.team_comments)
    end)
    |> in_accordion("risks", fn el ->
      el |> UI.assert_text(opts.risks_comments)
    end)
  end
end
