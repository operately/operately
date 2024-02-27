defmodule Operately.Support.Features.ProjectCheckInSteps do
  alias Operately.Support.Features.UI

  @status_to_on_screen %{
    "on_track" => "On Track",
    "at_risk" => "At Risk",
    "off_track" => "Off Track"
  }

  def submit_check_in(ctx, %{status: status, description: description}) do
    ctx
    |> UI.visit("/projects/#{ctx.project.id}")
    |> UI.click(testid: "check-in-now")
    |> UI.click(testid: "status-dropdown")
    |> UI.click(testid: "status-dropdown-#{status}")
    |> UI.fill_rich_text(description)
    |> UI.click(testid: "post-check-in")
    |> UI.assert_text("Check-In from")
  end

  def assert_check_in_submitted(ctx, %{status: status, description: description}) do
    ctx
    |> UI.assert_text("Check-In from")
    |> UI.assert_text(description)
    |> UI.assert_text(@status_to_on_screen[status])
  end

  def assert_check_in_visible_on_project_page(ctx, %{status: status, description: description}) do
    ctx
    |> UI.visit("/projects/#{ctx.project.id}")
    |> UI.assert_text(description)
    |> UI.assert_text(@status_to_on_screen[status])
  end

  def assert_check_in_visible_on_feed(ctx, %{status: status, description: description}) do
    ctx
    |> UI.find(UI.query(testid: "project-feed"), fn el ->
      el
      |> UI.assert_text(description)
      |> UI.assert_text(@status_to_on_screen[status])
    end)
  end

  #def edit_check_in(ctx, updates) do
  #  ctx
  #  |> UI.click(testid: "options-button")
  #  |> UI.click(testid: "edit-check-in")
  #  |> in_accordion("status", fn el ->
  #    el = if Map.has_key?(updates, :status), do: UI.click(el, testid: "status-#{updates.status}"), else: el
  #    el = if Map.has_key?(updates, :status_comments), do: UI.fill_rich_text(el, updates.status_comments), else: el
  #    el
  #  end)
  #  |> in_accordion("schedule", fn el ->
  #    el = if Map.has_key?(updates, :schedule), do: UI.click(el, testid: "schedule-#{updates.schedule}"), else: el
  #    el = if Map.has_key?(updates, :schedule_comments), do: UI.fill_rich_text(el, updates.schedule_comments), else: el

  #    el 
  #  end)
  #  |> in_accordion("budget", fn el ->
  #    el = if Map.has_key?(updates, :budget), do: UI.click(el, testid: "budget-#{updates.budget}"), else: el
  #    el = if Map.has_key?(updates, :budget_comments), do: UI.fill_rich_text(el, updates.budget_comments), else: el

  #    el
  #  end)
  #  |> in_accordion("team", fn el ->
  #    el = if Map.has_key?(updates, :team), do: UI.click(el, testid: "team-#{updates.team}"), else: el
  #    el = if Map.has_key?(updates, :team_comments), do: UI.fill_rich_text(el, updates.team_comments), else: el

  #    el 
  #  end)
  #  |> in_accordion("risks", fn el ->
  #    el = if Map.has_key?(updates, :risks), do: UI.click(el, testid: "risks-#{updates.risks}"), else: el
  #    el = if Map.has_key?(updates, :risks_comments), do: UI.fill_rich_text(el, updates.risks_comments), else: el

  #    el 
  #  end)
  #  |> UI.click(testid: "save-changes")
  #end

  #defp in_accordion(ctx, accordion_test_id, cb) do
  #  ctx
  #  |> UI.find(UI.query(testid: "#{accordion_test_id}-accordion"), fn el ->
  #    el
  #    |> UI.click(testid: "open-close-toggle")
  #    |> cb.()
  #    |> UI.click(testid: "open-close-toggle")
  #  end)
  #end

  ##
  ## Assertions
  ##

  #def assert_check_in_submitted(ctx, opts) do
  #  ctx
  #  |> UI.assert_text("Check-In from")
  #  |> UI.assert_text(opts.schedule_comments)
  #  |> UI.assert_text(opts.budget_comments)
  #  |> UI.assert_text(opts.team_comments)
  #  |> UI.assert_text(opts.risks_comments)
  #  |> UI.assert_text(opts.status_comments)
  #end
  
  #def assert_previous_check_in_values(ctx, opts) do
  #  ctx
  #  |> UI.assert_text("What's new since the last check-in?")
  #  |> UI.assert_text(@labels.status[opts.status])
  #  |> UI.assert_text(@labels.schedule[opts.schedule])
  #  |> UI.assert_text(@labels.budget[opts.budget])
  #  |> UI.assert_text(@labels.team[opts.team])
  #  |> UI.assert_text(@labels.risks[opts.risks])
  #  |> in_accordion("status", fn el ->
  #    el |> UI.assert_text(opts.status_comments)
  #  end)
  #  |> in_accordion("schedule", fn el ->
  #    el |> UI.assert_text(opts.schedule_comments)
  #  end)
  #  |> in_accordion("budget", fn el ->
  #    el |> UI.assert_text(opts.budget_comments)
  #  end)
  #  |> in_accordion("team", fn el ->
  #    el |> UI.assert_text(opts.team_comments)
  #  end)
  #  |> in_accordion("risks", fn el ->
  #    el |> UI.assert_text(opts.risks_comments)
  #  end)
  #end
end
