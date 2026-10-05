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

  test "does not deliver later groups when saving delivery progress fails" do
    company = %Operately.Companies.Company{enabled_experimental_features: ["i18n"]}
    english = %Operately.People.Person{id: "english", language: "en"}
    portuguese = %Operately.People.Person{id: "portuguese", language: "pt-BR"}
    job = %Oban.Job{id: 1, meta: %{}} |> Ecto.put_meta(state: :loaded)

    with_mocks [
      {OperatelyEmail.Mailers.BaseMailer, [], [deliver_now: fn :email -> {:ok, :sent} end]},
      {Operately.Repo, [], [update: fn _ -> {:error, :checkpoint_unavailable} end]}
    ] do
      result =
        BillingMailer.deliver(
          [english, portuguese],
          company,
          fn people ->
            send(self(), {:rendered, people})
            :email
          end,
          job
        )

      assert result == {:error, :checkpoint_unavailable}
      assert_receive {:rendered, [^english]}
      refute_receive {:rendered, _}
    end
  end
end
