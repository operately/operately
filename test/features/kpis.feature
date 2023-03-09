Feature: Key Performance Indicators

  Scenario Outline: Creating a KPI and setting the target value
    Given I am logged in as a user
    When I go to the KPI page
    And I click on the "Create KPI" button
    And I fill in the "Name" field with "<kpi name>"
    And I fill in the "Target value" field with "<target value>"
    And I select the "Target direction" option with "<target direction>"
    And I select the "Warning direction" option with "<warning direction>"
    And I fill in the "Warning threshold" field with "<warning threshold>"
    And I select the "Danger direction" option with "<danger direction>"
    And I fill in the "Danger threshold" field with "<danger threshold>"
    And I click on the "Create" button
    Then I should see "<kpi name>" in the KPI list

    Examples:
      | kpi name    | target | unit | target direction | target number | warning direction | warning threshold | danger direction | danger threshold |
      | Revenue     | 1000   | USD  | above            | 800           | above             | 600               | above            | 400              |
      | Engagement  | 70     | %    | above            | 50            | above             | 30                | above            | 10               |
      | Retention   | 90     | %    | above            | 80            | above             | 70                | above            | 60               |
