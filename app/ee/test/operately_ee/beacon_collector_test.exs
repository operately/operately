defmodule OperatelyEE.BeaconCollectorTest do
  use Operately.DataCase

  import Mock

  alias OperatelyEE.BeaconCollector

  @valid_beacon_data %{
    "version" => "0.1.0",
    "operating_system" => "linux",
    "timestamp" => "2024-01-01T00:00:00Z"
  }

  describe "process_beacon/1" do
    test "processes valid beacon data successfully" do
      with_mock System, [:passthrough], get_env: fn "POSTHOG_API_KEY" -> "test_api_key" end do
        with_mock Finch, [:passthrough], request: fn _request, _finch, _opts ->
          {:ok, %Finch.Response{status: 200, body: "success", headers: []}}
        end do
          result = BeaconCollector.process_beacon(@valid_beacon_data)
          
          assert result == :ok
          assert called(Finch.request(:_, :_, :_))
        end
      end
    end

    test "returns error for invalid beacon data" do
      result = BeaconCollector.process_beacon("invalid")
      
      assert result == {:error, :invalid_beacon_data}
    end

    test "returns error for missing required fields" do
      invalid_data = %{"version" => "0.1.0"}
      
      result = BeaconCollector.process_beacon(invalid_data)
      
      assert {:error, {:missing_fields, missing}} = result
      assert "operating_system" in missing
      assert "timestamp" in missing
    end

    test "handles PostHog API errors gracefully" do
      with_mock System, [:passthrough], get_env: fn "POSTHOG_API_KEY" -> "test_api_key" end do
        with_mock Finch, [:passthrough], request: fn _request, _finch, _opts ->
          {:ok, %Finch.Response{status: 500, body: "Server Error", headers: []}}
        end do
          result = BeaconCollector.process_beacon(@valid_beacon_data)
          
          assert {:error, {:posthog_error, {:http_error, 500, "Server Error"}}} = result
        end
      end
    end

    test "handles network errors gracefully" do
      with_mock System, [:passthrough], get_env: fn "POSTHOG_API_KEY" -> "test_api_key" end do
        with_mock Finch, [:passthrough], request: fn _request, _finch, _opts ->
          {:error, :timeout}
        end do
          result = BeaconCollector.process_beacon(@valid_beacon_data)
          
          assert {:error, {:posthog_error, {:request_failed, :timeout}}} = result
        end
      end
    end
  end

  describe "validate_beacon_data/1" do
    test "validates complete beacon data" do
      result = BeaconCollector.validate_beacon_data(@valid_beacon_data)
      
      assert {:ok, @valid_beacon_data} = result
    end

    test "identifies missing version field" do
      data = Map.delete(@valid_beacon_data, "version")
      
      result = BeaconCollector.validate_beacon_data(data)
      
      assert {:error, {:missing_fields, ["version"]}} = result
    end

    test "identifies missing operating_system field" do
      data = Map.delete(@valid_beacon_data, "operating_system")
      
      result = BeaconCollector.validate_beacon_data(data)
      
      assert {:error, {:missing_fields, ["operating_system"]}} = result
    end

    test "identifies missing timestamp field" do
      data = Map.delete(@valid_beacon_data, "timestamp")
      
      result = BeaconCollector.validate_beacon_data(data)
      
      assert {:error, {:missing_fields, ["timestamp"]}} = result
    end

    test "identifies multiple missing fields" do
      data = %{"version" => "0.1.0"}
      
      result = BeaconCollector.validate_beacon_data(data)
      
      assert {:error, {:missing_fields, missing}} = result
      assert "operating_system" in missing
      assert "timestamp" in missing
      assert length(missing) == 2
    end
  end

  describe "forward_to_posthog/1" do
    test "successfully forwards to PostHog" do
      with_mock System, [:passthrough], get_env: fn "POSTHOG_API_KEY" -> "test_api_key" end do
        with_mock Finch, [:passthrough], request: fn request, _finch, _opts ->
          # Validate the request to PostHog
          assert %Finch.Request{
            method: "POST",
            url: "https://app.posthog.com/capture/"
          } = request
          
          # Validate the JSON body structure
          data = Jason.decode!(request.body)
          assert data["api_key"] == "test_api_key"
          assert data["event"] == "self_hosted_beacon"
          assert Map.has_key?(data, "properties")
          assert Map.has_key?(data, "distinct_id")
          assert Map.has_key?(data, "timestamp")
          
          properties = data["properties"]
          assert properties["operately_version"] == "0.1.0"
          assert properties["operating_system"] == "linux"
          assert properties["beacon_timestamp"] == "2024-01-01T00:00:00Z"
          assert Map.has_key?(properties, "processed_at")
          
          {:ok, %Finch.Response{status: 200, body: "success", headers: []}}
        end do
          result = BeaconCollector.forward_to_posthog(@valid_beacon_data)
          
          assert {:ok, :sent} = result
        end
      end
    end

    test "handles missing PostHog API key" do
      with_mock System, [:passthrough], get_env: fn "POSTHOG_API_KEY" -> nil end do
        assert_raise RuntimeError, "PostHog API key not configured", fn ->
          BeaconCollector.forward_to_posthog(@valid_beacon_data)
        end
      end
    end

    test "handles empty PostHog API key" do
      with_mock System, [:passthrough], get_env: fn "POSTHOG_API_KEY" -> "" end do
        assert_raise RuntimeError, "Invalid PostHog API key configuration", fn ->
          BeaconCollector.forward_to_posthog(@valid_beacon_data)
        end
      end
    end
  end

  describe "installation ID generation" do
    test "generates consistent installation IDs" do
      with_mock System, [:passthrough], get_env: fn "POSTHOG_API_KEY" -> "test_api_key" end do
        with_mock Finch, [:passthrough], request: fn request, _finch, _opts ->
          data = Jason.decode!(request.body)
          distinct_id = data["distinct_id"]
          
          {:ok, %Finch.Response{status: 200, body: "success", headers: []}}
        end do
          # Process the same beacon data twice
          BeaconCollector.forward_to_posthog(@valid_beacon_data)
          BeaconCollector.forward_to_posthog(@valid_beacon_data)
          
          # Both requests should have the same distinct_id
          calls = Meck.history(Finch)
          [call1, call2] = calls
          
          data1 = Jason.decode!(elem(call1, 1).body)
          data2 = Jason.decode!(elem(call2, 1).body)
          
          assert data1["distinct_id"] == data2["distinct_id"]
        end
      end
    end

    test "generates different IDs for different beacon data" do
      with_mock System, [:passthrough], get_env: fn "POSTHOG_API_KEY" -> "test_api_key" end do
        with_mock Finch, [:passthrough], request: fn _request, _finch, _opts ->
          {:ok, %Finch.Response{status: 200, body: "success", headers: []}}
        end do
          data1 = @valid_beacon_data
          data2 = Map.put(@valid_beacon_data, "operating_system", "macos")
          
          BeaconCollector.forward_to_posthog(data1)
          BeaconCollector.forward_to_posthog(data2)
          
          calls = Meck.history(Finch)
          [call1, call2] = calls
          
          body1 = Jason.decode!(elem(call1, 1).body)
          body2 = Jason.decode!(elem(call2, 1).body)
          
          assert body1["distinct_id"] != body2["distinct_id"]
        end
      end
    end
  end
end