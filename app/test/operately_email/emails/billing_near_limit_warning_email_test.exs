defmodule OperatelyEmail.Emails.BillingNearLimitWarningEmailTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Swoosh.TestAssertions

  alias Operately.Billing.NearLimitAlerting
  alias OperatelyEmail.Emails.BillingNearLimitWarningEmail

  setup do
    company = company_fixture()
    admin = person_fixture_with_account(%{company_id: company.id, full_name: "Admin Adminson"})
    owner = person_fixture_with_account(%{company_id: company.id, full_name: "Owner Ownerson"})

    {:ok, company: company, admin: admin, owner: owner}
  end

  test "sends a multi-recipient member near-limit email with billing CTA", ctx do
    status = NearLimitAlerting.snapshot(:member_count, 18, 20)

    assert {:ok, _} = BillingNearLimitWarningEmail.send([ctx.admin, ctx.owner], ctx.company, status)

    assert_email_sent(fn email ->
      assert email.subject == "#{ctx.company.name} is near its Free plan member limit"
      assert Enum.sort(Enum.map(email.to, &elem(&1, 1))) == Enum.sort([ctx.admin.email, ctx.owner.email])
      assert email.html_body =~ "#{ctx.company.name} has 18 of 20 active members on the Free plan."
      assert email.html_body =~ "Adding or restoring people will be blocked once the member limit is reached."
      assert email.html_body =~ "Review billing"
      assert email.text_body =~ "#{ctx.company.name} is near its Free plan member limit."
      assert email.text_body =~ OperatelyWeb.Paths.company_billing_path(ctx.company)
      true
    end)
  end

  test "sends a storage near-limit email", ctx do
    status = NearLimitAlerting.snapshot(:storage_bytes, 966_367_642, 1_073_741_824)

    assert {:ok, _} = BillingNearLimitWarningEmail.send([ctx.admin, ctx.owner], ctx.company, status)

    assert_email_sent(fn email ->
      assert email.subject == "#{ctx.company.name} is near its Free plan storage limit"
      assert email.html_body =~ "#{ctx.company.name} is using 921.6 MB of 1.0 GB on the Free plan."
      assert email.html_body =~ "Uploading files will be blocked once the storage limit is reached."
      assert email.html_body =~ "Review billing"
      assert email.text_body =~ "#{ctx.company.name} is near its Free plan storage limit."
      assert email.text_body =~ OperatelyWeb.Paths.company_billing_path(ctx.company)
      true
    end)
  end

  test "formats storage usage across byte ranges" do
    assert BillingNearLimitWarningEmail.format_usage(:storage_bytes, 512) == "512 B"
    assert BillingNearLimitWarningEmail.format_usage(:storage_bytes, 1_073_741_824) == "1.0 GB"
    assert BillingNearLimitWarningEmail.format_usage(:storage_bytes, 1_125_899_906_842_624) == "1.0 PB"
  end
  for {language, subject, action} <- [{"pt-BR", "plano Gratuito", "Revisar faturamento"}, {"de", "kostenlosen Tarifs", "Abrechnung prüfen"}, {"ru", "бесплатного тарифа", "Проверить оплату"}, {"fr", "forfait gratuit", "Consulter la facturation"}, {"es", "plan gratuito", "Revisar facturación"}] do
    test "#{language} billing recipients get translations and flag rollback uses English", ctx do
      {:ok, company} = Operately.Companies.enable_experimental_feature(ctx.company, "i18n")
      {:ok, recipient} = Operately.People.update_person(ctx.admin, %{language: unquote(language)})
      previous = Gettext.get_locale(OperatelyWeb.Gettext)
      status = NearLimitAlerting.snapshot(:member_count, 20, 20)
      assert {:ok, _} = BillingNearLimitWarningEmail.send([recipient, ctx.owner], company, status)
      emails = for _ <- 1..2 do
        assert_receive {:email, email}
        email
      end
      translated = Enum.find(emails, &(&1.to == [{recipient.full_name, recipient.email}]))
      english = Enum.find(emails, &(&1.to == [{ctx.owner.full_name, ctx.owner.email}]))
      assert translated.subject =~ unquote(subject)
      assert translated.html_body =~ unquote(action)
      assert translated.text_body =~ unquote(action)
      assert english.subject =~ "Free plan"
      assert Gettext.get_locale(OperatelyWeb.Gettext) == previous

      {:ok, company} = Operately.Companies.disable_experimental_feature(company, "i18n")
      assert {:ok, _} = BillingNearLimitWarningEmail.send([recipient, ctx.owner], company, status)
      assert_email_sent(fn email ->
        assert length(email.to) == 2
        assert email.subject =~ "Free plan"
        true
      end)
      assert Operately.Repo.reload!(recipient).language == unquote(language)
    end
  end

  test "billing renders translations and missing-locale fallback with escaped names", ctx do
    company = %{ctx.company | name: "Company <literal> & name"}
    for locale <- ["pt_BR", "de", "ru", "fr", "es"], key <- [:member_count, :storage_bytes], usage <- [0, 1, 20] do
      status = NearLimitAlerting.snapshot(key, usage, 20)
      english = Gettext.with_locale(OperatelyWeb.Gettext, "en", fn -> BillingNearLimitWarningEmail.build([ctx.admin], company, status) end)
      fallback = Gettext.with_locale(OperatelyWeb.Gettext, "nl", fn -> BillingNearLimitWarningEmail.build([ctx.admin], company, status) end)
      translated = Gettext.with_locale(OperatelyWeb.Gettext, locale, fn -> BillingNearLimitWarningEmail.build([ctx.admin], company, status) end)
      assert english == fallback
      assert translated.subject != english.subject
      assert translated.html_body =~ "Company &lt;literal&gt; &amp; name"
      assert translated.text_body =~ company.name
      assert translated.text_body =~ "#{usage}"
      assert translated.to == english.to
    end
  end

end
