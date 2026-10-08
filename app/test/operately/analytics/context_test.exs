defmodule Operately.Analytics.ContextTest do
  use ExUnit.Case, async: true
  alias Operately.Analytics.Context

  test "only denial is accepted as a preference" do
    assert Context.normalize(%{preference: "denied"}).preference == "denied"
    assert Context.normalize(%{preference: "granted"}).preference == "unspecified"
  end

  test "optional malformed context is ignored and arbitrary metadata cannot pass through" do
    for input <- [nil, [], "broken", 42], do: assert(Context.normalize(input).attribution == %{})

    result =
      Context.normalize(%{
        "anonymous_id" => "invalid",
        "account_id" => Ecto.UUID.generate(),
        "preference" => "anything",
        "attribution" => %{"email" => "secret", "landing_path" => "/sign_up?token=secret#fragment", "utm_campaign" => String.duplicate("x", 600)}
      })

    assert result.anonymous_id == nil
    assert result.preference == "unspecified"
    assert result.attribution == %{"landing_path" => "/sign_up"}
    refute Map.has_key?(result, :account_id)
  end
end
