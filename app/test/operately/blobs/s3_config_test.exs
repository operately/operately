defmodule Operately.Blobs.S3ConfigTest do
  use ExUnit.Case

  alias Operately.Blobs.S3Config

  setup do
    previous_env = Map.new(s3_env(), fn {key, _value} -> {key, System.get_env(key)} end)
    Enum.each(s3_env(), fn {key, value} -> System.put_env(key, value) end)

    on_exit(fn ->
      Enum.each(previous_env, fn {key, value} -> restore_system_env(key, value) end)
    end)

    :ok
  end

  test "request_config preserves non-AWS regions for S3-compatible storage" do
    config = S3Config.request_config()

    assert config.region == "us-east-005"
    assert config.host == "localhost"
    assert config.scheme == "http://"
    assert config.port == 9000
    assert config.virtual_host == false
    assert config.http_client == ExAws.Request.Hackney
  end

  test "presigned_url signs requests for S3-compatible storage with non-AWS regions" do
    assert {:ok, url} =
             S3Config.presigned_url(
               :put,
               "company-transfer/test.json",
               [{"Content-Type", "application/json"}],
               [],
               expires_in: 3600
             )

    decoded_url = URI.decode(url)

    assert decoded_url =~ "http://localhost:9000/test-bucket/company-transfer/test.json?"
    assert decoded_url =~ "X-Amz-Algorithm=AWS4-HMAC-SHA256"
    assert decoded_url =~ "/us-east-005/s3/aws4_request"
  end

  defp s3_env do
    [
      {"OPERATELY_STORAGE_S3_HOST", "localhost"},
      {"OPERATELY_STORAGE_S3_SCHEME", "http"},
      {"OPERATELY_STORAGE_S3_PORT", "9000"},
      {"OPERATELY_STORAGE_S3_BUCKET", "test-bucket"},
      {"OPERATELY_STORAGE_S3_REGION", "us-east-005"},
      {"OPERATELY_STORAGE_S3_ACCESS_KEY_ID", "test-access-key"},
      {"OPERATELY_STORAGE_S3_SECRET_ACCESS_KEY", "test-secret-key"}
    ]
  end

  defp restore_system_env(key, nil), do: System.delete_env(key)
  defp restore_system_env(key, value), do: System.put_env(key, value)
end
