Code.require_file("spec_definition.ex", __DIR__)

defmodule OperatelyWeb.Api.ExternalQueries.Specs do
  use OperatelyWeb.Api.ExternalQueries.SpecDefinition

  import ExUnit.Assertions
  import Ecto.Query, only: [from: 2]

  alias Operately.Activities.Activity
  alias Operately.Repo
  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  query :get_account do
    setup &Factory.setup/1
    assert &assert_get_account/2
  end

  query :get_activities do
    setup &setup_activity/1
    inputs &get_activities_inputs/1
    assert &assert_get_activities/2
  end

  query :get_activity do
    setup &setup_activity/1
    inputs &get_activity_inputs/1
    assert &assert_get_activity/2
  end

  query :get_assignments_count do
    setup &Factory.setup/1
    assert &assert_get_assignments_count/2
  end

  query :get_assignments do
    setup &Factory.setup/1
    assert &assert_get_assignments/2
  end

  query :get_binded_people do
    setup &setup_project/1
    inputs &get_binded_people_inputs/1
    assert &assert_get_binded_people/2
  end

  query :get_comments do
    setup &setup_comments/1
    inputs &get_comments_inputs/1
    assert &assert_get_comments/2
  end

  query :get_companies do
    setup &Factory.setup/1
    assert &assert_get_companies/2
  end

  query :get_company do
    setup &Factory.setup/1
    inputs &get_company_inputs/1
    assert &assert_get_company/2
  end

  query :get_discussion do
    setup &setup_discussion/1
    inputs &get_discussion_inputs/1
    assert &assert_get_discussion/2
  end

  query :get_discussions do
    setup &setup_discussion/1
    inputs &get_discussions_inputs/1
    assert &assert_get_discussions/2
  end

  query :get_flat_work_map do
    setup &Factory.setup/1
    assert &assert_get_flat_work_map/2
  end

  query "goals/get_check_ins" do
    setup &setup_goal_update/1
    inputs &get_goal_check_ins_inputs/1
    assert &assert_get_goal_check_ins/2
  end

  query :get_goal_progress_update do
    setup &setup_goal_update/1
    inputs &get_goal_progress_update_inputs/1
    assert &assert_get_goal_progress_update/2
  end

  query :get_goal do
    setup &setup_goal/1
    inputs &get_goal_inputs/1
    assert &assert_get_goal/2
  end

  query :get_goals do
    setup &setup_goal/1
    inputs &get_goals_inputs/1
    assert &assert_get_goals/2
  end

  def setup_activity(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space)
  end

  def setup_project(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
  end

  def setup_discussion(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_messages_board(:messages_board, :space)
    |> Factory.add_message(:message, :messages_board)
  end

  def setup_comments(ctx) do
    ctx
    |> setup_discussion()
    |> Factory.preload(:message, :space)
    |> Factory.add_comment(:comment, :message)
  end

  def setup_goal(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space)
  end

  def setup_goal_update(ctx) do
    ctx
    |> setup_goal()
    |> Factory.add_goal_update(:goal_update, :goal, :creator)
  end

  def get_activities_inputs(ctx) do
    %{
      scope_type: :company,
      scope_id: Paths.company_id(ctx.company),
      actions: []
    }
  end

  def get_activity_inputs(_ctx) do
    activity =
      from(a in Activity,
        where: a.action == "goal_created",
        order_by: [desc: a.inserted_at],
        limit: 1
      )
      |> Repo.one!()

    %{id: activity.id}
  end

  def get_binded_people_inputs(ctx) do
    %{
      resourse_type: "project",
      resourse_id: Paths.project_id(ctx.project)
    }
  end

  def get_comments_inputs(ctx) do
    %{
      entity_id: Paths.message_id(ctx.message),
      entity_type: "message"
    }
  end

  def get_company_inputs(ctx) do
    %{id: Paths.company_id(ctx.company)}
  end

  def get_discussion_inputs(ctx) do
    %{id: Paths.message_id(ctx.message)}
  end

  def get_discussions_inputs(ctx) do
    %{space_id: Paths.space_id(ctx.space)}
  end

  def get_goal_check_ins_inputs(ctx) do
    %{goal_id: Paths.goal_id(ctx.goal)}
  end

  def get_goal_progress_update_inputs(ctx) do
    %{id: Paths.goal_update_id(ctx.goal_update)}
  end

  def get_goal_inputs(ctx) do
    %{id: Paths.goal_id(ctx.goal)}
  end

  def get_goals_inputs(ctx) do
    %{space_id: Paths.space_id(ctx.space)}
  end

  def assert_get_account(response, ctx) do
    account = Operately.People.get_account!(ctx.creator.account_id)

    assert response == %{
      account: %{
        full_name: account.full_name,
        site_admin: account.site_admin
      }
    }
  end

  def assert_get_activities(response, _ctx) do
    assert is_list(response.activities)
  end

  def assert_get_activity(response, _ctx) do
    assert response.activity
    assert is_binary(response.activity.id)
  end

  def assert_get_assignments_count(response, _ctx) do
    assert is_integer(response.count)
  end

  def assert_get_assignments(response, _ctx) do
    assert is_list(response.assignments)
  end

  def assert_get_binded_people(response, ctx) do
    assert is_list(response.people)
    assert Enum.any?(response.people, fn person -> person.id == Paths.person_id(ctx.creator) end)
  end

  def assert_get_comments(response, ctx) do
    assert is_list(response.comments)
    assert Enum.any?(response.comments, fn comment -> comment.id == Paths.comment_id(ctx.comment) end)
  end

  def assert_get_companies(response, ctx) do
    assert is_list(response.companies)
    assert Enum.any?(response.companies, fn company -> company.id == Paths.company_id(ctx.company) end)
  end

  def assert_get_company(response, ctx) do
    assert response.company
    assert response.company.id == Paths.company_id(ctx.company)
  end

  def assert_get_discussion(response, _ctx) do
    assert response.discussion
    assert response.discussion.title
    assert response.discussion.body
  end

  def assert_get_discussions(response, ctx) do
    assert is_list(response.discussions)
    assert is_list(response.my_drafts)
    assert Enum.any?(response.discussions, fn discussion -> discussion.id == Paths.message_id(ctx.message) end)
  end

  def assert_get_flat_work_map(response, _ctx) do
    assert response.work_map == []
  end

  def assert_get_goal_check_ins(response, ctx) do
    assert is_list(response.check_ins)
    assert Enum.any?(response.check_ins, fn check_in -> check_in.id == Paths.goal_update_id(ctx.goal_update) end)
  end

  def assert_get_goal_progress_update(response, ctx) do
    assert response.update
    assert response.update.id == Paths.goal_update_id(ctx.goal_update)
  end

  def assert_get_goal(response, ctx) do
    assert response.goal
    assert response.goal.id == Paths.goal_id(ctx.goal)
  end

  def assert_get_goals(response, ctx) do
    assert is_list(response.goals)
    assert Enum.any?(response.goals, fn goal -> goal.id == Paths.goal_id(ctx.goal) end)
  end
end
