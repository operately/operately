defmodule OperatelyEE.CompanyCreationNotificationJobTest do
  use Operately.DataCase
  import Mock

  @mock_url "https://discord.com/api/webhooks/1234567890/ABCDEFGHIJKLMN0123456789"

  setup ctx do
    ctx = Factory.setup(ctx) |> Factory.add_account(:account)

    current = Application.get_env(:operately, :send_company_creation_notifications)
    Application.put_env(:operately, :send_company_creation_notifications, true)
    Application.put_env(:operately, :company_creation_notification_webhook_url, @mock_url)

    on_exit(fn ->
      Application.put_env(:operately, :send_company_creation_notifications, current)
    end)

    {:ok, ctx}
  end

  test "it sends a notification to Discord", ctx do
    mock_response = {:ok, %{status: 204, body: "Mocked response"}}
    expected_content = "#{ctx.account.full_name} (#{ctx.account.email}) has added a new company: [#{ctx.company.name}](<#{OperatelyWeb.Endpoint.url()}/admin/companies/#{OperatelyWeb.Paths.company_id(ctx.company)}>)"

    with_mock Req, [post: fn(_url, headers: _headers, json: _body) -> mock_response end] do
      assert :ok = OperatelyEE.CompanyCreationNotificationJob.perform(%{args: %{
        "account_id" => ctx.account.id,
        "company_id" => ctx.company.id
      }})

      assert_called Req.post(
        :meck.is(fn u ->
          assert u == @mock_url

          true
        end),
        :meck.is(fn options ->
          headers = Keyword.get(options, :headers)
          body = Keyword.get(options, :json)

          assert headers == [{"Content-Type", "application/json"}]
          assert body == %{ content: expected_content }

          true
        end)
      )
    end
  end
end
