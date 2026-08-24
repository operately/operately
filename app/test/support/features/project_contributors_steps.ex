defmodule Operately.Support.Features.ProjectContributorsSteps do
  use Operately.FeatureCase

  alias Operately.Support.Features.ProjectSteps
  alias Operately.Support.Features.NotificationsSteps
  alias Operately.Support.Features.EmailSteps
  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.People.Person

  import Operately.PeopleFixtures

  defdelegate login(ctx), to: ProjectSteps
  defdelegate visit_project_page(ctx), to: ProjectSteps
  defdelegate create_project(ctx, attrs), to: ProjectSteps
  defdelegate setup_contributors(ctx), to: ProjectSteps
  defdelegate assert_logged_in_contributor_has_edit_access(ctx), to: ProjectSteps
  defdelegate assert_logged_in_contributor_has_comment_access(ctx), to: ProjectSteps

  step :setup, ctx do
    ctx
    |> create_project(name: "Test Project")
    |> setup_contributors()
    |> login()
  end

  step :setup_default_people, ctx do
    ctx
    |> given_a_person_exists(name: "Michael Scott")
  end

  step :given_a_person_exists, ctx, name: name do
    person_fixture_with_account(%{
      full_name: name,
      title: "Manager",
      company_id: ctx.company.id
    })

    ctx
  end

  step :assert_logged_in_champion_has_full_access, ctx do
    {:ok, project} = Operately.Projects.Project.get(ctx.champion, id: ctx.project.id)

    assert project.request_info.access_level == Binding.full_access()

    UI.login_as(ctx, ctx.champion)
  end

  step :start_adding_contributor, ctx do
    ctx
    |> UI.click(testid: "add-contributor")
    |> UI.assert_has(testid: "project-contributor-form")
  end

  step :add_contributor, ctx, attrs do
    name = Map.fetch!(attrs, :name)
    responsibility = Map.fetch!(attrs, :responsibility)
    access = Map.get(attrs, :access)

    ctx
    |> start_adding_contributor()
    |> UI.click(testid: "person-field")
    |> UI.click(testid: UI.testid(["person-field", "search-result", name]))
    |> maybe_choose_access(access)
    |> UI.fill(testid: "contributor-responsibility-input", with: responsibility)
    |> UI.click_button("Save contributor")
    |> UI.sleep(300)
  end

  step :assert_contributor_added, ctx, attrs do
    name = Map.fetch!(attrs, :name)
    responsibility = Map.fetch!(attrs, :responsibility)

    attempts(ctx, 5, fn ->
      found = contributor_by_name(ctx, name)

      assert found != nil
      assert found.responsibility == responsibility
    end)

    found = contributor_by_name(ctx, name)

    ctx
    |> UI.assert_has(testid: "contributor-#{Paths.project_contributor_id(found)}")
    |> UI.assert_text(name)
    |> UI.assert_text(responsibility)
  end

  step :assert_access_level_of_added_contributor, ctx, attrs do
    name = Map.fetch!(attrs, :name)
    access = Map.fetch!(attrs, :access)
    person = Operately.People.get_person_by_name!(ctx.company, name)
    access_level = access |> String.downcase() |> String.replace(" ", "_") |> String.to_atom()
    project = Operately.Projects.Project.get!(person, id: ctx.project.id)

    assert project.request_info.access_level == Binding.from_atom(access_level)

    ctx
  end

  step :assert_full_access_option_not_available, ctx do
    ctx
    |> UI.click(testid: "project-contributor-access")
    |> UI.assert_text("View Access")
    |> UI.assert_text("Comment Access")
    |> UI.assert_text("Edit Access")
    |> UI.refute_text("Full Access")
  end

  step :assert_contributor_added_feed_item_exists, ctx, name: name do
    first_name = Person.first_name(Operately.People.get_person_by_name!(ctx.company, name))

    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.click(testid: "tab-activity")
    |> UI.assert_feed_item(ctx.champion, "added #{first_name} to the project")
    |> UI.visit(Paths.space_path(ctx.company, ctx.group))
    |> UI.assert_feed_item(ctx.champion, "added #{first_name} to the #{ctx.project.name} project")
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(ctx.champion, "added #{first_name} to the #{ctx.project.name} project")
  end

  step :assert_contributor_removed_feed_item_exists, ctx, name: name do
    first_name = Person.get_by!(:system, full_name: name) |> Person.first_name()

    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.click(testid: "tab-activity")
    |> UI.assert_feed_item(ctx.champion, "removed #{first_name} from the project")
    |> UI.visit(Paths.space_path(ctx.company, ctx.group))
    |> UI.assert_feed_item(ctx.champion, "removed #{first_name} from the #{ctx.project.name} project")
    |> UI.visit(Paths.feed_path(ctx.company))
    |> UI.assert_feed_item(ctx.champion, "removed #{first_name} from the #{ctx.project.name} project")
  end

  step :assert_contributor_added_notification_sent, ctx, name: name do
    person = contributor_by_name(ctx, name).person

    ctx
    |> UI.login_as(person)
    |> NotificationsSteps.assert_activity_notification(%{
      author: ctx.champion,
      action: "Added you as a contributor"
    })
  end

  step :assert_contributor_added_email_sent, ctx, name: name do
    person = contributor_by_name(ctx, name).person

    ctx
    |> EmailSteps.assert_activity_email_sent(%{
      where: ctx.project.name,
      to: person,
      author: ctx.champion,
      action: "added you as a contributor"
    })
  end

  step :given_the_project_has_contributor, ctx, attrs do
    name = Keyword.get(attrs, :name)
    access = Keyword.get(attrs, :access, Binding.edit_access())

    contrib = person_fixture_with_account(%{full_name: name, title: "Manager", company_id: ctx.company.id})

    {:ok, _} =
      Operately.Projects.create_contributor(contrib, %{
        person_id: contrib.id,
        role: "contributor",
        project_id: ctx.project.id,
        responsibility: "Lead the backend implementation",
        permissions: access
      })

    ctx
  end

  step :start_editing_contributor, ctx, name: name do
    public_id = contributor_public_id(ctx, name)

    ctx
    |> UI.click(testid: "contributor-#{public_id}")
    |> UI.click(testid: "edit-contributor-#{public_id}")
    |> UI.assert_has(testid: "project-contributor-form")
  end

  step :edit_contributor, ctx, responsibility: responsibility, access: access do
    ctx
    |> maybe_choose_access(access)
    |> UI.fill(testid: "contributor-responsibility-input", with: responsibility)
    |> UI.click_button("Save contributor")
    |> UI.sleep(300)
  end

  step :assert_access_field_is_editable, ctx do
    ctx
    |> UI.click(testid: "project-contributor-access")
    |> UI.assert_text("View Access")
    |> UI.assert_text("Edit Access")
    |> UI.click(testid: "project-contributor-access")
  end

  step :assert_access_field_is_readonly, ctx, label: label do
    ctx
    |> UI.assert_text(label)
    |> UI.click(testid: "project-contributor-access")
    |> UI.refute_has(testid: "project-contributor-access-10")
    |> UI.refute_has(testid: "project-contributor-access-70")
    |> UI.refute_has(testid: "project-contributor-access-100")
  end

  step :assert_contributor_attributes, ctx, attrs do
    name = Keyword.get(attrs, :name)
    responsibility = Keyword.get(attrs, :responsibility)
    access = Keyword.get(attrs, :access)

    attempts(ctx, 5, fn ->
      found = contributor_by_name(ctx, name)

      assert found != nil
      if responsibility, do: assert(found.responsibility == responsibility)
    end)

    found = contributor_by_name(ctx, name)

    ctx = ctx |> UI.assert_has(testid: "contributor-#{Paths.project_contributor_id(found)}") |> UI.assert_text(name)

    ctx =
      if responsibility do
        UI.assert_text(ctx, responsibility)
      else
        ctx
      end

    if access do
      assert_access_level_of_added_contributor(ctx, %{name: name, access: access})
    else
      ctx
    end
  end

  step :remove_contributor, ctx, name: name do
    public_id = contributor_public_id(ctx, name)

    ctx
    |> UI.click(testid: "contributor-#{public_id}")
    |> UI.click(testid: "remove-contributor-#{public_id}")
    |> UI.sleep(300)
  end

  step :assert_contributor_removed, ctx, name: name do
    ctx
    |> UI.visit(Paths.project_path(ctx.company, ctx.project))
    |> UI.refute_text(name)

    refute contributor_by_name(ctx, name)

    ctx
  end

  step :assert_cannot_remove_user, ctx, name: name do
    public_id = contributor_public_id(ctx, name)

    ctx
    |> UI.click(testid: "contributor-#{public_id}")
    |> UI.assert_has(testid: "edit-contributor-#{public_id}")
    |> UI.refute_has(testid: "remove-contributor-#{public_id}")
  end

  step :assert_can_remove_user, ctx, name: name do
    public_id = contributor_public_id(ctx, name)

    ctx
    |> UI.click(testid: "contributor-#{public_id}")
    |> UI.assert_has(testid: "edit-contributor-#{public_id}")
    |> UI.assert_has(testid: "remove-contributor-#{public_id}")
    |> UI.click(testid: "contributor-#{public_id}")
  end

  step :given_company_members_have_access, ctx do
    person =
      person_fixture_with_account(%{
        company_id: ctx.company.id,
        full_name: "Michael Scott"
      })

    Map.put(ctx, :company_member, person)
  end

  step :open_other_people_with_access, ctx do
    ctx
    |> UI.click(testid: "other-people-with-access-link")
    |> UI.assert_has(testid: "other-people-with-access-modal")
  end

  step :assert_other_people_listed, ctx do
    UI.find(ctx, UI.query(testid: "other-people-list"), fn ctx ->
      UI.assert_text(ctx, ctx.company_member.full_name)
    end)
  end

  step :change_company_access_to_no_access, ctx do
    ctx
    |> UI.click(testid: "project-privacy-field")
    |> UI.select(testid: "project-privacy-field-company-select", option: "No Access")
    |> UI.click(testid: "save")
    |> UI.sleep(300)
  end

  step :assert_company_access_is_no_access, ctx do
    attempts(ctx, 3, fn ->
      context = Access.get_context(project_id: ctx.project.id)
      company_members = Access.get_group!(company_id: ctx.project.company_id, tag: :standard)
      company_binding = Access.get_binding(context_id: context.id, group_id: company_members.id)

      assert company_binding.access_level == Binding.no_access()
    end)
  end

  defp maybe_choose_access(ctx, nil), do: ctx

  defp maybe_choose_access(ctx, access) do
    value = access_level_value(access)

    ctx
    |> UI.click(testid: "project-contributor-access")
    |> UI.click(testid: "project-contributor-access-#{value}")
  end

  defp access_level_value("View Access"), do: 10
  defp access_level_value("Comment Access"), do: 40
  defp access_level_value("Edit Access"), do: 70
  defp access_level_value("Full Access"), do: 100

  defp list_contributors(ctx) do
    ctx.project
    |> Operately.Projects.list_project_contributors()
    |> Operately.Repo.preload(:person)
  end

  defp contributor_by_name(ctx, name) do
    Enum.find(list_contributors(ctx), fn c -> c.person.full_name == name end)
  end

  defp contributor_public_id(ctx, name) do
    Paths.project_contributor_id(contributor_by_name(ctx, name))
  end
end
