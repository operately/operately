defmodule Operately.Notifications.EmailWorkerTest do
  use Operately.DataCase

  import Swoosh.TestAssertions
  import Mock

  import Operately.ActivitiesFixtures
  import Operately.CompaniesFixtures
  import Operately.NotificationsFixtures
  import Operately.PeopleFixtures

  alias Operately.Notifications
  alias Operately.Notifications.EmailWorker

  setup do
    company = company_fixture()
    person = person_fixture_with_account(%{company_id: company.id})
    activity = activity_fixture(author_id: person.id)

    notification =
      notification_fixture(
        activity_id: activity.id,
        person_id: person.id,
        email_sent: false,
        email_sent_at: nil
      )

    {:ok, company: company, person: person, activity: activity, notification: notification}
  end

  test "marks notification as sent after successful delivery", ctx do
    with_mocks([
      {Operately.People, [:passthrough], [get_person!: fn _id -> ctx.person end]},
      {Operately.Activities, [:passthrough], [get_activity!: fn _id -> %Operately.Activities.Activity{action: "project_created"} end]},
      {OperatelyEmail.Emails.ProjectCreatedEmail, [:passthrough], [send: fn _person, _activity -> {:ok, :delivered} end]}
    ]) do
      assert :ok = EmailWorker.perform(%{args: %{"notification_id" => ctx.notification.id}})
    end

    notification = Notifications.get_notification!(ctx.notification.id)

    assert notification.email_sent
    refute is_nil(notification.email_sent_at)
  end

  test "does not mark notification as sent when delivery returns an error", ctx do
    with_mocks([
      {Operately.People, [:passthrough], [get_person!: fn _id -> ctx.person end]},
      {Operately.Activities, [:passthrough], [get_activity!: fn _id -> %Operately.Activities.Activity{action: "project_created"} end]},
      {OperatelyEmail.Emails.ProjectCreatedEmail, [:passthrough], [send: fn _person, _activity -> {:error, :smtp_failure} end]}
    ]) do
      assert {:error, :smtp_failure} = EmailWorker.perform(%{args: %{"notification_id" => ctx.notification.id}})
    end

    notification = Notifications.get_notification!(ctx.notification.id)

    refute notification.email_sent
    assert is_nil(notification.email_sent_at)
  end

  test "completes skipped delivery without marking the notification as sent", ctx do
    with_mocks([
      {Operately.Activities, [:passthrough], [get_activity!: fn _id -> %Operately.Activities.Activity{action: "goal_check_in"} end]},
      {OperatelyEmail.Emails.GoalCheckInEmail, [:passthrough], [send: fn _person, _activity -> :skip end]}
    ]) do
      assert {:ok, :skipped} = EmailWorker.deliver(ctx.notification)
      assert :ok = EmailWorker.perform(%{args: %{"notification_id" => ctx.notification.id}})
    end

    notification = Notifications.get_notification!(ctx.notification.id)
    refute notification.email_sent
    assert is_nil(notification.email_sent_at)
  end

  test "scopes Gettext to the recipient and restores the previous locale after failure", ctx do
    previous = Gettext.get_locale(OperatelyWeb.Gettext)
    Gettext.put_locale(OperatelyWeb.Gettext, "en")
    on_exit(fn -> Gettext.put_locale(OperatelyWeb.Gettext, previous) end)

    {:ok, company} = Operately.Companies.enable_experimental_feature(ctx.company, "i18n")
    {:ok, person} = Operately.People.update_person(ctx.person, %{language: "pt-BR"})
    person = %{person | company: company}

    with_mocks([
      {Operately.People, [:passthrough], [get_person!: fn _id -> person end]},
      {Operately.Activities, [:passthrough], [get_activity!: fn _id -> %Operately.Activities.Activity{action: "project_created"} end]},
      {OperatelyEmail.Emails.ProjectCreatedEmail, [:passthrough],
       [
         send: fn _person, _activity ->
           assert Gettext.get_locale(OperatelyWeb.Gettext) == "pt_BR"
           {:error, :smtp_failure}
         end
       ]}
    ]) do
      assert {:error, :smtp_failure} = EmailWorker.perform(%{args: %{"notification_id" => ctx.notification.id}})
    end

    assert Gettext.get_locale(OperatelyWeb.Gettext) == "en"
    assert Operately.People.get_person!(person.id).language == "pt-BR"
  end

  test "does not mark notification as sent when recipient has no account", ctx do
    person_without_account = person_fixture(company_id: ctx.company.id, email: unique_account_email())

    notification =
      notification_fixture(
        activity_id: ctx.activity.id,
        person_id: person_without_account.id,
        email_sent: false,
        email_sent_at: nil
      )

    with_mocks([
      {Operately.People, [:passthrough], [get_person!: fn _id -> person_without_account end]},
      {Operately.Activities, [:passthrough], [get_activity!: fn _id -> %Operately.Activities.Activity{action: "project_created"} end]}
    ]) do
      assert :ok = EmailWorker.perform(%{args: %{"notification_id" => notification.id}})
    end

    notification = Notifications.get_notification!(notification.id)

    refute notification.email_sent
    assert is_nil(notification.email_sent_at)
  end

  test "discussion and document deliveries scope language per recipient and honor flag rollback" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_company_member(:portuguese, name: "Portuguese Reader")
      |> Factory.add_company_member(:english, name: "English Reader")
      |> Factory.add_space(:space, name: "Space <literal>")
      |> Factory.add_messages_board(:board, :space)
      |> Factory.add_message(:discussion, :board, title: "Discussion <literal>")
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_document(:document, :hub, name: "Document <literal>")
      |> Factory.preload(:document, [:node, :resource_hub])
      |> Factory.add_comment(:comment, :document)

    {:ok, _} = Operately.People.update_person(ctx.portuguese, %{language: "pt-BR"})
    {:ok, company} = Operately.Companies.enable_experimental_feature(ctx.company, "i18n")
    previous_locale = Gettext.get_locale(OperatelyWeb.Gettext)

    scenarios = [
      {"discussion_posting", %{"discussion_id" => ctx.discussion.id}, "publicou:", "posted:", "Discussion <literal>"},
      {"resource_hub_document_commented", %{"document_id" => ctx.document.id, "comment_id" => ctx.comment.id}, "comentou em:", "commented on:", "Document <literal>"}
    ]

    for {action, content, portuguese, english, name} <- scenarios do
      activity = activity_fixture(author_id: ctx.creator.id, action: action, content: content)

      for {person, expected} <- [{ctx.portuguese, portuguese}, {ctx.english, english}, {ctx.portuguese, portuguese}] do
        assert_localized_delivery(activity, person, expected, name)
        assert Gettext.get_locale(OperatelyWeb.Gettext) == previous_locale
      end
    end

    {:ok, _} = Operately.Companies.disable_experimental_feature(company, "i18n")

    for {action, content, _portuguese, english, name} <- scenarios do
      activity = activity_fixture(author_id: ctx.creator.id, action: action, content: content)
      assert_localized_delivery(activity, ctx.portuguese, english, name)
      assert Gettext.get_locale(OperatelyWeb.Gettext) == previous_locale
    end

    assert Operately.People.get_person!(ctx.portuguese.id).language == "pt-BR"
  end

  defp assert_localized_delivery(activity, person, expected, name) do
    notification = notification_fixture(activity_id: activity.id, person_id: person.id, email_sent: false)
    flush_emails()
    assert {:ok, :sent} = EmailWorker.deliver(notification)

    assert_email_sent(fn email ->
      assert email.to == [{"", person.email}]
      assert email.subject =~ expected
      assert email.subject =~ name
      assert email.html_body =~ expected
      assert email.text_body =~ expected
      assert email.text_body =~ name
      assert email.html_body =~ "&lt;literal&gt;"
      refute email.html_body =~ "<literal>"
      refute email.text_body =~ "%{"
      true
    end)

    assert Notifications.get_notification!(notification.id).email_sent
  end

  defp flush_emails do
    receive do
      {:email, _} -> flush_emails()
      {:emails, _} -> flush_emails()
    after
      0 -> :ok
    end
  end
  test "company and guest activity deliveries scope each recipient and honor flag rollback" do
    ctx = Operately.Support.Factory.setup(%{}) |> Operately.Support.Factory.enable_feature("i18n")
    {:ok, person} = Operately.People.update_person(ctx.creator, %{language: "pt-BR"})
    actions = ~w(company_admin_added company_admin_removed company_owner_removing company_owners_adding
      company_member_restoring company_member_converted_to_guest company_members_permissions_edited guest_invited company_member_added)
    previous = Gettext.get_locale(OperatelyWeb.Gettext)

    for action <- actions do
      activity = Operately.ActivitiesFixtures.activity_fixture(author_id: person.id, action: action,
        content: %{"members" => [%{"person_id" => person.id, "previous_access_level" => 10, "updated_access_level" => 70}]})
      {:ok, company} = Operately.Companies.enable_experimental_feature(ctx.company, "i18n")
      notification = Operately.NotificationsFixtures.notification_fixture(person_id: person.id, activity_id: activity.id)
      assert {:ok, :sent} = EmailWorker.deliver(notification)
      assert_receive {:email, portuguese}
      {:ok, _} = Operately.Companies.disable_experimental_feature(company, "i18n")
      notification = Operately.NotificationsFixtures.notification_fixture(person_id: person.id, activity_id: activity.id)
      assert {:ok, :sent} = EmailWorker.deliver(notification)
      assert_receive {:email, english}
      assert portuguese.subject != english.subject, action
      assert portuguese.html_body != english.html_body, action
      assert portuguese.text_body != english.text_body, action
      assert portuguese.to == english.to
      assert portuguese.from == english.from
      assert Gettext.get_locale(OperatelyWeb.Gettext) == previous
    end
  end

end
