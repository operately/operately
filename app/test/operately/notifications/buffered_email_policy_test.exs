defmodule Operately.Notifications.BufferedEmailPolicyTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures

  alias Operately.Companies
  alias Operately.Notifications.BufferedEmailPolicy

  describe "enabled?/1" do
    test "is disabled by default and can be enabled per company" do
      company = company_fixture()

      refute BufferedEmailPolicy.enabled?(company)

      {:ok, company} = Companies.enable_experimental_feature(company, BufferedEmailPolicy.feature_name())

      assert BufferedEmailPolicy.enabled?(company)
    end
  end

  describe "buffer window" do
    test "uses the policy default of five minutes" do
      assert BufferedEmailPolicy.buffer_window_minutes() == 5
      assert BufferedEmailPolicy.buffer_window_seconds() == 300
    end
  end

  describe "action policy" do
    test "identifies bypassed actions" do
      assert BufferedEmailPolicy.bypass_action?(:guest_invited)
      assert BufferedEmailPolicy.bypass_action?("project_permissions_edited")
      refute BufferedEmailPolicy.bypass_action?("project_due_date_updating")
      assert BufferedEmailPolicy.bufferable_action?("project_due_date_updating")
    end
  end
end
