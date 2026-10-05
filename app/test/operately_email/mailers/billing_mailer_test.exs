defmodule OperatelyEmail.Mailers.BillingMailerTest do
  use ExUnit.Case
  import Mock

  alias OperatelyEmail.Mailers.BillingMailer

  test "returns delivery failures for retry and restores the previous locale" do
    company = %Operately.Companies.Company{enabled_experimental_features: ["i18n"]}
    person = %Operately.People.Person{language: "pt-BR"}
    previous = Gettext.get_locale(OperatelyWeb.Gettext)

    with_mock OperatelyEmail.Mailers.BaseMailer, deliver_now: fn :email -> {:error, :smtp_unavailable} end do
      result =
        BillingMailer.deliver([person], company, fn [^person] ->
          assert Gettext.get_locale(OperatelyWeb.Gettext) == "pt_BR"
          :email
        end)

      assert result == {:error, :smtp_unavailable}
      assert Gettext.get_locale(OperatelyWeb.Gettext) == previous
    end
  end
end
