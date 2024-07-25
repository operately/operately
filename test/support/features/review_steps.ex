defmodule Operately.Support.Features.ReviewSteps do
  use Operately.FeatureCase

  import Ecto.Query, only: [from: 2]
  import Operately.Support.RichText, only: [rich_text: 1]
  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures
  import Operately.GoalsFixtures

  alias OperatelyWeb.Paths
  alias Operately.Goals.Goal
  alias Operately.Updates.Update
  alias Operately.Projects.{Project, CheckIn}
  alias Operately.Support.Features.UI

  step :setup, ctx do
    company = company_fixture(%{name: "Test Org"})

    person = person_fixture_with_account(%{full_name: "Main Person", company_id: company.id})
    other_person = person_fixture_with_account(%{full_name: "Other Person", company_id: company.id})

    ctx = Map.merge(ctx, %{company: company, person: person, other_person: other_person})
    ctx = UI.login_as(ctx, ctx.person)

    ctx
  end

  step :setup_projects, ctx, attrs do
    create_project(ctx.person, ctx.other_person, ctx.company, DateTime.utc_now(), attrs.today)
    create_project(ctx.person, ctx.other_person, ctx.company, past_date(), attrs.due)
    create_project(ctx.person, ctx.other_person, ctx.company, upcoming_date())
    create_project(ctx.person, ctx.other_person, ctx.company, past_date()) |> close_project()

    ctx
  end

  step :setup_check_ins, ctx, name do
    create_project(ctx.other_person, ctx.person, ctx.company, DateTime.utc_now(), name)
    |> create_check_in()

    create_project(ctx.other_person, ctx.person, ctx.company, past_date())
    |> create_check_in()

    ctx
  end

  step :setup_goals, ctx, attrs do
    create_goal(ctx.person, ctx.other_person, ctx.company, DateTime.utc_now(), attrs.today)
    create_goal(ctx.person, ctx.other_person, ctx.company, past_date(), attrs.due)
    create_goal(ctx.person, ctx.other_person, ctx.company, upcoming_date())
    create_goal(ctx.person, ctx.other_person, ctx.company, past_date()) |> close_goal()

    ctx
  end

  step :setup_updates, ctx, name do
    create_goal(ctx.other_person, ctx.person, ctx.company, DateTime.utc_now(), name)
    |> create_update(ctx.other_person)

    create_goal(ctx.other_person, ctx.person, ctx.company, past_date(), name)
    |> create_update(ctx.other_person)

    ctx
  end

  step :visit_review_page, ctx do
    ctx
    |> UI.visit(Paths.home_path(ctx.company))
    |> UI.click(testid: "review-link")
  end

  step :check_in_project, ctx, name do
    test_id = from(p in Project,
        where: p.name == ^name,
        select: p
      )
      |> Repo.all()
      |> List.first()
      |> Paths.project_id()

    ctx
    |> UI.find(testid: test_id)
    |> UI.assert_text("Write the weekly check-in:")
    |> UI.assert_text(name)

    ctx
    |> UI.click(testid: test_id)
    |> UI.click(testid: "status-dropdown")
    |> UI.click(testid: "status-dropdown-on_track")
    |> UI.fill_rich_text("Going well")
    |> UI.click(testid: "post-check-in")
    |> UI.assert_text("Check-In from")
  end

  step :check_in_goal, ctx, name do
    test_id = from(
        g in Goal,
        where: g.name == ^name,
        select: g
      )
      |> Repo.all()
      |> List.first()
      |> Paths.goal_id()

    ctx
    |> UI.find(testid: test_id)
    |> UI.assert_text("Update progress:")
    |> UI.assert_text(name)

    ctx
    |> UI.click(testid: test_id)
    |> UI.fill_rich_text("Going well")
    |> UI.click(testid: "submit-update")
    |> UI.assert_text("Progress Update from")
  end

  step :acknowledge_check_in, ctx, name do
    test_id = from(c in CheckIn,
        join: p in assoc(c, :project),
        where: p.name == ^name,
        select: c
      )
      |> Repo.all()
      |> List.first()
      |> Paths.project_check_in_id()

    ctx
    |> UI.find(testid: test_id)
    |> UI.assert_text("Review:")
    |> UI.assert_text(name)
    |> UI.assert_text(ctx.other_person.full_name <> " submitted a weekly check-in")

    ctx
    |> UI.click(testid: test_id)
    |> UI.click(testid: "acknowledge-check-in")
  end

  step :acknowledge_goal_check_in, ctx, name do
    test_id = from(u in Update,
        join: g in Goal, on: u.updatable_id == g.id,
        where: g.name == ^name,
        select: u
      )
      |> Repo.all()
      |> List.first()
      |> Paths.goal_update_id()

    ctx
    |> UI.find(testid: test_id)
    |> UI.assert_text("Review:")
    |> UI.assert_text(name)
    |> UI.assert_text(ctx.other_person.full_name <> " submitted an update")

    ctx
    |> UI.click(testid: test_id)
    |> UI.click(testid: "acknowledge-check-in")
  end

  step :assert_title, ctx, count do
    ctx
    |> UI.assert_text("Review (#{count})")
  end

  step :assert_navbar_count, ctx, count do
    ctx
    |> UI.assert_text(Integer.to_string(count), testid: "review-link-count")
  end

  #
  # Helpers
  #

  defp upcoming_date do
    Date.utc_today()
    |> Date.add(3)
    |> Operately.Time.as_datetime()
  end

  defp past_date do
    Date.utc_today()
    |> Date.add(-3)
    |> Operately.Time.as_datetime()
  end

  defp create_project(person, reviewer, company, date, name \\ "some name") do
    {:ok, project} =
      project_fixture(%{
        company_id: company.id,
        creator_id: person.id,
        reviewer_id: reviewer.id,
        group_id: company.company_space_id,
        name: name,
      })
      |> Project.changeset(%{next_check_in_scheduled_at: date})
      |> Repo.update()

    project
  end

  defp close_project(project) do
    {:ok, project} =
      Project.changeset(project, %{
        status: "closed",
        closed_at: DateTime.utc_now(),
        closed_by_id: project.creator_id,
      })
      |> Repo.update()

    project
  end

  defp create_goal(person, reviewer, company, date, name \\ "some name") do
    {:ok, goal} =
      goal_fixture(person, %{
        space_id: company.company_space_id,
        reviewer_id: reviewer.id,
        name: name,
      })
      |> Goal.changeset(%{next_update_scheduled_at: date})
      |> Repo.update()

    goal
  end

  defp close_goal(goal) do
    {:ok, goal} =
      Goal.changeset(goal, %{
        closed_at: DateTime.utc_now(),
        closed_by_id: goal.creator_id,
      })
      |> Repo.update()

    goal
  end

  defp create_check_in(project) do
    project = Repo.preload(project, :champion)
    check_in_fixture(%{
      author_id: project.champion.id,
      project_id: project.id,
    })
  end

  defp create_update(goal, person) do
    content = rich_text("Doing well")
    Operately.Operations.GoalCheckIn.run(person, goal, content, [])
  end
end
