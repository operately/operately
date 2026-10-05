defmodule OperatelyEmail.Emails.CompanyMembersPermissionsEditedEmailTest do
  use Operately.DataCase
  import Swoosh.TestAssertions

  alias Operately.Support.Factory
  alias OperatelyEmail.Emails.CompanyMembersPermissionsEditedEmail

  test "access labels translate only in email presentation" do
    ctx = Factory.setup(%{})

    for {level, english, portuguese} <- [
          {nil, "No Access", "Sem acesso"},
          {0, "No Access", "Sem acesso"},
          {1, "No Access", "Sem acesso"},
          {10, "View Access", "Somente leitura"},
          {40, "Comment Access", "Acesso para comentar"},
          {70, "Edit Access", "Acesso de edição"},
          {90, "Admin Access", "Acesso de administrador"},
          {100, "Full Access", "Acesso total"}
        ] do
      activity =
        Operately.ActivitiesFixtures.activity_fixture(
          author_id: ctx.creator.id,
          action: "company_members_permissions_edited",
          content: %{"members" => [%{"person_id" => ctx.creator.id, "previous_access_level" => level, "updated_access_level" => level}]}
        )

      for {locale, label} <- [{"en", english}, {"pt_BR", portuguese}, {"fr", english}] do
        Gettext.with_locale(OperatelyWeb.Gettext, locale, fn -> CompanyMembersPermissionsEditedEmail.send(ctx.creator, activity) end)

        assert_email_sent(fn email ->
          assert email.html_body =~ label
          assert email.text_body =~ label
          true
        end)
      end

      if level, do: assert(Operately.Access.Binding.label(level) == english)
      assert hd(Operately.Repo.reload!(activity).content["members"])["updated_access_level"] == level
    end
  end
end
