defmodule Operately.ProjectTemplates.PersonTest do
  use Operately.DataCase

  alias Operately.Access.Binding
  alias Operately.ProjectTemplates.Person, as: TemplatePerson
  alias Operately.Repo
  alias Operately.Support.Factory

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project_template(:template, :space)
    |> Factory.add_company_member(:member)
  end

  test "requires template ownership, role, and a valid access level", ctx do
    refute TemplatePerson.changeset(%{}).valid?

    role_changeset =
      TemplatePerson.changeset(%{
        project_template_id: ctx.template.id,
        person_id: ctx.member.id,
        role: :owner,
        access_level: Binding.edit_access()
      })

    assert "is invalid" in errors_on(role_changeset).role

    changeset =
      TemplatePerson.changeset(%{
        project_template_id: ctx.template.id,
        person_id: ctx.member.id,
        role: :contributor,
        access_level: 42
      })

    assert "invalid access level" in errors_on(changeset).access_level
  end

  test "keeps the template person when the company person is deleted", ctx do
    template_person =
      TemplatePerson.changeset(%{
        project_template_id: ctx.template.id,
        person_id: ctx.member.id,
        role: :champion,
        access_level: Binding.full_access()
      })
      |> Repo.insert!()

    Repo.delete!(ctx.member)

    assert Repo.reload!(template_person).person_id == nil
  end

  test "deleting a template cascades its copied people", ctx do
    template_person = Factory.add_project_template_person(ctx, :template_person, :template, :member).template_person

    Repo.delete!(ctx.template)

    assert Repo.get(TemplatePerson, template_person.id) == nil
  end
end
