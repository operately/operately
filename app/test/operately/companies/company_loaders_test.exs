defmodule Operately.Companies.CompanyLoadersTest do
  use Operately.DataCase

  import Operately.BlobsFixtures
  import Operately.GoalsFixtures
  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures

  alias Operately.Access.Binding
  alias Operately.Activities.Activity
  alias Operately.Companies.Company
  alias Operately.Companies.Permissions, as: CompanyPermissions
  alias Operately.Repo
  alias Operately.Repo.RequestInfo
  alias Operately.Support.Factory

  describe "load_permissions/2" do
    test "sets permissions from request_info access level" do
      company =
        %Company{}
        |> RequestInfo.populate_request_info(:system, Binding.admin_access())

      company = Company.load_permissions(company)

      assert company.permissions ==
               CompanyPermissions.calculate(Binding.admin_access(), company_read_only: false)
    end

    test "applies read-only mode when requested" do
      company =
        %Company{}
        |> RequestInfo.populate_request_info(:system, Binding.admin_access())

      company = Company.load_permissions(company, true)

      assert company.permissions ==
               CompanyPermissions.calculate(Binding.admin_access(), company_read_only: true)
    end
  end

  describe "load_people_count/1" do
    test "counts active members and excludes suspended ones", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.add_company_member(:member)
        |> Factory.suspend_company_member(:member)

      company = Company.load_people_count(ctx.company)

      assert company.people_count == 1
    end

    test "loads counts for multiple companies in one query", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.add_company_member(:member)

      ctx = Factory.add_company(ctx, :other_company, ctx.account)

      other_creator = company_creator(ctx.other_company)

      person_fixture_with_account(%{
        company_id: ctx.other_company.id,
        full_name: "Other Member"
      })

      [loaded_company, loaded_other] =
        Company.load_people_count([ctx.company, ctx.other_company])

      assert loaded_company.people_count == 2
      assert loaded_other.people_count == 2
      refute other_creator.id == ctx.creator.id
    end

    test "single-company overload matches list overload", ctx do
      ctx = ctx |> Factory.setup() |> Factory.add_company_member(:member)

      assert Company.load_people_count(ctx.company).people_count == 2
      assert hd(Company.load_people_count([ctx.company])).people_count == 2
    end
  end

  describe "load_goals_count/1" do
    test "defaults to 0 when a company has no goals", ctx do
      ctx = Factory.setup(ctx)

      assert Company.load_goals_count(ctx.company).goals_count == 0
    end

    test "counts goals for one and multiple companies", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.add_space(:space)
        |> Factory.add_goal(:goal1, :space)

      ctx = Factory.add_company(ctx, :other_company, ctx.account)

      other_creator = company_creator(ctx.other_company)
      other_space = group_fixture(other_creator, %{name: "Other Space"})

      goal_fixture(other_creator, %{space_id: other_space.id})
      goal_fixture(other_creator, %{space_id: other_space.id})

      [loaded_company, loaded_other] =
        Company.load_goals_count([ctx.company, ctx.other_company])

      assert loaded_company.goals_count == 1
      assert loaded_other.goals_count == 2
      assert Company.load_goals_count(ctx.company).goals_count == 1
    end
  end

  describe "load_spaces_count/1" do
    test "counts the general space for a new company", ctx do
      ctx = Factory.setup(ctx)

      assert Company.load_spaces_count(ctx.company).spaces_count == 1
    end

    test "counts additional spaces across companies", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.add_space(:space)

      ctx = Factory.add_company(ctx, :other_company, ctx.account)

      other_creator = company_creator(ctx.other_company)
      group_fixture(other_creator, %{name: "Other Space"})

      [loaded_company, loaded_other] =
        Company.load_spaces_count([ctx.company, ctx.other_company])

      assert loaded_company.spaces_count == 2
      assert loaded_other.spaces_count == 2
    end
  end

  describe "load_projects_count/1" do
    test "defaults to 0 when a company has no projects", ctx do
      ctx = Factory.setup(ctx)

      assert Company.load_projects_count(ctx.company).projects_count == 0
    end

    test "counts projects for one and multiple companies", ctx do
      ctx =
        ctx
        |> Factory.setup()
        |> Factory.add_space(:space)
        |> Factory.add_project(:project1, :space)

      ctx = Factory.add_company(ctx, :other_company, ctx.account)

      other_creator = company_creator(ctx.other_company)
      other_space = group_fixture(other_creator, %{name: "Other Space"})

      project_fixture(%{
        name: "Other Project 1",
        creator_id: other_creator.id,
        company_id: ctx.other_company.id,
        group_id: other_space.id
      })

      project_fixture(%{
        name: "Other Project 2",
        creator_id: other_creator.id,
        company_id: ctx.other_company.id,
        group_id: other_space.id
      })

      [loaded_company, loaded_other] =
        Company.load_projects_count([ctx.company, ctx.other_company])

      assert loaded_company.projects_count == 1
      assert loaded_other.projects_count == 2
    end
  end

  describe "load_storage_usage_bytes/1" do
    test "defaults to 0 when a company has no uploaded blobs", ctx do
      ctx = Factory.setup(ctx)

      assert Company.load_storage_usage_bytes(ctx.company).storage_usage_bytes == 0
    end

    test "sums uploaded company blobs and ignores pending ones", ctx do
      ctx = Factory.setup(ctx)

      blob_fixture(%{company_id: ctx.company.id, author_id: ctx.creator.id, status: :uploaded, size: 1024})
      blob_fixture(%{company_id: ctx.company.id, author_id: ctx.creator.id, status: :uploaded, size: 2048})
      blob_fixture(%{company_id: ctx.company.id, author_id: ctx.creator.id, status: :pending, size: 4096})

      assert Company.load_storage_usage_bytes(ctx.company).storage_usage_bytes == 3072
    end

    test "loads storage for multiple companies in one query", ctx do
      ctx = Factory.setup(ctx)
      ctx = Factory.add_company(ctx, :other_company, ctx.account)

      blob_fixture(%{company_id: ctx.company.id, author_id: ctx.creator.id, status: :uploaded, size: 1000})

      other_creator = company_creator(ctx.other_company)

      blob_fixture(%{
        company_id: ctx.other_company.id,
        author_id: other_creator.id,
        status: :uploaded,
        size: 500
      })

      blob_fixture(%{
        company_id: ctx.other_company.id,
        author_id: other_creator.id,
        status: :uploaded,
        size: 250
      })

      [loaded_company, loaded_other] =
        Company.load_storage_usage_bytes([ctx.company, ctx.other_company])

      assert loaded_company.storage_usage_bytes == 1000
      assert loaded_other.storage_usage_bytes == 750
    end
  end

  describe "load_last_activity_event/1" do
    test "defaults to nil when a company has no activities", ctx do
      ctx = Factory.setup(ctx)
      delete_company_activities(ctx.company)

      assert Company.load_last_activity_event(ctx.company).last_activity_at == nil
    end

    test "returns the most recent activity timestamp", ctx do
      ctx = Factory.setup(ctx)
      delete_company_activities(ctx.company)

      older = days_ago(10)
      newer = days_ago(2)

      insert_activity(ctx.company, older)
      insert_activity(ctx.company, newer)

      loaded = Company.load_last_activity_event(ctx.company)

      assert NaiveDateTime.truncate(loaded.last_activity_at, :second) ==
               NaiveDateTime.truncate(newer, :second)
    end

    test "loads last activity for multiple companies in one query", ctx do
      ctx = Factory.setup(ctx)
      ctx = Factory.add_company(ctx, :other_company, ctx.account)

      delete_company_activities(ctx.company)
      delete_company_activities(ctx.other_company)

      company_activity = days_ago(3)
      other_activity = days_ago(1)

      insert_activity(ctx.company, company_activity)
      insert_activity(ctx.other_company, other_activity)

      [loaded_company, loaded_other] =
        Company.load_last_activity_event([ctx.company, ctx.other_company])

      assert NaiveDateTime.truncate(loaded_company.last_activity_at, :second) ==
               NaiveDateTime.truncate(company_activity, :second)

      assert NaiveDateTime.truncate(loaded_other.last_activity_at, :second) ==
               NaiveDateTime.truncate(other_activity, :second)
    end
  end

  defp company_creator(company) do
    company |> Ecto.assoc(:people) |> Repo.all() |> hd()
  end

  defp delete_company_activities(company) do
    import Ecto.Query

    from(a in Activity,
      where: fragment("?->>? = ?", a.content, "company_id", ^to_string(company.id))
    )
    |> Repo.delete_all()
  end

  defp insert_activity(company, inserted_at) do
    timestamp = NaiveDateTime.truncate(inserted_at, :second)

    Repo.insert!(%Activity{
      action: "goal_created",
      content: %{
        "company_id" => to_string(company.id),
        "goal_id" => Ecto.UUID.generate()
      },
      inserted_at: timestamp,
      updated_at: timestamp
    })
  end

  defp days_ago(days) do
    DateTime.utc_now()
    |> DateTime.add(-days, :day)
    |> DateTime.to_naive()
    |> NaiveDateTime.truncate(:second)
  end
end
